import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('userEmail')
    const includeArchived = request.nextUrl.searchParams.get('includeArchived') === 'true'

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    // Query reports from Supabase
    let query = supabaseAdmin
      .from('report_links')
      .select('*')
      .eq('created_by', userEmail)

    // Only filter by is_active if we're not including archived reports
    if (!includeArchived) {
      query = query.eq('is_active', true)
    }

    const { data: reports, error } = await query.order('created_date', { ascending: false })

    if (error) {
      console.error('[MY_REPORTS GET] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to retrieve reports' }, { status: 500 })
    }

    // Map to match expected format
    const userReports = reports.map(report => ({
      reportId: report.report_id,
      title: report.title,
      contentPath: report.content_path,
      chartData: report.chart_data || '',
      createdDate: report.created_date,
      createdBy: report.created_by,
      clientName: report.client_name || '',
      clientEmail: report.client_email || '',
      expiresAt: report.expires_at || '',
      isActive: report.is_active ? 'TRUE' : 'FALSE',
      viewCount: report.view_count,
      lastViewed: report.last_viewed || '',
      description: report.description || '',
      projectType: report.project_type || '',
      shareableUrl: report.shareable_url,
      allowResponses: report.allow_responses,
      // Response notification fields
      hasResponse: report.recipient_response ? true : false,
      responseDate: report.response_date || null,
      responseEmail: report.response_email || null,
      hasAttachments: (report.response_attachments && report.response_attachments.length > 0),
      attachmentCount: (report.response_attachments && report.response_attachments.length) || 0,
    }))

    return NextResponse.json({
      success: true,
      reports: userReports
    })

  } catch (error) {
    console.error('[MY_REPORTS GET] Error:', error)
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

    // Build update object
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description

    // Update report in Supabase
    const { data, error } = await supabaseAdmin
      .from('report_links')
      .update(updateData)
      .eq('report_id', reportId)
      .eq('created_by', userEmail)
      .select()
      .single()

    if (error) {
      console.error('[MY_REPORTS PUT] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Report not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully'
    })

  } catch (error) {
    console.error('[MY_REPORTS PUT] Error:', error)
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

    // Soft delete - mark as inactive in Supabase
    const { data, error } = await supabaseAdmin
      .from('report_links')
      .update({ is_active: false })
      .eq('report_id', reportId)
      .eq('created_by', userEmail)
      .select()

    if (error) {
      console.error('[MY_REPORTS DELETE] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Report not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully'
    })

  } catch (error) {
    console.error('[MY_REPORTS DELETE] Error:', error)
    return NextResponse.json({
      error: 'Failed to delete report'
    }, { status: 500 })
  }
}