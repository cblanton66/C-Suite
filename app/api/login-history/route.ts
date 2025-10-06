import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Fetch login history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const userEmail = searchParams.get('userEmail') // Optional filter by user

    let query = supabaseAdmin
      .from('login_history')
      .select('*')
      .order('login_timestamp', { ascending: false })
      .limit(limit)

    // Optional: filter by user email
    if (userEmail) {
      query = query.eq('user_email', userEmail.toLowerCase())
    }

    const { data, error } = await query

    if (error) {
      console.error('[login-history GET] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch login history' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, logins: data || [] })
  } catch (error) {
    console.error('[login-history GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch login history' },
      { status: 500 }
    )
  }
}
