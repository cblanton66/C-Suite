import { NextResponse } from "next/server"

export async function GET() {
  const hasApiKey = !!process.env.XAI_API_KEY

  return NextResponse.json({
    hasApiKey,
    status: hasApiKey ? "connected" : "missing_api_key",
  })
}
