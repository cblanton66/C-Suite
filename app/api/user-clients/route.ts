import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
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

interface ClientData {
  clientName: string
  email: string
  phone: string
  address: string
  industry: string
  status: string
  workspaceOwner: string
  createdBy: string
  sharedWith: string
  dateAdded: string
}

async function getGoogleSheetsClient() {
  if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
    throw new Error('Google Sheets configuration missing')
  }

  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8')
  )

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({ version: 'v4', auth })
}

// GET - Fetch all clients for a user
export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('userEmail')
    const workspaceOwner = request.nextUrl.searchParams.get('workspaceOwner')

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    const sheets = await getGoogleSheetsClient()

    // Get all data from UserClients sheet
    // Columns: A=Client Name, B=Email, C=Phone, D=Address, E=Industry, F=Status,
    //          G=Workspace Owner, H=Created By, I=Shared With, J=Date Added
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: 'UserClients!A:J',
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ clients: [] })
    }

    const owner = workspaceOwner || userEmail

    // Filter clients where user is workspace owner OR in sharedWith
    const userClients = rows
      .slice(1) // Skip header row
      .filter(row => {
        const rowWorkspaceOwner = row[6] || '' // Column G
        const rowSharedWith = row[8] || '' // Column I
        const status = row[5] || 'Active' // Column F

        // Show if Active AND (owner OR shared with user)
        return (
          status === 'Active' &&
          (rowWorkspaceOwner === owner || rowSharedWith.includes(userEmail))
        )
      })
      .map(row => ({
        clientName: row[0] || '',
        email: row[1] || '',
        phone: row[2] || '',
        address: row[3] || '',
        industry: row[4] || '',
        status: row[5] || 'Active',
        workspaceOwner: row[6] || '',
        createdBy: row[7] || '',
        sharedWith: row[8] || '',
        dateAdded: row[9] || new Date().toISOString(),
      }))

    return NextResponse.json({ success: true, clients: userClients })
  } catch (error) {
    console.error('Error fetching clients:', error)
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

    const sheets = await getGoogleSheetsClient()
    const owner = workspaceOwner || userEmail

    // Check if client already exists for this workspace
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: 'UserClients!A:J',
    })

    const rows = response.data.values || []

    // Check for duplicate (same client name and workspace owner)
    const duplicate = rows.slice(1).find(row =>
      row[0] === clientName && row[6] === owner
    )

    if (duplicate) {
      return NextResponse.json(
        { error: 'Client already exists' },
        { status: 400 }
      )
    }

    // Append new client row
    const newRow = [
      clientName,
      email || '',
      phone || '',
      address || '',
      industry || '',
      'Active',
      owner,
      userEmail,
      '', // sharedWith - empty initially
      new Date().toISOString(),
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: 'UserClients!A:J',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    })

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

      console.log(`[user-clients] Created folder structure for client: ${clientName} (${clientSlug})`)
    } catch (storageError) {
      console.error('[user-clients] Error creating GCS folders:', storageError)
      // Don't fail the entire request if folder creation fails
      // The client is still created in the database
    }

    return NextResponse.json({
      success: true,
      client: {
        clientName,
        email: email || '',
        phone: phone || '',
        address: address || '',
        industry: industry || '',
        status: 'Active',
        workspaceOwner: owner,
        createdBy: userEmail,
        sharedWith: '',
        dateAdded: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error creating client:', error)
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
    const { clientName, email, phone, address, industry, status, sharedWith, userEmail, workspaceOwner } = body

    if (!clientName || !userEmail) {
      return NextResponse.json(
        { error: 'Client name and user email are required' },
        { status: 400 }
      )
    }

    const sheets = await getGoogleSheetsClient()
    const owner = workspaceOwner || userEmail

    // Find the row to update
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: 'UserClients!A:J',
    })

    const rows = response.data.values || []
    const rowIndex = rows.findIndex((row, index) =>
      index > 0 && row[0] === clientName && row[6] === owner
    )

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Update the row (keep original dateAdded and createdBy)
    const originalRow = rows[rowIndex]
    const updatedRow = [
      clientName,
      email || originalRow[1] || '',
      phone || originalRow[2] || '',
      address || originalRow[3] || '',
      industry || originalRow[4] || '',
      status || originalRow[5] || 'Active',
      owner,
      originalRow[7] || userEmail, // Keep original createdBy
      sharedWith || originalRow[8] || '',
      originalRow[9] || new Date().toISOString(), // Keep original dateAdded
    ]

    // Update the specific row (rowIndex + 1 because sheets are 1-indexed)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: `UserClients!A${rowIndex + 1}:J${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    })

    return NextResponse.json({
      success: true,
      client: {
        clientName,
        email: updatedRow[1],
        phone: updatedRow[2],
        address: updatedRow[3],
        industry: updatedRow[4],
        status: updatedRow[5],
        workspaceOwner: updatedRow[6],
        createdBy: updatedRow[7],
        sharedWith: updatedRow[8],
        dateAdded: updatedRow[9],
      },
    })
  } catch (error) {
    console.error('Error updating client:', error)
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

    const sheets = await getGoogleSheetsClient()
    const owner = workspaceOwner || userEmail

    // Find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: 'UserClients!A:J',
    })

    const rows = response.data.values || []
    const rowIndex = rows.findIndex((row, index) =>
      index > 0 && row[0] === clientName && row[6] === owner
    )

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Update status to Inactive
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: `UserClients!F${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Inactive']],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
