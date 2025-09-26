import { NextRequest, NextResponse } from "next/server"
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    const { reportId, responseText, responseEmail, attachments = [] } = await request.json()

    if (!reportId || !responseText || !responseEmail) {
      return NextResponse.json({ 
        error: 'Report ID, response text, and email are required' 
      }, { status: 400 })
    }

    if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json({ 
        error: 'Google Sheets configuration missing' 
      }, { status: 500 })
    }

    // Decode the base64 credentials
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
    
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Get all data from ReportLinks sheet to find the report
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'ReportLinks!A:T',
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Find the report by ID (skip header row)
    const reportRowIndex = rows.slice(1).findIndex(row => row[0] === reportId)
    
    if (reportRowIndex === -1) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const reportRow = rows[reportRowIndex + 1] // +1 because we skipped header

    // Check if report is active
    if (reportRow[9] !== 'TRUE') {
      return NextResponse.json({ 
        error: 'Report is no longer available for responses' 
      }, { status: 403 })
    }

    // Check if responses are allowed
    if (reportRow[15] !== 'TRUE') {
      return NextResponse.json({ 
        error: 'Responses are not allowed for this report' 
      }, { status: 403 })
    }

    // Check expiration
    if (reportRow[8] && new Date(reportRow[8]) < new Date()) {
      return NextResponse.json({ 
        error: 'Report has expired and no longer accepts responses' 
      }, { status: 403 })
    }

    // Calculate the actual row number in the sheet (add 2: 1 for header, 1 for 0-based index)
    const sheetRowNumber = reportRowIndex + 2

    // Update the response columns (Q, R, S, T = columns 17, 18, 19, 20)
    // Q = recipient_response, R = response_date, S = response_email, T = response_attachments
    const responseDate = new Date().toISOString()
    const attachmentsJson = attachments.length > 0 ? JSON.stringify(attachments) : ''
    const updateRange = `ReportLinks!Q${sheetRowNumber}:T${sheetRowNumber}`
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: updateRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[responseText, responseDate, responseEmail, attachmentsJson]],
      },
    })

    console.log(`Response submitted for report ${reportId} by ${responseEmail}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Response submitted successfully',
      responseDate
    })

  } catch (error) {
    console.error('Report response API error:', error)
    return NextResponse.json({ 
      error: 'Failed to submit response' 
    }, { status: 500 })
  }
}