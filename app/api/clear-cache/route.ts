import { type NextRequest, NextResponse } from "next/server"
import { clearUserCache } from '@/lib/google-cloud-storage'

export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceOwner } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const fileOwner = workspaceOwner || userId
    clearUserCache(fileOwner)

    console.log(`[CLEAR_CACHE] Cleared cache for user: ${fileOwner}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CLEAR_CACHE] Error:', error)
    return NextResponse.json({
      error: 'Failed to clear cache'
    }, { status: 500 })
  }
}
