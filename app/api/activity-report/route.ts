import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from '@/lib/supabase'
import { Storage } from '@google-cloud/storage'

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userEmail = searchParams.get('userEmail')
    const workspaceOwner = searchParams.get('workspaceOwner')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userEmail || !startDate || !endDate) {
      return NextResponse.json({
        error: 'Missing required parameters'
      }, { status: 400 })
    }

    const owner = workspaceOwner || userEmail
    const sanitizedEmail = owner.replace(/[@.]/g, '_')

    // Fetch reports from report_links
    // Convert dates to proper ISO format for Supabase
    const startDateTime = new Date(startDate).toISOString()
    const endDateTime = new Date(`${endDate}T23:59:59.999Z`).toISOString()

    console.log('[ActivityReport] Querying reports:', { owner, startDateTime, endDateTime })

    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('report_links')
      .select('*')
      .eq('created_by', owner)
      .gte('created_date', startDateTime)
      .lte('created_date', endDateTime)
      .order('created_date', { ascending: false })

    if (reportsError) {
      console.error('[ActivityReport] Error fetching reports:', reportsError)
    } else {
      console.log('[ActivityReport] Found reports:', reports?.length || 0)
    }

    // Fetch client notes from client-files (Reports-view structure)
    const bucket = await getGoogleCloudStorage()
    const notesPrefix = `Reports-view/${sanitizedEmail}/client-files/`
    const [noteFiles] = await bucket.getFiles({ prefix: notesPrefix })

    console.log('[ActivityReport] Scanning files in:', notesPrefix)
    console.log('[ActivityReport] Found files:', noteFiles.length)

    const notes = []
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(`${endDate}T23:59:59.999Z`)

    for (const file of noteFiles) {
      // Look for note files in client-files/[client]/notes/
      if (file.name.includes('/notes/') && file.name.endsWith('.md')) {
        const [metadata] = await file.getMetadata()
        const timestamp = new Date(metadata.timeCreated || metadata.updated)

        if (timestamp >= startDateObj && timestamp <= endDateObj) {
          // Extract client name from path: Reports-view/user/client-files/client-name/notes/file.md
          const pathParts = file.name.split('/')
          const clientIndex = pathParts.indexOf('client-files') + 1
          const clientName = clientIndex > 0 ? pathParts[clientIndex].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'

          const fileName = file.name.split('/').pop() || ''

          // Try to read the file to get the actual title from content
          try {
            const [content] = await file.download()
            const firstLine = content.toString().split('\n')[0]
            // Remove markdown heading syntax if present
            const title = firstLine.replace(/^#+\s*/, '').trim() || fileName

            notes.push({
              clientName,
              title,
              date: timestamp.toISOString(),
              type: 'note',
              filePath: file.name
            })
          } catch (error) {
            // Fallback to filename if can't read file
            const titleMatch = fileName.match(/note_(.+)\.md$/)
            const title = titleMatch ? titleMatch[1] : fileName

            notes.push({
              clientName,
              title,
              date: timestamp.toISOString(),
              type: 'note',
              filePath: file.name
            })
          }
        } else {
          // If not in date range, skip
          continue
        }
      }
    }

    console.log('[ActivityReport] Found notes:', notes.length)

    // Fetch projects/threads from client-files/[client]/threads/
    const threads = []
    for (const file of noteFiles) {
      // Look for thread files in client-files/[client]/threads/
      if (file.name.includes('/threads/') && file.name.endsWith('.json')) {
        const [metadata] = await file.getMetadata()
        const timestamp = new Date(metadata.timeCreated || metadata.updated)

        if (timestamp >= startDateObj && timestamp <= endDateObj) {
          try {
            const [content] = await file.download()
            const threadData = JSON.parse(content.toString())

            // Extract client name from path
            const pathParts = file.name.split('/')
            const clientIndex = pathParts.indexOf('client-files') + 1
            const clientName = clientIndex > 0 ? pathParts[clientIndex].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : (threadData.clientName || 'Unknown')

            // Extract title from filename if not in threadData
            // Format: [THREAD] Title - ProjectType - Date.json
            const fileName = file.name.split('/').pop() || ''
            const fileNameMatch = fileName.match(/^\[THREAD\]\s+(.+?)\s+-\s+(.+?)\s+-\s+(.+)\.json$/)
            const titleFromFile = fileNameMatch ? fileNameMatch[1] : null

            threads.push({
              clientName,
              title: titleFromFile || threadData.title || 'Untitled Thread',
              date: timestamp.toISOString(),
              type: 'thread',
              projectType: threadData.projectType,
              status: threadData.status,
              priority: threadData.priority,
              messageCount: threadData.messages?.length || 0
            })
          } catch (parseError) {
            console.error('[ActivityReport] Error parsing thread:', parseError)
          }
        }
      }
    }

    console.log('[ActivityReport] Found threads:', threads.length)

    // Group all activities by client
    const activityByClient: Record<string, any> = {}

    // Add reports
    if (reports) {
      reports.forEach(report => {
        const clientName = report.client_name || 'No Client'
        if (!activityByClient[clientName]) {
          activityByClient[clientName] = { reports: [], notes: [], threads: [] }
        }
        activityByClient[clientName].reports.push({
          title: report.title,
          date: report.created_date,
          type: 'report',
          reportId: report.report_id,
          viewCount: report.view_count || 0,
          projectType: report.project_type,
          description: report.description
        })
      })
    }

    // Add notes
    notes.forEach(note => {
      if (!activityByClient[note.clientName]) {
        activityByClient[note.clientName] = { reports: [], notes: [], threads: [] }
      }
      activityByClient[note.clientName].notes.push(note)
    })

    // Add threads
    threads.forEach(thread => {
      if (!activityByClient[thread.clientName]) {
        activityByClient[thread.clientName] = { reports: [], notes: [], threads: [] }
      }
      activityByClient[thread.clientName].threads.push(thread)
    })

    // Sort clients alphabetically
    const sortedClients = Object.keys(activityByClient).sort()
    const sortedActivity: Record<string, any> = {}
    sortedClients.forEach(client => {
      sortedActivity[client] = activityByClient[client]
    })

    return NextResponse.json({
      success: true,
      activity: sortedActivity,
      summary: {
        totalClients: sortedClients.length,
        totalReports: reports?.length || 0,
        totalNotes: notes.length,
        totalThreads: threads.length
      }
    })

  } catch (error) {
    console.error('[ActivityReport] Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch activity report'
    }, { status: 500 })
  }
}
