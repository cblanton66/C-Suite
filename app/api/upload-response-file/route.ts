import { NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'
import { nanoid } from 'nanoid'
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

async function getReportDetails(reportId: string): Promise<{ clientName: string | null, userEmail: string | null }> {
  try {
    if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
      return { clientName: null, userEmail: null }
    }

    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'ReportLinks!A:G', // A=reportId, F=createdBy (userEmail), G=clientName
    })

    const rows = response.data.values
    if (!rows) return { clientName: null, userEmail: null }

    // Skip header row and find the report by ID (column A)
    const reportRow = rows.slice(1).find(row => row[0] === reportId)
    if (!reportRow) return { clientName: null, userEmail: null }

    // Column F (index 5) = createdBy (userEmail), Column G (index 6) = clientName
    return {
      userEmail: reportRow[5] || null,
      clientName: reportRow[6] || null
    }
  } catch (error) {
    console.error('Error looking up report details:', error)
    return { clientName: null, userEmail: null }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const reportId = formData.get('reportId') as string

    if (!file || !reportId) {
      return NextResponse.json({ 
        error: 'File and reportId are required' 
      }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size must be less than 10MB' 
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'File type not allowed. Please upload PDF, images, Office documents, or text files.' 
      }, { status: 400 })
    }

    // Generate unique file ID and create file path
    const fileId = nanoid(12)
    const fileExtension = file.name.split('.').pop() || 'bin'
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')

    // Look up report details (userEmail and clientName) from reportId
    const { userEmail, clientName } = await getReportDetails(reportId)
    const userFolder = userEmail?.replace(/@/g, '_').replace(/\./g, '_') || 'unknown-user'
    const clientFolder = clientName?.toLowerCase().replace(/\s+/g, '-') || 'unknown-client'

    // UNIFIED STRUCTURE: Everything under Reports-view/{user}/client-files/{client}/
    const filePath = `Reports-view/${userFolder}/client-files/${clientFolder}/attachments-from-client/${reportId}/${fileId}.${fileExtension}`

    // OLD STRUCTURE (kept as comment for reference):
    // const filePath = `attachments-from-client/${clientFolder}/${reportId}/${fileId}.${fileExtension}`
    // const filePath = `response-attachments/${reportId}/${fileId}.${fileExtension}`

    // Upload to Google Cloud Storage
    const bucket = await getGoogleCloudStorage()
    const cloudFile = bucket.file(filePath)
    
    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    await cloudFile.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: sanitizedFileName,
          uploadedAt: new Date().toISOString(),
          reportId: reportId,
          fileId: fileId
        }
      }
    })

    // Return file metadata
    const fileMetadata = {
      fileId,
      name: sanitizedFileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      path: filePath,
      uploadedAt: new Date().toISOString()
    }

    console.log(`File uploaded for report ${reportId}: ${file.name} (${file.size} bytes)`)

    return NextResponse.json({ 
      success: true, 
      file: fileMetadata 
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 })
  }
}