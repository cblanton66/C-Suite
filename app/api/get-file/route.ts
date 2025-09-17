import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('file')

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 })
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
    const file = bucket.file(fileName)

    // Check if file exists
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get file metadata
    const [metadata] = await file.getMetadata()

    // Generate a signed URL that expires in 1 hour
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    })

    return NextResponse.json({ 
      success: true,
      signedUrl,
      fileName,
      originalName: metadata.metadata?.originalName || fileName,
      size: metadata.size,
      contentType: metadata.contentType,
      uploadedAt: metadata.metadata?.uploadedAt,
    })

  } catch (error) {
    console.error('File retrieval error:', error)
    return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 })
  }
}