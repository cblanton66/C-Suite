import { Storage } from '@google-cloud/storage'
import { google } from 'googleapis'

interface ExistingClient {
  folderName: string
  clientName: string
  userEmail: string
}

async function getGoogleCloudStorage() {
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error('GOOGLE_CREDENTIALS environment variable is missing')
  }

  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8')
  )

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
  // Convert kebab-case folder name to Title Case client name
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
    // Match pattern: Reports-view/{user}/client-files/{client-folder}/...
    const match = file.name.match(/^Reports-view\/([^/]+)\/client-files\/([^/]+)\//)

    if (match) {
      const userFolder = match[1]
      const clientFolder = match[2]

      // Convert user folder back to email
      const userEmail = userFolder.replace(/_/g, (match, offset, string) => {
        // First underscore is @, rest are dots
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

  // Skip header row, build set of "email:clientname" keys
  for (let i = 1; i < rows.length; i++) {
    const clientName = rows[i][0] // Column A
    const workspaceOwner = rows[i][6] // Column G
    if (clientName && workspaceOwner) {
      existingClients.add(`${workspaceOwner}:${clientName}`)
    }
  }

  return existingClients
}

async function addClientsToSheet(clients: ExistingClient[]) {
  const sheets = await getGoogleSheetsClient()
  const existingClients = await getExistingClientsFromSheet()

  const newRows: string[][] = []

  for (const client of clients) {
    const key = `${client.userEmail}:${client.clientName}`

    if (existingClients.has(key)) {
      console.log(`⏭️  Skipping ${client.clientName} for ${client.userEmail} (already exists)`)
      continue
    }

    // Create new row
    const row = [
      client.clientName,           // A: Client Name
      '',                          // B: Email
      '',                          // C: Phone
      '',                          // D: Address
      '',                          // E: Industry
      'Active',                    // F: Status
      client.userEmail,            // G: Workspace Owner
      client.userEmail,            // H: Created By
      '',                          // I: Shared With
      new Date().toISOString(),    // J: Date Added
    ]

    newRows.push(row)
    console.log(`✅ Adding ${client.clientName} for ${client.userEmail}`)
  }

  if (newRows.length === 0) {
    console.log('\n✨ No new clients to add - all existing clients are already in the database!')
    return
  }

  // Append all new rows
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range: 'UserClients!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: newRows,
    },
  })

  console.log(`\n✨ Successfully added ${newRows.length} client(s) to UserClients sheet!`)
}

async function main() {
  console.log('🔍 Scanning Google Cloud Storage for existing client folders...\n')

  const existingClients = await findExistingClients()

  if (existingClients.length === 0) {
    console.log('No existing client folders found.')
    return
  }

  console.log(`Found ${existingClients.length} existing client folder(s):\n`)

  existingClients.forEach(client => {
    console.log(`  📁 ${client.folderName} → "${client.clientName}" (${client.userEmail})`)
  })

  console.log('\n📝 Adding clients to UserClients sheet...\n')

  await addClientsToSheet(existingClients)

  console.log('\n✅ Migration complete!')
}

main().catch(error => {
  console.error('❌ Error running migration:', error)
  process.exit(1)
})
