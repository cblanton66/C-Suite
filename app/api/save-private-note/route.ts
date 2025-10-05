import { type NextRequest, NextResponse } from "next/server"
import { savePrivateNote } from "@/lib/google-cloud-storage"
import { Storage } from '@google-cloud/storage'

async function getGoogleCloudStorage() {
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error('Google Cloud configuration missing')
  }

  const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))

  const storage = new Storage({
    credentials,
    projectId: credentials.project_id,
  })

  return storage.bucket('peaksuite-files')
}

export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceOwner, clientName, content, title } = await req.json()

    if (!userId || !clientName || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use workspaceOwner for file path
    const fileOwner = workspaceOwner || userId

    const success = await savePrivateNote(fileOwner, clientName, content, title)

    if (success) {
      return NextResponse.json({ success: true, message: "Private note saved successfully" })
    } else {
      return NextResponse.json({ error: "Failed to save private note" }, { status: 500 })
    }
  } catch (error) {
    console.error("Save private note API error:", error)
    return NextResponse.json({ error: "Failed to process save request" }, { status: 500 })
  }
}

// PUT - Update existing note
export async function PUT(req: NextRequest) {
  try {
    const { filePath, content, userEmail, workspaceOwner } = await req.json()

    if (!filePath || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log('[UPDATE_NOTE] Updating note:', filePath)

    // Update the file in Google Cloud Storage
    const bucket = await getGoogleCloudStorage()
    const file = bucket.file(filePath)

    await file.save(content, {
      metadata: {
        contentType: 'text/markdown',
        metadata: {
          updatedAt: new Date().toISOString(),
          updatedBy: userEmail || workspaceOwner
        }
      }
    })

    console.log('[UPDATE_NOTE] Note updated successfully:', filePath)

    return NextResponse.json({
      success: true,
      message: "Note updated successfully"
    })
  } catch (error) {
    console.error("Update note API error:", error)
    return NextResponse.json({
      error: "Failed to update note"
    }, { status: 500 })
  }
}