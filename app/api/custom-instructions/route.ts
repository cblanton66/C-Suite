import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getGoogleSheetsClient() {
  if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
    throw new Error('Google Sheets configuration missing')
  }

  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8')
  )

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({ version: 'v4', auth })
}

const SHEET_NAME = 'Sheet1'

// GET - Fetch custom instructions for a user
export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('userEmail')

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    const sheets = await getGoogleSheetsClient()

    // Get all data from Sheet1
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: `${SHEET_NAME}!A:Z`,
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return NextResponse.json({
        success: true,
        instructions: ''
      })
    }

    // Find the column index for CustomInstructions
    const headers = rows[0]
    const customInstructionsIndex = headers.findIndex((h: string) =>
      h?.toLowerCase() === 'custominstructions'
    )

    if (customInstructionsIndex === -1) {
      return NextResponse.json({
        error: 'CustomInstructions column not found in Sheet1'
      }, { status: 500 })
    }

    // Find user's row (email is in column E, index 4)
    const userRow = rows.slice(1).find(row => row[4]?.toLowerCase() === userEmail.toLowerCase())

    if (!userRow) {
      return NextResponse.json({
        success: true,
        instructions: ''
      })
    }

    return NextResponse.json({
      success: true,
      instructions: userRow[customInstructionsIndex] || ''
    })
  } catch (error) {
    console.error('Error fetching custom instructions:', error)
    return NextResponse.json({
      error: 'Failed to fetch custom instructions'
    }, { status: 500 })
  }
}

// POST - Save custom instructions for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, instructions } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    const sheets = await getGoogleSheetsClient()

    // Get all data from Sheet1
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: `${SHEET_NAME}!A:Z`,
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        error: 'Sheet1 not found or empty'
      }, { status: 500 })
    }

    // Find the column index for CustomInstructions
    const headers = rows[0]
    const customInstructionsIndex = headers.findIndex((h: string) =>
      h?.toLowerCase() === 'custominstructions'
    )

    if (customInstructionsIndex === -1) {
      return NextResponse.json({
        error: 'CustomInstructions column not found in Sheet1'
      }, { status: 500 })
    }

    // Find user's row index (email is in column E, index 4)
    const userRowIndex = rows.slice(1).findIndex(row => row[4]?.toLowerCase() === userEmail.toLowerCase())

    // Convert column index to letter (A, B, C, etc.)
    const columnLetter = String.fromCharCode(65 + customInstructionsIndex)

    if (userRowIndex === -1) {
      // User doesn't exist - create a new row with just email and custom instructions
      const newRow = new Array(headers.length).fill('')
      newRow[0] = userEmail // Email in column A
      newRow[customInstructionsIndex] = instructions || ''

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID!,
        range: `${SHEET_NAME}!A:Z`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [newRow],
        },
      })
    } else {
      // User exists - update the custom instructions cell
      const actualRowNumber = userRowIndex + 2

      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID!,
        range: `${SHEET_NAME}!${columnLetter}${actualRowNumber}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[instructions || '']],
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Custom instructions saved successfully'
    })
  } catch (error) {
    console.error('Error saving custom instructions:', error)
    return NextResponse.json({
      error: 'Failed to save custom instructions'
    }, { status: 500 })
  }
}
