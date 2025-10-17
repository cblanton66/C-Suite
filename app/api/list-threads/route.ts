import { type NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'

export const dynamic = 'force-dynamic'

let storage: Storage | null = null

const initializeStorage = () => {
  if (!storage) {
    let credentials = undefined
    if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
      try {
        // Decode base64 credentials
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const workspaceOwner = searchParams.get('workspaceOwner')
    const includeArchive = searchParams.get('includeArchive') === 'true'
    const clientName = searchParams.get('clientName')

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    const storage = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME

    if (!bucketName) {
      console.error('GOOGLE_CLOUD_BUCKET_NAME environment variable is not set')
      return NextResponse.json({ error: "Storage configuration error" }, { status: 500 })
    }

    // Use workspaceOwner for file path (where to look for files)
    const fileOwner = workspaceOwner || userId

    // Convert email to Google Cloud folder format
    const folderUserId = fileOwner.replace(/@/g, '_').replace(/\./g, '_')
    const bucket = storage.bucket(bucketName)

    // If clientName is provided, convert it to slug format for folder path
    const clientSlug = clientName ? clientName.toLowerCase().replace(/\s+/g, '-') : null

    // Search prefixes - include archive if requested
    // If clientName is provided, only search that specific client's folders
    const searchPrefixes = []
    if (clientSlug) {
      searchPrefixes.push(`Reports-view/${folderUserId}/client-files/${clientSlug}/`)
      if (includeArchive) {
        searchPrefixes.push(`Reports-view/${folderUserId}/archive/${clientSlug}/`)
      }
    } else {
      searchPrefixes.push(`Reports-view/${folderUserId}/client-files/`)
      if (includeArchive) {
        searchPrefixes.push(`Reports-view/${folderUserId}/archive/`)
      }
    }

    const threads = []
    let totalFiles = 0

    // Search all prefixes
    for (const prefix of searchPrefixes) {
      console.log(`[list-threads] Searching: ${prefix}`)
      const [files] = await bucket.getFiles({ prefix })
      console.log(`[list-threads] Found ${files.length} files in ${prefix}`)
      totalFiles += files.length

      for (const file of files) {
        try {
          // Only look in /threads/ subdirectory
          if (!file.name.includes('/threads/')) continue

          const fileName = file.name.split('/').pop() || ''

          // Check if this is a thread file
          if (fileName.startsWith('[THREAD]') && fileName.endsWith('.json')) {
            console.log(`[list-threads] Found thread file: ${file.name}`)
            const [content] = await file.download()
            const threadData = JSON.parse(content.toString())

            // Mark if this thread is archived
            const isArchived = file.name.includes('/archive/')

            threads.push({
              threadId: threadData.threadId,
              fileName: fileName,
              filePath: file.name,
              metadata: threadData.metadata,
              messageCount: threadData.conversation?.length || 0,
              lastUpdated: file.metadata?.timeCreated || threadData.metadata?.createdAt,
              isArchived: isArchived
            })
          }
        } catch (parseError) {
          console.error(`Error parsing thread file ${file.name}:`, parseError)
          continue
        }
      }
    }

    console.log(`[list-threads] Found ${threads.length} thread files (includeArchive: ${includeArchive})`)

    // Sort threads by last updated (newest first)
    threads.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())

    return NextResponse.json({ 
      success: true, 
      threads: threads,
      total: threads.length
    })
  } catch (error) {
    console.error("List threads API error:", error)
    return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 })
  }
}