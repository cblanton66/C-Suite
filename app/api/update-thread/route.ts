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
    const { userId, filePath, clientName, title, projectType, status, priority } = await req.json()

    if (!userId || !filePath || !clientName || !title) {
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

    // Update the metadata
    threadData.metadata = {
      ...threadData.metadata,
      clientName,
      title,
      projectType: projectType || "General",
      status: status || "Active",
      priority: priority || "Normal",
      lastUpdated: new Date().toISOString()
    }

    // If client name changed, we need to move the file to the new client folder
    const folderUserId = userId.replace(/@/g, '_').replace(/\./g, '_')
    const newClientFolder = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const newFileName = `[THREAD] ${title} - ${projectType} - ${timestamp}.json`
    const newFilePath = `Reports-view/${folderUserId}/private/${newClientFolder}/${newFileName}`

    // Save the updated thread content
    const updatedContent = JSON.stringify(threadData, null, 2)
    
    try {
      // Save to new location
      const newFile = bucket.file(newFilePath)
      await newFile.save(updatedContent, {
        metadata: {
          contentType: 'application/json',
        },
      })

      // Delete old file if path changed
      if (newFilePath !== filePath) {
        await file.delete()
        console.log(`[update-thread] Moved thread from ${filePath} to ${newFilePath}`)
      } else {
        console.log(`[update-thread] Updated thread at ${filePath}`)
      }

      return NextResponse.json({ 
        success: true, 
        message: "Thread updated successfully",
        newFilePath: newFilePath
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