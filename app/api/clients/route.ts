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

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    // Convert email to folder format
    const userFolder = userEmail.replace(/@/g, '_').replace(/\./g, '_')
    const clientFilesPrefix = `Reports-view/${userFolder}/client-files/`

    // Get all files from Google Cloud Storage under this user's client-files
    const bucket = await getGoogleCloudStorage()
    const [files] = await bucket.getFiles({
      prefix: clientFilesPrefix,
    })

    console.log(`[clients API] Found ${files.length} files under ${clientFilesPrefix}`)

    // Extract unique client folder names from file paths
    const clientNames = new Set<string>()

    for (const file of files) {
      // File path example: Reports-view/{user}/client-files/{client}/reports/...
      // Extract the client folder name
      const pathAfterPrefix = file.name.replace(clientFilesPrefix, '')
      const clientFolder = pathAfterPrefix.split('/')[0]

      if (clientFolder && clientFolder.trim()) {
        // Convert folder name back to display name (kebab-case to Title Case)
        const clientName = clientFolder
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        clientNames.add(clientName)
      }
    }

    console.log(`[clients API] Extracted unique client folders:`, Array.from(clientNames))

    // Convert to sorted array
    const sortedClients = Array.from(clientNames).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    )

    console.log(`[clients API] Returning ${sortedClients.length} unique client names for user ${userEmail} from GCS folders`)

    return NextResponse.json({
      success: true,
      clients: sortedClients
    })

  } catch (error) {
    console.error('Clients API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch client names'
    }, { status: 500 })
  }
}
