import { NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'
import { nanoid } from 'nanoid'

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

    // Validate file type (allow common document types)
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
    const filePath = `report-attachments/${reportId}/${fileId}.${fileExtension}`

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
          fileId: fileId,
          attachmentType: 'report' // Distinguish from response attachments
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

    console.log(`Report attachment uploaded for report ${reportId}: ${file.name} (${file.size} bytes)`)

    return NextResponse.json({ 
      success: true, 
      file: fileMetadata 
    })

  } catch (error) {
    console.error('Report file upload error:', error)
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 })
  }
}