const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

// Initialize Supabase client
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateReportLinks() {
  try {
    console.log('Starting report links migration...')

    // Read the CSV file
    const csvPath = path.join(__dirname, 'reportlinks.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')

    // Parse CSV (simple parser - assumes no commas in quoted fields except attachments)
    const lines = csvContent.split('\n')
    const headers = lines[0].split(',')

    console.log(`Found ${lines.length - 1} rows in CSV`)

    const reportLinks = []

    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Custom CSV parser to handle JSON fields
      const values = []
      let currentValue = ''
      let inQuotes = false
      let inJson = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]

        if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
          inQuotes = !inQuotes
          continue
        }

        if (char === '[' || char === '{') {
          inJson = true
        }

        if (char === ']' || char === '}') {
          inJson = false
          currentValue += char
          continue
        }

        if (char === ',' && !inQuotes && !inJson) {
          values.push(currentValue.trim())
          currentValue = ''
          continue
        }

        currentValue += char
      }

      // Push the last value
      values.push(currentValue.trim())

      // Helper function to safely parse JSON
      const safeJSONParse = (value) => {
        if (!value || value.trim() === '') return null
        try {
          if (value.startsWith('[') || value.startsWith('{')) {
            return JSON.parse(value)
          }
        } catch (e) {
          console.warn(`Failed to parse JSON: ${value.substring(0, 50)}...`)
        }
        return null
      }

      // Map CSV columns to Supabase columns
      const reportLink = {
        report_id: values[0] || null,
        title: values[1] || null,
        content_path: values[2] || null,
        chart_data: safeJSONParse(values[3]),
        created_date: values[4] || null,
        created_by: values[5] || null,
        client_name: values[6] || null,
        client_email: values[7] || null,
        expires_at: values[8] || null,
        is_active: values[9] === 'TRUE',
        view_count: parseInt(values[10]) || 0,
        last_viewed: values[11] || null,
        description: values[12] || null,
        project_type: values[13] || null,
        shareable_url: values[14] || null,
        allow_responses: values[15] === 'TRUE',
        recipient_response: values[16] || null,
        response_date: values[17] || null,
        response_email: values[18] || null,
        response_attachments: safeJSONParse(values[19]),
        report_attachments: safeJSONParse(values[20]),
      }

      // Skip if no report_id
      if (!reportLink.report_id) continue

      reportLinks.push(reportLink)
    }

    console.log(`Parsed ${reportLinks.length} report links`)

    // Insert into Supabase in batches
    const batchSize = 50
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < reportLinks.length; i += batchSize) {
      const batch = reportLinks.slice(i, i + batchSize)

      console.log(`\nInserting batch ${Math.floor(i/batchSize) + 1} (${batch.length} records)...`)

      const { data, error } = await supabase
        .from('report_links')
        .insert(batch)
        .select()

      if (error) {
        console.error(`Error inserting batch:`, error)
        errorCount += batch.length

        // Try inserting one by one to see which ones fail
        console.log('Trying individual inserts for this batch...')
        for (const report of batch) {
          const { error: singleError } = await supabase
            .from('report_links')
            .insert(report)

          if (singleError) {
            console.error(`Failed to insert report ${report.report_id}:`, singleError.message)
            errorCount++
          } else {
            console.log(`✓ Inserted report ${report.report_id}`)
            successCount++
          }
        }
      } else {
        successCount += batch.length
        console.log(`✓ Batch inserted successfully`)
      }
    }

    console.log('\n=== Migration Complete ===')
    console.log(`Successfully inserted: ${successCount} report links`)
    console.log(`Failed: ${errorCount} report links`)

  } catch (error) {
    console.error('Migration error:', error)
    process.exit(1)
  }
}

// Run migration
migrateReportLinks()
