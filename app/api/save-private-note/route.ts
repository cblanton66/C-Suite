import { type NextRequest, NextResponse } from "next/server"
import { savePrivateNote } from "@/lib/google-cloud-storage"

export async function POST(req: NextRequest) {
  try {
    const { userId, clientName, content, title } = await req.json()

    if (!userId || !clientName || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = await savePrivateNote(userId, clientName, content, title)

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