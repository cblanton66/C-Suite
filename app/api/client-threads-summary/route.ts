import { NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

async function getGoogleCloudStorage() {
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error('Google Cloud configuration missing')
  }

  const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))

  const storage = new Storage({
    credentials,
    projectId: credentials.project_id,
  })

  return storage.bucket('peaksuite-files')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')
    const showAll = searchParams.get('showAll') === 'true' // Default to false (show only active)

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    // Convert email to folder format
    const userFolder = userEmail.replace(/@/g, '_').replace(/\./g, '_')
    const clientFilesPrefix = `Reports-view/${userFolder}/client-files/`

    // Get all files from Google Cloud Storage
    const bucket = await getGoogleCloudStorage()
    const [files] = await bucket.getFiles({
      prefix: clientFilesPrefix,
    })

    console.log(`[client-threads-summary] Found ${files.length} files under ${clientFilesPrefix}`)

    // Group threads by client
    const clientMap = new Map<string, {
      clientName: string,
      threadCount: number,
      activeCount: number,
      lastUpdated: string
    }>()

    for (const file of files) {
      // Only count thread files
      if (!file.name.includes('/threads/') || !file.name.endsWith('.json')) {
        continue
      }

      // Extract client folder name
      const pathAfterPrefix = file.name.replace(clientFilesPrefix, '')
      const clientFolder = pathAfterPrefix.split('/')[0]

      if (clientFolder && clientFolder.trim()) {
        // Convert folder name to display name
        const clientName = clientFolder
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        const existing = clientMap.get(clientName) || {
          clientName,
          threadCount: 0,
          activeCount: 0,
          lastUpdated: file.updated || new Date().toISOString()
        }

        existing.threadCount++

        // Read thread file to check status
        try {
          const [fileContent] = await file.download()
          const threadData = JSON.parse(fileContent.toString())

          // Count as active if status is NOT "Completed"
          if (threadData.metadata?.status && threadData.metadata.status !== 'Completed') {
            existing.activeCount++
          }
        } catch (error) {
          console.error(`Error reading thread file ${file.name}:`, error)
          // If we can't read it, assume it's active to be safe
          existing.activeCount++
        }

        // Update last updated if this file is newer
        if (file.updated && new Date(file.updated) > new Date(existing.lastUpdated)) {
          existing.lastUpdated = file.updated
        }

        clientMap.set(clientName, existing)
      }
    }

    // Convert to array, optionally filter by active status, and sort by last updated (most recent first)
    let clientSummaries = Array.from(clientMap.values())

    // Filter to only clients with active projects (unless showAll is true)
    if (!showAll) {
      clientSummaries = clientSummaries.filter(client => client.activeCount > 0)
      console.log(`[client-threads-summary] Filtered to ${clientSummaries.length} clients with active projects (from ${clientMap.size} total)`)
    } else {
      console.log(`[client-threads-summary] Returning all ${clientSummaries.length} clients`)
    }

    // Sort by last updated (most recent first)
    clientSummaries.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())

    return NextResponse.json({
      success: true,
      clients: clientSummaries
    })

  } catch (error) {
    console.error('Client threads summary API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch client summaries'
    }, { status: 500 })
  }
}
