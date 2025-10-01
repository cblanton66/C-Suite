import { NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'

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

    // Get folder names from Google Cloud Storage
    const bucket = await getGoogleCloudStorage()
    const [files] = await bucket.getFiles({
      prefix: clientFilesPrefix,
      delimiter: '/', // This makes it only get top-level "folders"
    })

    // Extract unique client folder names
    const clientNames = new Set<string>()

    // Get prefixes (folder names) from the response
    const prefixes = files.map(file => file.name)

    for (const prefix of prefixes) {
      // Extract client name from path: Reports-view/{user}/client-files/{client}/
      const parts = prefix.replace(clientFilesPrefix, '').split('/')
      const clientFolder = parts[0]

      if (clientFolder) {
        // Convert folder name back to display name (kebab-case to Title Case)
        const clientName = clientFolder
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        clientNames.add(clientName)
      }
    }

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
