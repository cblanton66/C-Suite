import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

export async function GET(request: NextRequest) {
  try {
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

    // List all files in the bucket
    const [files] = await bucket.getFiles()

    const fileList = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata()
        return {
          fileName: file.name,
          originalName: metadata.metadata?.originalName || file.name,
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