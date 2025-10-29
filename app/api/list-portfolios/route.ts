import { type NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      )
    }

    // Initialize Google Cloud Storage
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
    })

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME
    if (!bucketName) {
      return NextResponse.json(
        { error: "Storage configuration error" },
        { status: 500 }
      )
    }

    const bucket = storage.bucket(bucketName)

    // List all files in user's portfolio directory
    const prefix = `portfolios/${userId}/`
    const [files] = await bucket.getFiles({ prefix })

    // Extract portfolio names from file paths
    const portfolios = files
      .filter(file => file.name.endsWith('.json'))
      .map(file => {
        const fileName = file.name.split('/').pop()
        return fileName?.replace('.json', '') || ''
      })
      .filter(name => name !== '')

    return NextResponse.json({
      success: true,
      portfolios: portfolios,
    })
  } catch (error) {
    console.error("Error listing portfolios:", error)
    return NextResponse.json(
      { error: "Failed to list portfolios" },
      { status: 500 }
    )
  }
}
