import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Storage } from '@google-cloud/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

// GET - Fetch all clients for a user
export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('userEmail')
    const workspaceOwner = request.nextUrl.searchParams.get('workspaceOwner')
    const recentOnly = request.nextUrl.searchParams.get('recentOnly') === 'true'

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    const owner = (workspaceOwner || userEmail).toLowerCase()

    // Query clients from Supabase where user is the owner OR the client is shared with them
    let query = supabaseAdmin
      .from('clients')
      .select('*')
      .or(`user_email.eq.${owner},shared_with.eq.${userEmail.toLowerCase()}`)
      .eq('status', 'Active')

    if (recentOnly) {
      // Get only recently accessed clients (limit 10, ordered by last_accessed)
      query = query
        .not('last_accessed', 'is', null)
        .order('last_accessed', { ascending: false })
        .limit(10)
    } else {
      // Get all clients ordered by name
      query = query.order('client_name', { ascending: true })
    }

    const { data: clients, error } = await query

    if (error) {
      console.error('[user-clients GET] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      )
    }

    // Map to match expected format
    const formattedClients = clients.map(client => ({
      clientName: client.client_name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      industry: client.industry || '',
      status: client.status,
      workspaceOwner: client.user_email,
      createdBy: client.user_email,
      sharedWith: client.shared_with || '',
      dateAdded: client.created_at,
    }))

    return NextResponse.json({ success: true, clients: formattedClients })
  } catch (error) {
    console.error('[user-clients GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

// POST - Create new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientName, email, phone, address, industry, userEmail, workspaceOwner } = body

    if (!clientName || !userEmail) {
      return NextResponse.json(
        { error: 'Client name and user email are required' },
        { status: 400 }
      )
    }

    const owner = (workspaceOwner || userEmail).toLowerCase()

    // Insert new client into Supabase
    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert({
        user_email: owner,
        client_name: clientName,
        company: clientName, // Use client name as company for now
        email: email || null,
        phone: phone || null,
        address: address || null,
        industry: industry || null,
        status: 'Active'
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Client already exists' },
          { status: 400 }
        )
      }
      console.error('[user-clients POST] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      )
    }

    // Create folder structure in Google Cloud Storage
    try {
      const bucket = await getGoogleCloudStorage()
      const userFolder = owner.replace(/@/g, '_').replace(/\./g, '_')
      const clientSlug = clientName.toLowerCase().replace(/\s+/g, '-')

      // Create placeholder files in each subfolder to ensure folders exist
      const folders = ['notes', 'threads', 'reports']

      for (const folder of folders) {
        const placeholderPath = `Reports-view/${userFolder}/client-files/${clientSlug}/${folder}/.placeholder`
        const file = bucket.file(placeholderPath)

        await file.save('', {
          metadata: {
            contentType: 'text/plain',
            metadata: {
              createdBy: userEmail,
              clientName: clientName,
              purpose: 'Folder structure placeholder'
            }
          }
        })
      }

      console.log(`[user-clients POST] Created folder structure for client: ${clientName}`)
    } catch (storageError) {
      console.error('[user-clients POST] Error creating GCS folders:', storageError)
      // Don't fail the entire request if folder creation fails
    }

    return NextResponse.json({
      success: true,
      client: {
        clientName: data.client_name,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        industry: data.industry || '',
        status: data.status,
        workspaceOwner: data.user_email,
        createdBy: data.user_email,
        sharedWith: data.shared_with || '',
        dateAdded: data.created_at,
      },
    })
  } catch (error) {
    console.error('[user-clients POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}

// PUT - Update existing client
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientName, email, phone, address, industry, status, userEmail, workspaceOwner } = body

    if (!clientName || !userEmail) {
      return NextResponse.json(
        { error: 'Client name and user email are required' },
        { status: 400 }
      )
    }

    const owner = (workspaceOwner || userEmail).toLowerCase()

    // Update client in Supabase
    const { data, error } = await supabaseAdmin
      .from('clients')
      .update({
        email: email || null,
        phone: phone || null,
        address: address || null,
        industry: industry || null,
        status: status || 'Active'
      })
      .eq('user_email', owner)
      .eq('client_name', clientName)
      .select()
      .single()

    if (error) {
      console.error('[user-clients PUT] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update client' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      client: {
        clientName: data.client_name,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        industry: data.industry || '',
        status: data.status,
        workspaceOwner: data.user_email,
        createdBy: data.user_email,
        sharedWith: data.shared_with || '',
        dateAdded: data.created_at,
      },
    })
  } catch (error) {
    console.error('[user-clients PUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete (set status to Inactive)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get('clientName')
    const userEmail = searchParams.get('userEmail')
    const workspaceOwner = searchParams.get('workspaceOwner')

    if (!clientName || !userEmail) {
      return NextResponse.json(
        { error: 'Client name and user email are required' },
        { status: 400 }
      )
    }

    const owner = (workspaceOwner || userEmail).toLowerCase()

    // Soft delete - update status to Inactive
    const { data, error } = await supabaseAdmin
      .from('clients')
      .update({ status: 'Inactive' })
      .eq('user_email', owner)
      .eq('client_name', clientName)
      .select()

    if (error) {
      console.error('[user-clients DELETE] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to delete client' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[user-clients DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}

// PATCH - Update last_accessed timestamp
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientName, userEmail, workspaceOwner } = body

    if (!clientName || !userEmail) {
      return NextResponse.json(
        { error: 'Client name and user email are required' },
        { status: 400 }
      )
    }

    const owner = (workspaceOwner || userEmail).toLowerCase()

    // Update last_accessed timestamp
    const { error } = await supabaseAdmin
      .from('clients')
      .update({ last_accessed: new Date().toISOString() })
      .eq('user_email', owner)
      .eq('client_name', clientName)

    if (error) {
      console.error('[user-clients PATCH] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update last accessed time' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[user-clients PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update last accessed time' },
      { status: 500 }
    )
  }
}
