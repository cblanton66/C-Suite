import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - Fetch custom instructions for a user
export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('userEmail')

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    const normalizedEmail = userEmail.toLowerCase()

    // Query user from Supabase
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('custom_instructions')
      .eq('email', normalizedEmail)
      .limit(1)

    if (error) {
      console.error('[CUSTOM_INSTRUCTIONS] Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        instructions: ''
      })
    }

    return NextResponse.json({
      success: true,
      instructions: users[0].custom_instructions || ''
    })
  } catch (error) {
    console.error('[CUSTOM_INSTRUCTIONS] Error fetching:', error)
    return NextResponse.json({
      error: 'Failed to fetch custom instructions'
    }, { status: 500 })
  }
}

// POST - Save custom instructions for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, instructions } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    const normalizedEmail = userEmail.toLowerCase()

    // Update user's custom instructions in Supabase
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ custom_instructions: instructions || '' })
      .eq('email', normalizedEmail)
      .select()

    if (error) {
      console.error('[CUSTOM_INSTRUCTIONS] Supabase error:', error)
      return NextResponse.json({
        error: 'Failed to save custom instructions'
      }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Custom instructions saved successfully'
    })
  } catch (error) {
    console.error('[CUSTOM_INSTRUCTIONS] Error saving:', error)
    return NextResponse.json({
      error: 'Failed to save custom instructions'
    }, { status: 500 })
  }
}
