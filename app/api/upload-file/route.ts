import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json({ error: 'Google Cloud configuration missing' }, { status: 500 })
    }

    // Decode the base64 credentials (same as your sheets setup)
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
    
    // Initialize Google Cloud Storage
    const storage = new Storage({
      credentials,
      projectId: credentials.project_id,
    })

    const bucket = storage.bucket('peaksuite-files')

    // Get the file, user email, and folder from the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userEmail = formData.get('userEmail') as string
    const folder = formData.get('folder') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
    }

    // Verify user has upload permissions by checking Google Sheets
    const { google } = require('googleapis')
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheets = google.sheets({ version: 'v4', auth })
    
    // Get user data from sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:K', // Include permissions column
    })
    
    const rows = response.data.values || []
    let hasUploadPermission = false
    
    // Check if user exists and has upload permission
    for (let i = 1; i < rows.length; i++) {
      const [firstName, lastName, userIndustry, userCompany, sheetUserEmail, userPhone, userTimestamp, userSource, userPassword, userStatus, permissions] = rows[i]
      
      if (sheetUserEmail && sheetUserEmail.toLowerCase() === userEmail.toLowerCase() && userStatus === 'Active') {
        if (permissions && typeof permissions === 'string') {
          const userPermissions = permissions.split(',').map(p => p.trim().toLowerCase())
          hasUploadPermission = userPermissions.includes('upload')
        }
        break
      }
    }
    
    if (!hasUploadPermission) {
      return NextResponse.json({ error: 'Upload permission denied' }, { status: 403 })
    }

    // Validate file type (PDFs only for now)
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Create a unique filename with folder path
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    
    // Determine the full path based on folder selection
    let fileName: string
    if (folder && folder !== 'root') {
      fileName = `${folder}/${timestamp}_${sanitizedName}`
    } else {
      fileName = `${timestamp}_${sanitizedName}`
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Google Cloud Storage
    const cloudFile = bucket.file(fileName)
    
    await cloudFile.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        }
      }
    })

    console.log(`File uploaded successfully: ${fileName}`)

    return NextResponse.json({ 
      success: true, 
      fileName,
      originalName: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}