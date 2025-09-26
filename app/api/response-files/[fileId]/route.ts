import { NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'
import { google } from 'googleapis'

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

async function validateFileAccess(fileId: string, reportId: string) {
  // Check if the file belongs to this report by querying the database
  if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
    throw new Error('Google Sheets configuration missing')
  }

  const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const sheets = google.sheets({ version: 'v4', auth })

  // Get all data from ReportLinks sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ReportLinks!A:T',
  })

  const rows = response.data.values
  if (!rows || rows.length <= 1) {
    return false
  }

  // Find the report by ID (skip header row)
  const reportRow = rows.slice(1).find(row => row[0] === reportId)
  
  if (!reportRow) {
    return false
  }

  // Check if this file is in the attachments list
  const attachments = reportRow[19] ? JSON.parse(reportRow[19]) : []
  return attachments.some((file: any) => file.fileId === fileId)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!fileId || !reportId) {
      return NextResponse.json({ 
        error: 'File ID and report ID are required' 
      }, { status: 400 })
    }

    // Validate that this file belongs to this report
    const hasAccess = await validateFileAccess(fileId, reportId)
    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'File not found or access denied' 
      }, { status: 404 })
    }

    // Get file from Google Cloud Storage
    const bucket = await getGoogleCloudStorage()
    
    // Find the file by searching for files with this fileId in the metadata
    const [files] = await bucket.getFiles({
      prefix: `response-attachments/${reportId}/`,
    })

    const targetFile = files.find(file => {
      const fileName = file.name.split('/').pop() || ''
      return fileName.startsWith(fileId + '.')
    })

    if (!targetFile) {
      return NextResponse.json({ 
        error: 'File not found' 
      }, { status: 404 })
    }

    // Get file metadata
    const [metadata] = await targetFile.getMetadata()
    const originalName = metadata.metadata?.originalName || targetFile.name.split('/').pop()

    // Stream the file
    const [fileBuffer] = await targetFile.download()

    // Set appropriate headers
    const headers = new Headers()
    headers.set('Content-Type', metadata.contentType || 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename="${originalName}"`)
    headers.set('Content-Length', fileBuffer.length.toString())

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json({ 
      error: 'Failed to download file' 
    }, { status: 500 })
  }
}