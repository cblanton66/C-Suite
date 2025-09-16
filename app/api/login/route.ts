import { NextRequest, NextResponse } from "next/server"
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
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

    // Read all data from the sheet to check for matching credentials
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:J', // Covers all columns including Status
    })

    const rows = response.data.values || []
    
    // Skip header row and find matching email/password
    let userFound = false
    let userName = ''
    
    for (let i = 1; i < rows.length; i++) {
      const [firstName, lastName, userIndustry, userCompany, userEmail, userPhone, userTimestamp, userSource, userPassword, userStatus] = rows[i]
      
      if (userEmail === email && userPassword === password && userStatus === 'Active') {
        userFound = true
        userName = `${firstName} ${lastName}`
        break
      }
    }

    if (!userFound) {
      // Log failed login attempt
      const timestamp = new Date().toISOString()
      const values = [['', '', '', '', email, '', timestamp, 'Chat Access - Failed', password, 'Failed Login']]
      
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'A:J', // Columns: First Name, Last Name, Industry, Company Name, Email, Phone, Timestamp, Source, Password, Status
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      })

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Log successful login attempt
    const timestamp = new Date().toISOString()
    const values = [['', '', '', '', email, '', timestamp, 'Chat Access - Success', password, 'Successful Login']]
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:J', // Columns: First Name, Last Name, Industry, Company Name, Email, Phone, Timestamp, Source, Password, Status
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    })

    console.log(`Successful login: ${userName} (${email})`)

    return NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      userName 
    })

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json({ error: 'Failed to process login' }, { status: 500 })
  }
}