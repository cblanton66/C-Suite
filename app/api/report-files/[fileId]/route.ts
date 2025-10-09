import { NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'
import { supabaseAdmin } from '@/lib/supabase'

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
  // Check if the file belongs to this report by querying Supabase
  const { data: reportData, error } = await supabaseAdmin
    .from('report_links')
    .select('report_attachments')
    .eq('report_id', reportId)
    .single()

  if (error || !reportData) {
    console.error('[validateFileAccess] Report not found:', error)
    return null
  }

  // Check if this file is in the report attachments list
  const attachments = reportData.report_attachments || []
  const targetAttachment = attachments.find((file: any) => file.fileId === fileId)

  return targetAttachment || null
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

    // Validate that this file belongs to this report and get attachment data
    const targetAttachment = await validateFileAccess(fileId, reportId)
    if (!targetAttachment) {
      return NextResponse.json({ 
        error: 'File not found or access denied' 
      }, { status: 404 })
    }

    // Get file from Google Cloud Storage
    const bucket = await getGoogleCloudStorage()

    // Use the actual file path stored in the database
    const targetFile = bucket.file(targetAttachment.path)

    // Get file metadata (for content type) and use original name from database
    const [metadata] = await targetFile.getMetadata()
    const originalName = targetAttachment.originalName || targetAttachment.name

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
    console.error('Report file download error:', error)
    return NextResponse.json({ 
      error: 'Failed to download file' 
    }, { status: 500 })
  }
}