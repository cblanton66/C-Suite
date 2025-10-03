import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Storage } from '@google-cloud/storage'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface ExistingClient {
  folderName: string
  clientName: string
  userEmail: string
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

function folderToClientName(folderName: string): string {
  return folderName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function findExistingClients(): Promise<ExistingClient[]> {
  const bucket = await getGoogleCloudStorage()
  const [files] = await bucket.getFiles({
    prefix: 'Reports-view/',
  })

  const clientsMap = new Map<string, ExistingClient>()

  for (const file of files) {
    const match = file.name.match(/^Reports-view\/([^/]+)\/client-files\/([^/]+)\//)

    if (match) {
      const userFolder = match[1]
      const clientFolder = match[2]

      const userEmail = userFolder.replace(/_/g, (match, offset, string) => {
        const beforeMatch = string.substring(0, offset)
        const underscoreCount = (beforeMatch.match(/_/g) || []).length
        return underscoreCount === 0 ? '@' : '.'
      })

      const key = `${userEmail}:${clientFolder}`

      if (!clientsMap.has(key)) {
        clientsMap.set(key, {
          folderName: clientFolder,
          clientName: folderToClientName(clientFolder),
          userEmail: userEmail
        })
      }
    }
  }

  return Array.from(clientsMap.values())
}

async function getExistingClientsFromSheet(): Promise<Set<string>> {
  const sheets = await getGoogleSheetsClient()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range: 'UserClients!A:J',
  })

  const rows = response.data.values || []
  const existingClients = new Set<string>()

  for (let i = 1; i < rows.length; i++) {
    const clientName = rows[i][0]
    const workspaceOwner = rows[i][6]
    if (clientName && workspaceOwner) {
      existingClients.add(`${workspaceOwner}:${clientName}`)
    }
  }

  return existingClients
}

export async function POST(request: NextRequest) {
  try {
    console.log('[migrate-clients] Starting migration...')

    const existingClients = await findExistingClients()
    console.log(`[migrate-clients] Found ${existingClients.length} client folders`)

    if (existingClients.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No existing client folders found',
        added: 0
      })
    }

    const sheets = await getGoogleSheetsClient()
    const existingInSheet = await getExistingClientsFromSheet()

    const newRows: string[][] = []
    const skipped: string[] = []
    const added: string[] = []

    for (const client of existingClients) {
      const key = `${client.userEmail}:${client.clientName}`

      if (existingInSheet.has(key)) {
        skipped.push(`${client.clientName} (${client.userEmail})`)
        continue
      }

      const row = [
        client.clientName,
        '',
        '',
        '',
        '',
        'Active',
        client.userEmail,
        client.userEmail,
        '',
        new Date().toISOString(),
      ]

      newRows.push(row)
      added.push(`${client.clientName} (${client.userEmail})`)
    }

    if (newRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID!,
        range: 'UserClients!A:J',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: newRows,
        },
      })
    }

    console.log(`[migrate-clients] Added ${newRows.length} clients, skipped ${skipped.length}`)

    return NextResponse.json({
      success: true,
      message: `Migration complete! Added ${newRows.length} client(s), skipped ${skipped.length} existing.`,
      added: added,
      skipped: skipped,
      total: existingClients.length
    })

  } catch (error) {
    console.error('[migrate-clients] Error:', error)
    return NextResponse.json(
      { error: 'Migration failed: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
