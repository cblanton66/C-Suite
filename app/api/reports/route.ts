import { NextRequest, NextResponse } from "next/server"
import { google } from 'googleapis'
import { nanoid } from 'nanoid'
import { Storage } from '@google-cloud/storage'

async function getGoogleCloudStorage() {
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error('Google Cloud configuration missing')
  }

  const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
  
  const storage = new Storage({
    credentials,
    projectId: credentials.project_id,
  })

  return storage.bucket('peaksuite-files')
}

export async function POST(request: NextRequest) {
  try {
    const { 
      title, 
      content, 
      chartData, 
      clientName, 
      clientEmail, 
      description, 
      projectType,
      expiresAt 
    } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json({ error: 'Google Sheets configuration missing' }, { status: 500 })
    }

    // Generate unique report ID
    const reportId = `rpt_${nanoid(10)}`
    
    // Create organized folder structure: Reports-view/user/client/reportId.md
    const userEmail = 'chuck@blantoncpa.net' // TODO: Make this dynamic from auth
    const userFolder = userEmail.replace('@', '_').replace(/\./g, '_')
    const clientFolder = clientName?.toLowerCase().replace(/\s+/g, '-') || 'general'
    const contentPath = `Reports-view/${userFolder}/${clientFolder}/${reportId}.md`

    // Save content to Google Cloud Storage
    const bucket = await getGoogleCloudStorage()
    const contentFile = bucket.file(contentPath)
    
    await contentFile.save(content, {
      metadata: {
        contentType: 'text/markdown',
        metadata: {
          reportId,
          title,
          createdAt: new Date().toISOString()
        }
      }
    })

    // Decode the base64 credentials for Google Sheets
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
    
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Generate the shareable URL using request headers for proper domain detection
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`
    const shareableUrl = `${baseUrl}/reports/${reportId}`

    // Prepare the data to append (store content path instead of full content)
    const timestamp = new Date().toISOString()
    const chartDataString = chartData ? JSON.stringify(chartData) : ''
    const values = [[
      reportId,
      title,
      contentPath, // Store file path instead of content
      chartDataString,
      timestamp, // createdDate
      'chuck@blantoncpa.net', // createdBy (you can make this dynamic later)
      clientName || '',
      clientEmail || '',
      expiresAt || '', // expiresAt (optional)
      'TRUE', // isActive
      '0', // viewCount
      '', // lastViewed
      description || '',
      projectType || '',
      shareableUrl // shareableUrl - new column
    ]]

    // Append to the ReportLinks sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'ReportLinks!A:O', // All columns in ReportLinks sheet (A to O for 15 columns)
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    })

    console.log(`New shareable report created: ${reportId} - ${title}`)

    return NextResponse.json({ 
      success: true, 
      reportId,
      shareableUrl,
      message: 'Report saved successfully' 
    })

  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json({ 
      error: 'Failed to save report' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json({ error: 'Google Cloud configuration missing' }, { status: 500 })
    }

    // Decode the base64 credentials
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
    
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    
    // Initialize Google Cloud Storage
    const bucket = await getGoogleCloudStorage()

    // Get all data from ReportLinks sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'ReportLinks!A:O',
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Find the report by ID (skip header row)
    const reportRow = rows.slice(1).find(row => row[0] === reportId)
    
    if (!reportRow) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Check if report is active
    if (reportRow[9] !== 'TRUE') {
      return NextResponse.json({ error: 'Report is no longer available' }, { status: 403 })
    }

    // Check expiration
    if (reportRow[8] && new Date(reportRow[8]) < new Date()) {
      return NextResponse.json({ error: 'Report has expired' }, { status: 403 })
    }

    // Get content path from sheet and fetch content from GCS
    const contentPath = reportRow[2] // This is now the file path instead of content
    const contentFile = bucket.file(contentPath)
    
    let content = ''
    try {
      const [fileData] = await contentFile.download()
      content = fileData.toString('utf-8')
    } catch (error) {
      console.error('Error fetching content from GCS:', error)
      return NextResponse.json({ error: 'Report content not found' }, { status: 404 })
    }

    // Parse chart data if exists
    let chartData = null
    if (reportRow[3]) {
      try {
        chartData = JSON.parse(reportRow[3])
      } catch (e) {
        console.error('Error parsing chart data:', e)
      }
    }

    // Update view count (increment by 1)
    const currentViewCount = parseInt(reportRow[10] || '0')
    const newViewCount = currentViewCount + 1
    const lastViewed = new Date().toISOString()

    // Find the row number to update (add 2 because sheets are 1-indexed and we skip header)
    const rowIndex = rows.slice(1).findIndex(row => row[0] === reportId) + 2

    // Update view count and last viewed timestamp
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `ReportLinks!K${rowIndex}:L${rowIndex}`, // viewCount and lastViewed columns
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newViewCount.toString(), lastViewed]],
      },
    })

    const reportData = {
      reportId: reportRow[0],
      title: reportRow[1],
      content, // Content fetched from GCS
      chartData,
      createdDate: reportRow[4],
      createdBy: reportRow[5],
      clientName: reportRow[6],
      clientEmail: reportRow[7],
      description: reportRow[12],
      projectType: reportRow[13],
      viewCount: newViewCount
    }

    return NextResponse.json({ 
      success: true, 
      report: reportData 
    })

  } catch (error) {
    console.error('Get report API error:', error)
    return NextResponse.json({ 
      error: 'Failed to retrieve report' 
    }, { status: 500 })
  }
}