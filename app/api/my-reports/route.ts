import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
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

    // Get all data from ReportLinks sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'ReportLinks!A:O',
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ reports: [] })
    }

    // Filter reports by user email and map to our format
    const userReports = rows
      .slice(1) // Skip header row
      .filter(row => {
        const createdBy = row[5] // createdBy column
        const isActive = row[9] // isActive column
        return createdBy === userEmail && isActive === 'TRUE'
      })
      .map(row => ({
        reportId: row[0] || '',
        title: row[1] || '',
        contentPath: row[2] || '',
        chartData: row[3] || '',
        createdDate: row[4] || '',
        createdBy: row[5] || '',
        clientName: row[6] || '',
        clientEmail: row[7] || '',
        expiresAt: row[8] || '',
        isActive: row[9] || '',
        viewCount: parseInt(row[10] || '0'),
        lastViewed: row[11] || '',
        description: row[12] || '',
        projectType: row[13] || '',
        shareableUrl: row[14] || ''
      }))
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()) // Sort by newest first

    return NextResponse.json({ 
      success: true, 
      reports: userReports 
    })

  } catch (error) {
    console.error('My Reports API error:', error)
    return NextResponse.json({ 
      error: 'Failed to retrieve reports' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { reportId, title, description, userEmail } = await request.json()

    if (!reportId || !userEmail) {
      return NextResponse.json({ error: 'Report ID and user email are required' }, { status: 400 })
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

    // Get all data from ReportLinks sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'ReportLinks!A:O',
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Find the report row
    const reportRowIndex = rows.findIndex(row => 
      row[0] === reportId && row[5] === userEmail // reportId and createdBy
    )

    if (reportRowIndex === -1 || reportRowIndex === 0) {
      return NextResponse.json({ error: 'Report not found or access denied' }, { status: 404 })
    }

    // Update the row (1-indexed for Google Sheets API)
    const rowNumber = reportRowIndex + 1
    const updatedRow = [...rows[reportRowIndex]]
    if (title !== undefined) updatedRow[1] = title // title column
    if (description !== undefined) updatedRow[12] = description // description column

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `ReportLinks!A${rowNumber}:O${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRow]
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Report updated successfully'
    })

  } catch (error) {
    console.error('Update Report API error:', error)
    return NextResponse.json({ 
      error: 'Failed to update report' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { reportId, userEmail } = await request.json()

    if (!reportId || !userEmail) {
      return NextResponse.json({ error: 'Report ID and user email are required' }, { status: 400 })
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

    // Get all data from ReportLinks sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'ReportLinks!A:O',
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Find the report row
    const reportRowIndex = rows.findIndex(row => 
      row[0] === reportId && row[5] === userEmail // reportId and createdBy
    )

    if (reportRowIndex === -1 || reportRowIndex === 0) {
      return NextResponse.json({ error: 'Report not found or access denied' }, { status: 404 })
    }

    // Mark as inactive instead of actually deleting the row
    const rowNumber = reportRowIndex + 1
    const updatedRow = [...rows[reportRowIndex]]
    updatedRow[9] = 'FALSE' // isActive column

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `ReportLinks!A${rowNumber}:O${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRow]
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Report deleted successfully'
    })

  } catch (error) {
    console.error('Delete Report API error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete report' 
    }, { status: 500 })
  }
}