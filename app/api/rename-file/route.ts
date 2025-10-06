import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

// POST - Rename/move a file
export async function POST(req: NextRequest) {
  try {
    const { oldPath, newPath } = await req.json()

    if (!oldPath || !newPath) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log('[RENAME_FILE] Renaming file from:', oldPath, 'to:', newPath)

    const bucket = await getGoogleCloudStorage()
    const oldFile = bucket.file(oldPath)
    const newFile = bucket.file(newPath)

    // Check if old file exists
    const [exists] = await oldFile.exists()
    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Copy the file to new location
    await oldFile.copy(newFile)

    // Delete the old file
    await oldFile.delete()

    console.log('[RENAME_FILE] File renamed successfully')

    return NextResponse.json({
      success: true,
      message: "File renamed successfully"
    })
  } catch (error) {
    console.error("Rename file API error:", error)
    return NextResponse.json({
      error: "Failed to rename file"
    }, { status: 500 })
  }
}
