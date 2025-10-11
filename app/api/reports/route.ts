import { NextRequest, NextResponse } from "next/server"
import { nanoid } from 'nanoid'
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
      expiresAt,
      userEmail,
      allowResponses,
      reportAttachments = [] // New field for report attachments
    } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    if (!process.env.GOOGLE_CREDENTIALS) {
      return NextResponse.json({ error: 'Google Cloud configuration missing' }, { status: 500 })
    }

    // Generate unique report ID
    const reportId = `rpt_${nanoid(10)}`
    
    // NEW STRUCTURE: Save reports to client-files/{client}/reports/
    const reportUserEmail = userEmail || 'anonymous'
    const userFolder = reportUserEmail.replace('@', '_').replace(/\./g, '_')
    const clientFolder = clientName?.toLowerCase().replace(/\s+/g, '-') || 'general'
    const contentPath = `Reports-view/${userFolder}/client-files/${clientFolder}/reports/${reportId}.md`

    // OLD STRUCTURE (kept as comment for reference):
    // const contentPath = `Reports-view/${userFolder}/${clientFolder}/${reportId}.md`

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

    // Generate the shareable URL using request headers for proper domain detection
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`
    const shareableUrl = `${baseUrl}/reports/${reportId}`

    // Insert into Supabase
    const timestamp = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from('report_links')
      .insert({
        report_id: reportId,
        title,
        content_path: contentPath,
        chart_data: chartData || null,
        created_date: timestamp,
        created_by: reportUserEmail,
        client_name: clientName || null,
        client_email: clientEmail || null,
        expires_at: expiresAt || null,
        is_active: true,
        view_count: 0,
        last_viewed: null,
        description: description || null,
        project_type: projectType || null,
        shareable_url: shareableUrl,
        allow_responses: allowResponses || false,
        recipient_response: null,
        response_date: null,
        response_email: null,
        response_attachments: null,
        report_attachments: reportAttachments.length > 0 ? reportAttachments : null,
      })
      .select()

    if (error) {
      console.error('[REPORTS] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
    }

    console.log(`[REPORTS] New shareable report created: ${reportId} - ${title}`)

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

    if (!process.env.GOOGLE_CREDENTIALS) {
      return NextResponse.json({ error: 'Google Cloud configuration missing' }, { status: 500 })
    }

    // Query report from Supabase
    const { data: reportData, error } = await supabaseAdmin
      .from('report_links')
      .select('*')
      .eq('report_id', reportId)
      .single()

    if (error || !reportData) {
      console.error('[REPORTS GET] Supabase error:', error)
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Check expiration (is_active only controls visibility in Client Comms list)
    if (reportData.expires_at && new Date(reportData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Report has expired' }, { status: 403 })
    }

    // Get content from Google Cloud Storage
    const bucket = await getGoogleCloudStorage()
    const contentFile = bucket.file(reportData.content_path)
    
    let content = ''
    try {
      const [fileData] = await contentFile.download()
      content = fileData.toString('utf-8')
    } catch (error) {
      console.error('[REPORTS GET] Error fetching content from GCS:', error)
      return NextResponse.json({ error: 'Report content not found' }, { status: 404 })
    }

    // Update view count and last viewed timestamp in Supabase
    const newViewCount = reportData.view_count + 1
    const lastViewed = new Date().toISOString()

    await supabaseAdmin
      .from('report_links')
      .update({
        view_count: newViewCount,
        last_viewed: lastViewed
      })
      .eq('report_id', reportId)

    const report = {
      reportId: reportData.report_id,
      title: reportData.title,
      content, // Content fetched from GCS
      chartData: reportData.chart_data,
      createdDate: reportData.created_date,
      createdBy: reportData.created_by,
      clientName: reportData.client_name,
      clientEmail: reportData.client_email,
      description: reportData.description,
      projectType: reportData.project_type,
      viewCount: newViewCount,
      allowResponses: reportData.allow_responses,
      recipientResponse: reportData.recipient_response || '',
      responseDate: reportData.response_date || '',
      responseEmail: reportData.response_email || '',
      responseAttachments: reportData.response_attachments || [],
      reportAttachments: reportData.report_attachments || []
    }

    return NextResponse.json({
      success: true,
      report
    })

  } catch (error) {
    console.error('Get report API error:', error)
    return NextResponse.json({ 
      error: 'Failed to retrieve report' 
    }, { status: 500 })
  }
}