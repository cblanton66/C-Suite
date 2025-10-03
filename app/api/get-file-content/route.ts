import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('filePath')

    if (!filePath) {
      return NextResponse.json({ error: 'Missing filePath parameter' }, { status: 400 })
    }

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
    const file = bucket.file(filePath)

    // Check if file exists
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Download file content
    const [content] = await file.download()
    const contentString = content.toString('utf-8')

    return NextResponse.json({
      success: true,
      content: contentString
    })

  } catch (error) {
    console.error('File content fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch file content' }, { status: 500 })
  }
}
