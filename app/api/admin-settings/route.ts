import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

// Simple settings stored in Google Cloud Storage as JSON
const SETTINGS_FILE_NAME = 'admin-settings.json'

interface AdminSettings {
  trainingRoomVisible: boolean
  lastUpdated: string
  updatedBy: string
}

const defaultSettings: AdminSettings = {
  trainingRoomVisible: false,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system'
}

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

async function getSettings(): Promise<AdminSettings> {
  try {
    const bucket = await getGoogleCloudStorage()
    const file = bucket.file(SETTINGS_FILE_NAME)
    
    const [exists] = await file.exists()
    if (!exists) {
      // Create default settings file
      await file.save(JSON.stringify(defaultSettings, null, 2), {
        metadata: { contentType: 'application/json' }
      })
      return defaultSettings
    }

    const [contents] = await file.download()
    return JSON.parse(contents.toString())
  } catch (error) {
    console.error('Error getting settings:', error)
    return defaultSettings
  }
}

async function saveSettings(settings: AdminSettings): Promise<void> {
  try {
    const bucket = await getGoogleCloudStorage()
    const file = bucket.file(SETTINGS_FILE_NAME)
    
    await file.save(JSON.stringify(settings, null, 2), {
      metadata: { contentType: 'application/json' }
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    throw error
  }
}

// GET - Retrieve current settings
export async function GET(request: NextRequest) {
  try {
    const settings = await getSettings()
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

// POST - Update settings (admin only)
export async function POST(request: NextRequest) {
  try {
    const { trainingRoomVisible, userEmail } = await request.json()

    if (!userEmail) {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
    }

    // Verify admin permissions using your existing Google Sheets setup
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
    const { google } = require('googleapis')
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheets = google.sheets({ version: 'v4', auth })
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:K',
    })
    
    const rows = response.data.values || []
    let isAdmin = false
    
    // Check if user has admin permissions
    for (let i = 1; i < rows.length; i++) {
      const [firstName, lastName, userIndustry, userCompany, sheetUserEmail, userPhone, userTimestamp, userSource, userPassword, userStatus, permissions] = rows[i]
      
      if (sheetUserEmail && sheetUserEmail.toLowerCase() === userEmail.toLowerCase() && userStatus === 'Active') {
        if (permissions && typeof permissions === 'string') {
          const userPermissions = permissions.split(',').map(p => p.trim().toLowerCase())
          isAdmin = userPermissions.includes('admin') || userPermissions.includes('upload')
        }
        break
      }
    }
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    // Update settings
    const currentSettings = await getSettings()
    const updatedSettings: AdminSettings = {
      ...currentSettings,
      trainingRoomVisible: trainingRoomVisible ?? currentSettings.trainingRoomVisible,
      lastUpdated: new Date().toISOString(),
      updatedBy: userEmail
    }

    await saveSettings(updatedSettings)

    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}