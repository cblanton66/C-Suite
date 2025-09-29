import { type NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'

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

export async function PUT(req: NextRequest) {
  try {
    const { userId, filePath, messages, clientName, title, projectType, status, priority } = await req.json()

    if (!userId || !filePath) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    // Download and parse the existing thread
    const [content] = await file.download()
    const threadData = JSON.parse(content.toString())

    // Update the conversation and metadata
    if (messages) {
      threadData.conversation = messages
    }
    
    threadData.metadata = {
      ...threadData.metadata,
      ...(clientName && { clientName }),
      ...(title && { title }),
      ...(projectType && { projectType }),
      ...(status && { status }),
      ...(priority && { priority }),
      lastUpdated: new Date().toISOString(),
      ...(messages && { messageCount: messages.length })
    }

    // Save the updated thread content back to the same location
    const updatedContent = JSON.stringify(threadData, null, 2)
    
    try {
      await file.save(updatedContent, {
        metadata: {
          contentType: 'application/json',
        },
      })

      console.log(`[update-thread] Updated thread at ${filePath}`)

      return NextResponse.json({ 
        success: true, 
        message: "Thread updated successfully"
      })
    } catch (saveError) {
      console.error('Error updating thread in Google Cloud Storage:', saveError)
      return NextResponse.json({ error: "Failed to update thread" }, { status: 500 })
    }
  } catch (error) {
    console.error("Update thread API error:", error)
    return NextResponse.json({ error: "Failed to process update request" }, { status: 500 })
  }
}