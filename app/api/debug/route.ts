import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables exist
    const hasCredentials = !!process.env.GOOGLE_CREDENTIALS
    const hasSheetId = !!process.env.GOOGLE_SHEET_ID
    
    let credentialsValid = false
    let credentialsError = null
    
    if (hasCredentials) {
      try {
        // Test if we can decode and parse the credentials
        const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS!, 'base64').toString('utf-8'))
        credentialsValid = true
      } catch (error) {
        credentialsError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      hasCredentials,
      hasSheetId,
      credentialsValid,
      credentialsError,
      sheetId: hasSheetId ? process.env.GOOGLE_SHEET_ID?.substring(0, 10) + '...' : null
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}