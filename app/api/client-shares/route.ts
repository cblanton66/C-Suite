import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Fetch all shares for a client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('client_shares')
      .select('*, clients(client_name, user_email)')
      .eq('client_id', clientId)

    if (error) {
      console.error('[client-shares GET] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch client shares' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, shares: data })
  } catch (error) {
    console.error('[client-shares GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client shares' },
      { status: 500 }
    )
  }
}

// POST - Share a client with a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, sharedWithEmail, sharedByEmail } = body

    if (!clientId || !sharedWithEmail || !sharedByEmail) {
      return NextResponse.json(
        { error: 'Client ID, shared with email, and shared by email are required' },
        { status: 400 }
      )
    }

    // Verify the client exists
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, client_name, user_email')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Verify the user sharing the client is the owner
    if (client.user_email.toLowerCase() !== sharedByEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Only the client owner can share this client' },
        { status: 403 }
      )
    }

    // Create the share
    const { data, error } = await supabaseAdmin
      .from('client_shares')
      .insert({
        client_id: clientId,
        shared_with_email: sharedWithEmail.toLowerCase(),
        shared_by_email: sharedByEmail.toLowerCase()
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Client is already shared with this user' },
          { status: 400 }
        )
      }
      console.error('[client-shares POST] Error:', error)
      return NextResponse.json(
        { error: 'Failed to share client' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      share: data
    })
  } catch (error) {
    console.error('[client-shares POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to share client' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a client share
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const sharedWithEmail = searchParams.get('sharedWithEmail')
    const userEmail = searchParams.get('userEmail')

    if (!clientId || !sharedWithEmail || !userEmail) {
      return NextResponse.json(
        { error: 'Client ID, shared with email, and user email are required' },
        { status: 400 }
      )
    }

    // Verify the client exists and user is the owner
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('user_email')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    if (client.user_email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Only the client owner can remove shares' },
        { status: 403 }
      )
    }

    // Delete the share
    const { error } = await supabaseAdmin
      .from('client_shares')
      .delete()
      .eq('client_id', clientId)
      .eq('shared_with_email', sharedWithEmail.toLowerCase())

    if (error) {
      console.error('[client-shares DELETE] Error:', error)
      return NextResponse.json(
        { error: 'Failed to remove client share' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[client-shares DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to remove client share' },
      { status: 500 }
    )
  }
}
