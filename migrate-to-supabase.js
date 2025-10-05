const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const { parse } = require('csv-parse/sync')

// Supabase credentials
const supabaseUrl = 'https://uuvfilstqunrhrxwmfri.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dmZpbHN0cXVucmhyeHdtZnJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxNjM4MCwiZXhwIjoyMDc1MTkyMzgwfQ.HvkyU2DXqtqno5l5e5HxpB_GXtpvAzIAu1PyepZ6H00'

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateUsers() {
  console.log('📥 Reading users.csv...')
  const usersCSV = fs.readFileSync('users.csv', 'utf-8')
  const records = parse(usersCSV, { columns: true, skip_empty_lines: true })

  console.log(`Found ${records.length} users to migrate`)

  for (const record of records) {
    // Skip rows without email
    if (!record.Email || !record.Email.trim()) {
      console.log('⚠️  Skipping row without email')
      continue
    }

    const user = {
      email: record.Email.toLowerCase().trim(),
      password: record.Password || '',
      first_name: record['First Name'] || null,
      last_name: record['Last Name'] || null,
      industry: record.Industry || null,
      company: record['Company Name'] || null,
      phone: record.Phone || null,
      status: record.Status || 'Active',
      permissions: record.Permissions ? [record.Permissions.toLowerCase()] : ['chat'],
      assistant_name: record['Assistant Name'] || 'Piper',
      workspace_owner: record.WorkSpaceOwner ? record.WorkSpaceOwner.toLowerCase().trim() : null,
      custom_instructions: record.CustomInstructions || null
    }

    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()

    if (error) {
      console.error(`❌ Error inserting user ${user.email}:`, error.message)
    } else {
      console.log(`✅ Migrated user: ${user.email}`)
    }
  }
}

async function migrateClients() {
  console.log('\n📥 Reading clients.csv...')
  const clientsCSV = fs.readFileSync('clients.csv', 'utf-8')
  const records = parse(clientsCSV, { columns: true, skip_empty_lines: true })

  console.log(`Found ${records.length} clients to migrate`)

  for (const record of records) {
    // Skip rows without client name or workspace owner
    if (!record['Client Name'] || !record.WorkspaceOwner) {
      console.log('⚠️  Skipping row without client name or workspace owner')
      continue
    }

    const client = {
      user_email: record.WorkspaceOwner.toLowerCase().trim(),
      client_name: record['Client Name'].trim(),
      company: record['Client Name'].trim(), // Use client name as company if no separate company field
      email: record.Email || null,
      phone: record.Phone || null,
      address: record.Address || null,
      industry: record.Industry || null,
      status: record.Status || 'Active'
    }

    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()

    if (error) {
      console.error(`❌ Error inserting client ${client.client_name}:`, error.message)
    } else {
      console.log(`✅ Migrated client: ${client.client_name} (${client.user_email})`)
    }
  }
}

async function main() {
  console.log('🚀 Starting migration to Supabase...\n')

  try {
    await migrateUsers()
    await migrateClients()
    console.log('\n✨ Migration complete!')
  } catch (error) {
    console.error('💥 Migration failed:', error)
  }
}

main()
