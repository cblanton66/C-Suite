import { NextRequest, NextResponse } from "next/server"
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('userEmail')
    const lastReadTime = request.nextUrl.searchParams.get('lastReadTime')

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 })
    }

    if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json({ error: 'Google Sheets configuration missing' }, { status: 500 })
    }

    // Verify admin permissions first
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheets = google.sheets({ version: 'v4', auth })
    
    // Check if user is admin
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:L',
    })
    
    const userRows = usersResponse.data.values || []
    let isAdmin = false
    
    for (let i = 1; i < userRows.length; i++) {
      const [firstName, lastName, userIndustry, userCompany, sheetUserEmail, userPhone, userTimestamp, userSource, userPassword, userStatus, permissions] = userRows[i]
      
      if (sheetUserEmail && sheetUserEmail.toLowerCase() === userEmail.toLowerCase() && userStatus === 'Active') {
        if (permissions && typeof permissions === 'string') {
          const userPermissions = permissions.split(',').map(p => p.trim().toLowerCase())
          isAdmin = userPermissions.includes('admin')
        }
        break
      }
    }
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    // Get feedback data
    const feedbackResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Feedback!A:J',
    })

    const feedbackRows = feedbackResponse.data.values || []
    let unrespondedCount = 0
    
    // Skip header row and count unresponded feedback
    for (let i = 1; i < feedbackRows.length; i++) {
      const [timestamp, email, feedbackType, subject, message, rating, pageFeature, status, adminResponse, responseDate] = feedbackRows[i]
      
      // Count feedback without admin response
      if (email && subject && !adminResponse) {
        unrespondedCount++
      }
    }

    // Also count unread updates if lastReadTime is provided
    let unreadUpdatesCount = 0
    if (lastReadTime) {
      try {
        const updatesResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'Updates!A:G',
        })

        const updatesRows = updatesResponse.data.values || []
        const lastRead = new Date(lastReadTime)
        
        // Skip header row and count unread updates
        for (let i = 1; i < updatesRows.length; i++) {
          const [id, date, title, message, targetAudience, status, createdBy] = updatesRows[i]
          
          // Count active updates posted after last read time
          if (status === 'Active' && date && new Date(date) > lastRead) {
            // Check if user should see this update
            if (targetAudience === 'All Users' || 
                targetAudience === 'Beta Users' ||
                targetAudience?.toLowerCase().includes(userEmail.toLowerCase())) {
              unreadUpdatesCount++
            }
          }
        }
      } catch (error) {
        console.log('Updates sheet not found or empty, skipping unread updates count')
      }
    }

    return NextResponse.json({ 
      success: true, 
      unrespondedCount,
      unreadUpdatesCount,
      totalUnreadCount: unrespondedCount + unreadUpdatesCount
    })

  } catch (error) {
    console.error('Admin feedback count error:', error)
    return NextResponse.json({ error: 'Failed to get feedback count' }, { status: 500 })
  }
}