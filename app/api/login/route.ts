import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Normalize email for case-insensitive comparison
    const normalizedEmail = email.toLowerCase()

    // Query user from Supabase
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('password', password)
      .eq('status', 'Active')
      .limit(1)

    if (error) {
      console.error('[LOGIN] Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      // Log failed login attempt
      await supabaseAdmin
        .from('users')
        .insert({
          email: normalizedEmail,
          password: password,
          status: 'Failed Login'
        })
        .select()

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const user = users[0]
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim()

    // Parse permissions (if it's an array, use it, otherwise default to chat)
    const userPermissions = Array.isArray(user.permissions) ? user.permissions : ['chat']

    // Get assistant name
    const assistantName = user.assistant_name || 'Piper'

    // Get workspace owner
    const workspaceOwner = user.workspace_owner || normalizedEmail

    console.log(`[LOGIN] Successful login: ${userName} (${normalizedEmail})`)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      userName,
      userEmail: normalizedEmail,
      permissions: userPermissions,
      assistantName,
      workspaceOwner
    })

  } catch (error) {
    console.error('[LOGIN] Error:', error)
    return NextResponse.json({ error: 'Failed to process login' }, { status: 500 })
  }
}
