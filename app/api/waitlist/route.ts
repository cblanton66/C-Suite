import { NextRequest, NextResponse } from "next/server"
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, industry, companyName, email, phoneNumber } = await request.json()

    if (!firstName || !lastName || !industry || !email || !phoneNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json({ error: 'Google Sheets configuration missing' }, { status: 500 })
    }

    // Decode the base64 credentials
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
    
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Prepare the data to append (convert email to lowercase)
    const timestamp = new Date().toISOString()
    const normalizedEmail = email.toLowerCase()
    const values = [[firstName, lastName, industry, companyName || '', normalizedEmail, phoneNumber, timestamp, 'Beta Waitlist', '', '']]

    // Append to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:J', // Columns: First Name, Last Name, Industry, Company Name, Email, Phone, Timestamp, Source, Password, Status
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    })

    // Log successful signup (keep this for business monitoring)
    console.log(`New beta signup: ${firstName} ${lastName} - ${normalizedEmail}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully added to waitlist' 
    })

  } catch (error) {
    console.error('Waitlist API error:', error)
    return NextResponse.json({ 
      error: 'Failed to add to waitlist' 
    }, { status: 500 })
  }
}