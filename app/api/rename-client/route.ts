import { type NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'
import { supabaseAdmin } from '@/lib/supabase'
import { refreshClientMetadata } from '@/lib/client-metadata'

let storage: Storage | null = null

const initializeStorage = () => {
  if (!storage) {
    let credentials = undefined
    if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
      try {
        const decodedCredentials = Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS, 'base64').toString('utf-8')
        credentials = JSON.parse(decodedCredentials)
      } catch (error) {
        console.error('Error parsing Google Cloud credentials:', error)
      }
    }

    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials,
    })
  }
  return storage
}

export async function POST(req: NextRequest) {
  try {
    const { clientId, oldClientName, newClientName, userEmail, workspaceOwner } = await req.json()

    if (!clientId || !oldClientName || !newClientName || !userEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate new client name
    if (newClientName.trim().length === 0) {
      return NextResponse.json({ error: "Client name cannot be empty" }, { status: 400 })
    }

    console.log('[RENAME_CLIENT] Starting rename:', {
      clientId,
      oldClientName,
      newClientName,
      userEmail,
      workspaceOwner
    })

    const fileOwner = workspaceOwner || userEmail
    const folderUserId = fileOwner.replace(/@/g, '_').replace(/\./g, '_')

    const oldSlug = oldClientName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    const newSlug = newClientName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

    // If slugs are the same, only update Supabase
    if (oldSlug === newSlug) {
      console.log('[RENAME_CLIENT] Slugs are identical, only updating Supabase')

      const { error: updateError } = await supabaseAdmin
        .from('clients')
        .update({ client_name: newClientName })
        .eq('client_id', clientId)

      if (updateError) {
        console.error('[RENAME_CLIENT] Supabase update error:', updateError)
        return NextResponse.json({ error: 'Failed to update client name' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Client name updated successfully',
        folderRenamed: false
      })
    }

    // Initialize Google Cloud Storage
    const gcs = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME

    if (!bucketName) {
      console.error('[RENAME_CLIENT] GOOGLE_CLOUD_BUCKET_NAME not set')
      return NextResponse.json({ error: "Storage configuration error" }, { status: 500 })
    }

    const bucket = gcs.bucket(bucketName)

    const oldFolderPath = `Reports-view/${folderUserId}/client-files/${oldSlug}/`
    const newFolderPath = `Reports-view/${folderUserId}/client-files/${newSlug}/`

    console.log('[RENAME_CLIENT] Moving files from:', oldFolderPath, 'to:', newFolderPath)

    // Check if old folder exists
    const [oldFiles] = await bucket.getFiles({ prefix: oldFolderPath })

    if (oldFiles.length === 0) {
      console.log('[RENAME_CLIENT] No files found in old folder, proceeding with Supabase update only')

      const { error: updateError } = await supabaseAdmin
        .from('clients')
        .update({ client_name: newClientName })
        .eq('client_id', clientId)

      if (updateError) {
        console.error('[RENAME_CLIENT] Supabase update error:', updateError)
        return NextResponse.json({ error: 'Failed to update client name' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Client name updated successfully (no files to move)',
        folderRenamed: false,
        filesProcessed: 0
      })
    }

    console.log('[RENAME_CLIENT] Found', oldFiles.length, 'files to move')

    // Check if new folder already exists
    const [newFiles] = await bucket.getFiles({ prefix: newFolderPath, maxResults: 1 })
    if (newFiles.length > 0) {
      return NextResponse.json({
        error: `A client folder named "${newClientName}" already exists. Please choose a different name or merge manually.`
      }, { status: 409 })
    }

    // Move files from old folder to new folder
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (const file of oldFiles) {
      try {
        // Skip the old metadata file - we'll regenerate it
        if (file.name.endsWith('/_metadata.json')) {
          console.log('[RENAME_CLIENT] Skipping old metadata file:', file.name)
          continue
        }

        const relativePath = file.name.substring(oldFolderPath.length)
        const newFilePath = newFolderPath + relativePath

        console.log('[RENAME_CLIENT] Moving:', file.name, '->', newFilePath)

        // Copy file to new location
        await file.copy(newFilePath)

        // Delete old file
        await file.delete()

        successCount++
      } catch (error) {
        console.error('[RENAME_CLIENT] Error moving file:', file.name, error)
        failCount++
        errors.push(`Failed to move ${file.name}`)
      }
    }

    console.log('[RENAME_CLIENT] File migration complete:', {
      success: successCount,
      failed: failCount
    })

    if (failCount > 0 && successCount === 0) {
      return NextResponse.json({
        error: `Failed to move files. ${errors.join(', ')}`
      }, { status: 500 })
    }

    // Update client name in Supabase
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({ client_name: newClientName })
      .eq('client_id', clientId)

    if (updateError) {
      console.error('[RENAME_CLIENT] Supabase update error:', updateError)
      return NextResponse.json({
        error: 'Files moved but failed to update client name in database. Please contact support.',
        filesProcessed: successCount
      }, { status: 500 })
    }

    // Regenerate metadata for new client folder
    console.log('[RENAME_CLIENT] Regenerating metadata for new folder')
    try {
      await refreshClientMetadata(fileOwner, newClientName, newSlug)
    } catch (metadataError) {
      console.error('[RENAME_CLIENT] Failed to regenerate metadata:', metadataError)
      // Don't fail the whole operation for metadata
    }

    // Clean up old metadata file if it still exists
    try {
      const oldMetadataPath = `${oldFolderPath}_metadata.json`
      const oldMetadataFile = bucket.file(oldMetadataPath)
      const [exists] = await oldMetadataFile.exists()
      if (exists) {
        await oldMetadataFile.delete()
        console.log('[RENAME_CLIENT] Deleted old metadata file')
      }
    } catch (cleanupError) {
      console.error('[RENAME_CLIENT] Failed to clean up old metadata:', cleanupError)
    }

    console.log('[RENAME_CLIENT] Rename complete successfully')

    return NextResponse.json({
      success: true,
      message: `Client renamed successfully. ${successCount} files moved.`,
      folderRenamed: true,
      filesProcessed: successCount,
      filesFailed: failCount,
      ...(failCount > 0 && { warnings: errors })
    })

  } catch (error) {
    console.error('[RENAME_CLIENT] Error:', error)
    return NextResponse.json({
      error: 'Failed to rename client. Please try again or contact support.'
    }, { status: 500 })
  }
}
