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

export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceOwner, filePath } = await req.json()

    if (!userId || !filePath) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const storage = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME

    if (!bucketName) {
      console.error('GOOGLE_CLOUD_BUCKET_NAME environment variable is not set')
      return NextResponse.json({ error: "Storage configuration missing" }, { status: 500 })
    }

    // Use workspaceOwner for file path
    const fileOwner = workspaceOwner || userId
    const folderUserId = fileOwner.replace(/@/g, '_').replace(/\./g, '_')

    const bucket = storage.bucket(bucketName)

    // Source file path (current location)
    const sourceFile = bucket.file(filePath)

    // Check if file exists
    const [exists] = await sourceFile.exists()
    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Destination path (archive folder)
    // Convert: Reports-view/chuck_blantoncpa_net/client-files/perry-geer/file.json
    // To: Reports-view/chuck_blantoncpa_net/archive/perry-geer/file.json
    const destinationPath = filePath.replace('/client-files/', '/archive/')
    const destinationFile = bucket.file(destinationPath)

    // Copy file to archive location
    await sourceFile.copy(destinationFile)

    // Delete original file
    await sourceFile.delete()

    console.log(`[archive-thread] Moved file from ${filePath} to ${destinationPath}`)

    return NextResponse.json({
      success: true,
      message: "Thread archived successfully",
      archivedPath: destinationPath
    })

  } catch (error) {
    console.error("Archive thread API error:", error)
    return NextResponse.json({ error: "Failed to archive thread" }, { status: 500 })
  }
}
