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
    const filePath = searchParams.get('filePath')

    if (!userId || !filePath) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const storage = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME
    
    if (!bucketName) {
      console.error('GOOGLE_CLOUD_BUCKET_NAME environment variable is not set')
      return NextResponse.json({ error: "Storage configuration error" }, { status: 500 })
    }

    const bucket = storage.bucket(bucketName)
    const file = bucket.file(filePath)

    // Check if file exists
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    // Download and parse the thread file
    const [content] = await file.download()
    const threadData = JSON.parse(content.toString())

    return NextResponse.json({ 
      success: true, 
      thread: threadData
    })
  } catch (error) {
    console.error("Load thread API error:", error)
    return NextResponse.json({ error: "Failed to load thread" }, { status: 500 })
  }
}