import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, industry, companyName, email, phoneNumber } = await request.json()

    if (!firstName || !lastName || !industry || !email || !phoneNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    // Generate a temporary password for waitlist users
    // This will be replaced when the admin activates their account
    const tempPassword = `temp_${Math.random().toString(36).slice(2, 10)}`

    // Insert new user signup into Supabase
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: normalizedEmail,
        password: tempPassword,
        first_name: firstName,
        last_name: lastName,
        industry: industry,
        company: companyName || null,
        phone: phoneNumber,
        status: 'Pending', // Waitlist users start as Pending
        permissions: ['chat'],
        assistant_name: 'Piper'
      })
      .select()

    if (error) {
      // If user already exists (duplicate email)
      if (error.code === '23505') {
        return NextResponse.json({
          error: 'Email already registered'
        }, { status: 400 })
      }
      console.error('[WAITLIST] Supabase error:', error)
      return NextResponse.json({
        error: 'Failed to add to waitlist'
      }, { status: 500 })
    }

    console.log(`[WAITLIST] New signup: ${firstName} ${lastName} - ${normalizedEmail}`)

    return NextResponse.json({
      success: true,
      message: 'Successfully added to waitlist'
    })

  } catch (error) {
    console.error('[WAITLIST] Error:', error)
    return NextResponse.json({
      error: 'Failed to add to waitlist'
    }, { status: 500 })
  }
}
