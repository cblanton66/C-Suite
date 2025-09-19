import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, feedbackType, subject, details, rating, pageFeature } = body

    // Validate required fields
    if (!subject || !details) {
      return NextResponse.json(
        { error: 'Subject and details are required' },
        { status: 400 }
      )
    }

    // Validate environment variables
    if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
      console.error('Missing Google Sheets configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Decode the base64 credentials (same as login API)
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))

    // Create Google Auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    })

    const authClient = await auth.getClient()
    const sheets = google.sheets({ version: 'v4', auth: authClient })

    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    // Prepare the row data
    const timestamp = new Date().toISOString()
    const rowData = [
      timestamp,                    // A: Timestamp
      userEmail || 'anonymous',     // B: User Email
      feedbackType,                 // C: Feedback Type
      subject,                      // D: Subject
      details,                      // E: Details
      rating || '',                 // F: Rating
      pageFeature || 'Chat Interface', // G: Page/Feature
      'New',                        // H: Status
      '',                           // I: Priority (empty, for admin to fill)
      ''                            // J: Notes (empty, for admin to fill)
    ]

    // Append the data to the "Feedback" sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Feedback!A:J',
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData]
      }
    })

    console.log('Feedback submitted successfully:', {
      userEmail: userEmail || 'anonymous',
      feedbackType,
      subject,
      updatedCells: response.data.updates?.updatedCells
    })

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      updatedCells: response.data.updates?.updatedCells
    })

  } catch (error) {
    console.error('Error submitting feedback:', error)
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('Unable to parse range')) {
        return NextResponse.json(
          { error: 'Google Sheets configuration error - invalid range' },
          { status: 500 }
        )
      }
      if (error.message.includes('Requested entity was not found')) {
        return NextResponse.json(
          { error: 'Google Sheets not found - check sheet ID and permissions' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to submit feedback. Please try again later.' },
      { status: 500 }
    )
  }
}