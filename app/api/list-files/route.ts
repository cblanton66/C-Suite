import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')
    const workspaceOwner = searchParams.get('workspaceOwner')
    const folder = searchParams.get('folder')
    const skipTitles = searchParams.get('skipTitles') === 'true'

    if (!process.env.GOOGLE_CREDENTIALS) {
      return NextResponse.json({ error: 'Google Cloud configuration missing' }, { status: 500 })
    }

    // Decode the base64 credentials
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))

    // Initialize Google Cloud Storage
    const storage = new Storage({
      credentials,
      projectId: credentials.project_id,
    })

    const bucket = storage.bucket('peaksuite-files')

    // Build the prefix for filtering
    let prefix = ''
    if (folder) {
      // Get the owner to use for folder path
      const owner = workspaceOwner || userEmail
      if (owner) {
        const folderUserId = owner.replace(/@/g, '_').replace(/\./g, '_')
        prefix = `Reports-view/${folderUserId}/${folder}/`
      }
    }

    console.log('[list-files] Listing files with prefix:', prefix || '(all files)')

    // List files with optional prefix
    const [files] = await bucket.getFiles(prefix ? { prefix } : {})

    console.log('[list-files] Found', files.length, 'files')

    const fileList = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata()
        let title = undefined

        // If this is a note file and we're not skipping titles, fetch the title from the content
        if (!skipTitles && file.name.includes('/notes/') && file.name.endsWith('.md') && !file.name.endsWith('.placeholder')) {
          try {
            const [content] = await file.download()
            const contentStr = content.toString()
            // Extract title from first line (markdown heading)
            const firstLine = contentStr.split('\n')[0]
            if (firstLine.startsWith('# ')) {
              title = firstLine.substring(2).trim()
            }
          } catch (err) {
            console.error('[list-files] Error reading note title:', err)
          }
        }

        return {
          name: file.name,
          fileName: file.name,
          originalName: metadata.metadata?.originalName || file.name,
          title: title,
          size: metadata.size,
          contentType: metadata.contentType,
          uploadedAt: metadata.metadata?.uploadedAt || metadata.timeCreated,
          lastModified: metadata.updated,
        }
      })
    )

    // Sort by upload date (newest first)
    fileList.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    return NextResponse.json({
      success: true,
      files: fileList,
      count: fileList.length
    })

  } catch (error) {
    console.error('File listing error:', error)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}