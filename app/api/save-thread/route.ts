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

export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceOwner, clientName, title, projectType, status, priority, messages } = await req.json()

    if (!userId || !clientName || !title || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use workspaceOwner for file path (where files are stored)
    // Use userId to track who created the thread
    const fileOwner = workspaceOwner || userId

    // Create a structured thread document
    const threadData = {
      metadata: {
        clientName,
        title,
        projectType: projectType || "General",
        status: status || "Active",
        priority: priority || "Normal",
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        messageCount: messages.length,
        createdBy: userId // Track who created this thread
      },
      conversation: messages,
      threadId: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Save directly to Google Cloud Storage with proper thread filename
    const storage = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME
    
    if (!bucketName) {
      console.error('GOOGLE_CLOUD_BUCKET_NAME environment variable is not set')
      return NextResponse.json({ error: "Storage configuration error" }, { status: 500 })
    }

    // Convert email to Google Cloud folder format (use workspace owner for file path)
    const folderUserId = fileOwner.replace(/@/g, '_').replace(/\./g, '_')
    const clientFolder = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

    const bucket = storage.bucket(bucketName)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `[THREAD] ${title} - ${projectType} - ${timestamp}.json`

    // NEW STRUCTURE: Save threads to client-files/{client}/threads/
    const filePath = `Reports-view/${folderUserId}/client-files/${clientFolder}/threads/${fileName}`

    // OLD STRUCTURE (kept as comment for reference):
    // const filePath = `Reports-view/${folderUserId}/private/${clientFolder}/${fileName}`
    
    const content = JSON.stringify(threadData, null, 2)
    
    try {
      const file = bucket.file(filePath)
      await file.save(content, {
        metadata: {
          contentType: 'application/json',
        },
      })

      console.log(`[save-thread] Saved thread to ${filePath}`)
      
      return NextResponse.json({ 
        success: true, 
        message: "Conversation thread saved successfully",
        threadId: threadData.threadId
      })
    } catch (saveError) {
      console.error('Error saving thread to Google Cloud Storage:', saveError)
      return NextResponse.json({ error: "Failed to save conversation thread" }, { status: 500 })
    }
  } catch (error) {
    console.error("Save thread API error:", error)
    return NextResponse.json({ error: "Failed to process save request" }, { status: 500 })
  }
}