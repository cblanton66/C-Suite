import { type NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"

export async function POST(req: NextRequest) {
  try {
    const { userId, portfolioName, portfolio } = await req.json()

    if (!userId || !portfolioName || !portfolio) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Create file path: portfolios/{userId}/{portfolioName}.json
    const filePath = `portfolios/${userId}/${portfolioName}.json`
    const file = bucket.file(filePath)

    // Save portfolio data
    await file.save(JSON.stringify(portfolio, null, 2), {
      contentType: "application/json",
      metadata: {
        userId: userId,
        portfolioName: portfolioName,
        lastUpdated: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Portfolio saved successfully",
      portfolioName: portfolioName,
    })
  } catch (error) {
    console.error("Error saving portfolio:", error)
    return NextResponse.json(
      { error: "Failed to save portfolio" },
      { status: 500 }
    )
  }
}
