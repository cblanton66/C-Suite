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

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    const storage = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME
    
    if (!bucketName) {
      console.error('GOOGLE_CLOUD_BUCKET_NAME environment variable is not set')
      return NextResponse.json({ error: "Storage configuration error" }, { status: 500 })
    }

    // Convert email to Google Cloud folder format
    const folderUserId = userId.replace(/@/g, '_').replace(/\./g, '_')
    const bucket = storage.bucket(bucketName)

    // NEW STRUCTURE: Reports-view/{user}/client-files/{client}/threads/
    // OLD STRUCTURE: Reports-view/{user}/private/{client}/ (for backward compatibility)
    const newStructurePrefix = `Reports-view/${folderUserId}/client-files/`
    const oldStructurePrefix = `Reports-view/${folderUserId}/private/`

    const threads = []

    // Search in NEW structure first
    console.log(`[list-threads] Searching NEW structure: ${newStructurePrefix}`)
    const [newFiles] = await bucket.getFiles({ prefix: newStructurePrefix })
    console.log(`[list-threads] Found ${newFiles.length} files in new structure`)

    for (const file of newFiles) {
      try {
        // Only look in /threads/ subdirectory
        if (!file.name.includes('/threads/')) continue

        const fileName = file.name.split('/').pop() || ''

        // Check if this is a thread file
        if (fileName.startsWith('[THREAD]') && fileName.endsWith('.json')) {
          console.log(`[list-threads] Found thread file: ${file.name}`)
          const [content] = await file.download()
          const threadData = JSON.parse(content.toString())

          threads.push({
            threadId: threadData.threadId,
            fileName: fileName,
            filePath: file.name,
            metadata: threadData.metadata,
            messageCount: threadData.conversation?.length || 0,
            lastUpdated: file.metadata?.timeCreated || threadData.metadata?.createdAt
          })
        }
      } catch (parseError) {
        console.error(`Error parsing thread file ${file.name}:`, parseError)
        continue
      }
    }

    // Search in OLD structure for backward compatibility
    console.log(`[list-threads] Searching OLD structure: ${oldStructurePrefix}`)
    const [oldFiles] = await bucket.getFiles({ prefix: oldStructurePrefix })
    console.log(`[list-threads] Found ${oldFiles.length} files in old structure`)

    for (const file of oldFiles) {
      try {
        const fileName = file.name.split('/').pop() || ''

        // Check if this is a thread file
        if (fileName.startsWith('[THREAD]') && fileName.endsWith('.json')) {
          console.log(`[list-threads] Found OLD thread file: ${file.name}`)
          const [content] = await file.download()
          const threadData = JSON.parse(content.toString())

          threads.push({
            threadId: threadData.threadId,
            fileName: fileName,
            filePath: file.name,
            metadata: threadData.metadata,
            messageCount: threadData.conversation?.length || 0,
            lastUpdated: file.metadata?.timeCreated || threadData.metadata?.createdAt
          })
        }
      } catch (parseError) {
        console.error(`Error parsing thread file ${file.name}:`, parseError)
        continue
      }
    }

    console.log(`[list-threads] Found ${threads.length} thread files`)

    // Sort threads by last updated (newest first)
    threads.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())

    return NextResponse.json({ 
      success: true, 
      threads: threads,
      total: threads.length
    })
  } catch (error) {
    console.error("List threads API error:", error)
    return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 })
  }
}