import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

// Sample reports stored in Google Cloud Storage as JSON
const SAMPLE_REPORTS_FILE_NAME = 'sample-reports.json'

interface SampleReports {
  q3Financial: string
  q3FinancialTitle: string
  cashFlow: string
  cashFlowTitle: string
  taxStrategy: string
  taxStrategyTitle: string
  kpiDashboard: string
  kpiDashboardTitle: string
  lastUpdated: string
  updatedBy: string
}

const defaultSampleReports: SampleReports = {
  q3Financial: '',
  q3FinancialTitle: 'Q3 Financial Analysis',
  cashFlow: '',
  cashFlowTitle: 'Cash Flow Forecast', 
  taxStrategy: '',
  taxStrategyTitle: 'Tax Strategy Report',
  kpiDashboard: '',
  kpiDashboardTitle: 'KPI Dashboard Review',
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

async function getSampleReports(): Promise<SampleReports> {
  try {
    const bucket = await getGoogleCloudStorage()
    const file = bucket.file(SAMPLE_REPORTS_FILE_NAME)
    
    const [exists] = await file.exists()
    if (!exists) {
      // Create default sample reports file
      await file.save(JSON.stringify(defaultSampleReports, null, 2), {
        metadata: { contentType: 'application/json' }
      })
      return defaultSampleReports
    }

    const [contents] = await file.download()
    return JSON.parse(contents.toString())
  } catch (error) {
    console.error('Error getting sample reports:', error)
    return defaultSampleReports
  }
}

async function saveSampleReports(reports: SampleReports): Promise<void> {
  try {
    const bucket = await getGoogleCloudStorage()
    const file = bucket.file(SAMPLE_REPORTS_FILE_NAME)
    
    await file.save(JSON.stringify(reports, null, 2), {
      metadata: { contentType: 'application/json' }
    })
  } catch (error) {
    console.error('Error saving sample reports:', error)
    throw error
  }
}

// GET - Retrieve current sample reports
export async function GET(request: NextRequest) {
  try {
    const reports = await getSampleReports()
    return NextResponse.json({ success: true, reports })
  } catch (error) {
    console.error('Sample reports GET error:', error)
    return NextResponse.json({ error: 'Failed to get sample reports' }, { status: 500 })
  }
}

// POST - Update sample reports (admin only)
export async function POST(request: NextRequest) {
  try {
    const { 
      q3Financial, q3FinancialTitle, 
      cashFlow, cashFlowTitle, 
      taxStrategy, taxStrategyTitle, 
      kpiDashboard, kpiDashboardTitle, 
      userEmail 
    } = await request.json()

    if (!userEmail) {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
    }

    // Verify admin permissions using Google Sheets
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
          isAdmin = userPermissions.includes('admin')
        }
        break
      }
    }
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    // Update sample reports
    const currentReports = await getSampleReports()
    const updatedReports: SampleReports = {
      ...currentReports,
      q3Financial: q3Financial ?? currentReports.q3Financial,
      q3FinancialTitle: q3FinancialTitle ?? currentReports.q3FinancialTitle,
      cashFlow: cashFlow ?? currentReports.cashFlow,
      cashFlowTitle: cashFlowTitle ?? currentReports.cashFlowTitle,
      taxStrategy: taxStrategy ?? currentReports.taxStrategy,
      taxStrategyTitle: taxStrategyTitle ?? currentReports.taxStrategyTitle,
      kpiDashboard: kpiDashboard ?? currentReports.kpiDashboard,
      kpiDashboardTitle: kpiDashboardTitle ?? currentReports.kpiDashboardTitle,
      lastUpdated: new Date().toISOString(),
      updatedBy: userEmail
    }

    await saveSampleReports(updatedReports)

    return NextResponse.json({ 
      success: true, 
      reports: updatedReports,
      message: 'Sample reports updated successfully'
    })

  } catch (error) {
    console.error('Sample reports POST error:', error)
    return NextResponse.json({ error: 'Failed to update sample reports' }, { status: 500 })
  }
}