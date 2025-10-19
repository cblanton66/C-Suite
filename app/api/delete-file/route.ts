import { type NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'

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

export async function DELETE(req: NextRequest) {
  try {
    const { filePath } = await req.json()

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 })
    }

    console.log('[DELETE_FILE] Deleting file:', filePath)

    // Initialize Google Cloud Storage
    const gcs = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME

    if (!bucketName) {
      console.error('[DELETE_FILE] GOOGLE_CLOUD_BUCKET_NAME not set')
      return NextResponse.json({ error: "Storage configuration error" }, { status: 500 })
    }

    const bucket = gcs.bucket(bucketName)
    const file = bucket.file(filePath)

    // Check if file exists
    const [exists] = await file.exists()
    if (!exists) {
      console.log('[DELETE_FILE] File not found:', filePath)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Delete the file
    await file.delete()

    console.log('[DELETE_FILE] File deleted successfully:', filePath)

    return NextResponse.json({
      success: true,
      message: "File deleted successfully"
    })

  } catch (error) {
    console.error('[DELETE_FILE] Error:', error)
    return NextResponse.json({
      error: 'Failed to delete file'
    }, { status: 500 })
  }
}
