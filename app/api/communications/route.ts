import { NextRequest, NextResponse } from "next/server"
import { google } from 'googleapis'

// This API handles both updates/announcements and feedback responses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')
    const type = searchParams.get('type') // 'updates' or 'feedback' or 'all'

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 })
    }

    if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json({ error: 'Google Sheets configuration missing' }, { status: 500 })
    }

    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheets = google.sheets({ version: 'v4', auth })

    const communications: any[] = []

    // Get updates/announcements if requested
    if (type === 'updates' || type === 'all') {
      try {
        const updatesResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'Updates!A:G', // ID, Date, Title, Message, Target Audience, Status, Created By
        })

        const updatesRows = updatesResponse.data.values || []
        
        // Skip header row and process updates
        for (let i = 1; i < updatesRows.length; i++) {
          const [id, date, title, message, targetAudience, status, createdBy] = updatesRows[i]
          
          // Check if user should see this update
          if (status === 'Active' && (
            targetAudience === 'All Users' || 
            targetAudience === 'Beta Users' ||
            targetAudience?.toLowerCase().includes(userEmail.toLowerCase())
          )) {
            communications.push({
              id: id || `update_${i}`,
              type: 'update',
              date: date,
              title: title || 'Update',
              message: message || '',
              targetAudience: targetAudience,
              createdBy: createdBy || 'Admin'
            })
          }
        }
      } catch (error) {
        console.log('Updates sheet not found or empty, skipping updates')
      }
    }

    // Get feedback responses if requested
    if (type === 'feedback' || type === 'all') {
      try {
        const feedbackResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'Feedback!A:J', // Include admin response columns
        })

        const feedbackRows = feedbackResponse.data.values || []
        
        // Skip header row and find user's feedback
        for (let i = 1; i < feedbackRows.length; i++) {
          const [timestamp, email, feedbackType, subject, message, rating, pageFeature, status, adminResponse, responseDate] = feedbackRows[i]
          
          if (email && email.toLowerCase() === userEmail.toLowerCase()) {
            if (adminResponse) {
              // User feedback with admin response
              communications.push({
                id: `feedback_response_${i}`,
                type: 'feedback_response',
                date: responseDate || timestamp,
                title: `Re: ${subject || 'Your Feedback'}`,
                message: adminResponse,
                originalFeedback: {
                  type: feedbackType,
                  subject: subject,
                  message: message,
                  rating: rating,
                  date: timestamp
                },
                createdBy: 'Admin'
              })
            } else {
              // User feedback without admin response (so they can see what they submitted)
              communications.push({
                id: `feedback_submitted_${i}`,
                type: 'feedback_submitted',
                date: timestamp,
                title: `${subject || 'Your Feedback'} (Submitted)`,
                message: message,
                originalFeedback: {
                  type: feedbackType,
                  subject: subject,
                  message: message,
                  rating: rating,
                  date: timestamp
                },
                createdBy: 'You'
              })
            }
          }
        }
      } catch (error) {
        console.error('Error fetching feedback responses:', error)
      }
    }

    // Sort communications by date (newest first)
    communications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Check for unread updates if lastLoginTime is provided
    let unreadUpdatesCount = 0
    const lastLoginTime = searchParams.get('lastLoginTime')
    
    if (lastLoginTime && type === 'all') {
      const lastLogin = new Date(lastLoginTime)
      unreadUpdatesCount = communications.filter(comm => 
        comm.type === 'update' && new Date(comm.date) > lastLogin
      ).length
    }

    return NextResponse.json({ 
      success: true, 
      communications,
      count: communications.length,
      unreadUpdatesCount
    })

  } catch (error) {
    console.error('Communications GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch communications' }, { status: 500 })
  }
}

// POST - Admin functions: create updates or respond to feedback
export async function POST(request: NextRequest) {
  try {
    const { action, userEmail, ...data } = await request.json()

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json({ error: 'Google Sheets configuration missing' }, { status: 500 })
    }

    // Verify admin permissions
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

    const timestamp = new Date().toISOString()

    if (action === 'create_update') {
      // Create new update/announcement
      const { title, message, targetAudience = 'All Users' } = data
      
      if (!title || !message) {
        return NextResponse.json({ error: 'Title and message required' }, { status: 400 })
      }

      // Generate unique ID
      const updateId = `UPD_${Date.now()}`
      
      const values = [[
        updateId,
        timestamp,
        title,
        message,
        targetAudience,
        'Active',
        userEmail
      ]]
      
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'Updates!A:G',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        })
      } catch (error) {
        // If Updates sheet doesn't exist, create it first
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: 'Updates'
                }
              }
            }]
          }
        })
        
        // Add header row
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'Updates!A1:G1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['ID', 'Date', 'Title', 'Message', 'Target Audience', 'Status', 'Created By']]
          },
        })
        
        // Add the update
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'Updates!A:G',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Update created successfully',
        updateId
      })

    } else if (action === 'respond_to_feedback') {
      // Respond to user feedback
      const { feedbackRowIndex, response } = data
      
      if (!response || feedbackRowIndex === undefined) {
        return NextResponse.json({ error: 'Response and feedback row index required' }, { status: 400 })
      }

      // Update the feedback row with admin response
      const range = `Feedback!I${feedbackRowIndex + 1}:J${feedbackRowIndex + 1}` // Admin Response, Response Date
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[response, timestamp]]
        },
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Feedback response added successfully'
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Communications POST error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}