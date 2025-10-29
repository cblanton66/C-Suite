import { type NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const portfolioName = searchParams.get("portfolioName")

    if (!userId || !portfolioName) {
      return NextResponse.json(
        { error: "userId and portfolioName parameters are required" },
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

    // Get portfolio file
    const filePath = `portfolios/${userId}/${portfolioName}.json`
    const file = bucket.file(filePath)

    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      )
    }

    const [contents] = await file.download()
    const portfolio = JSON.parse(contents.toString())

    return NextResponse.json({
      success: true,
      portfolio: portfolio,
    })
  } catch (error) {
    console.error("Error loading portfolio:", error)
    return NextResponse.json(
      { error: "Failed to load portfolio" },
      { status: 500 }
    )
  }
}
