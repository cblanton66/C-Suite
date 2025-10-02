import { Storage } from '@google-cloud/storage'

let storage: Storage | null = null

const initializeStorage = () => {
  if (!storage) {
    let credentials = undefined
    if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
      try {
        // Decode base64 credentials
        const decodedCredentials = Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS, 'base64').toString('utf-8')
        credentials = JSON.parse(decodedCredentials)
      } catch (error) {
        console.error('Error parsing Google Cloud credentials:', error)
      }
    }
    
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials,
    })
  }
  return storage
}

export async function savePrivateNote(userId: string, clientName: string, content: string, title?: string): Promise<boolean> {
  try {
    const storage = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME
    
    if (!bucketName) {
      console.error('GOOGLE_CLOUD_BUCKET_NAME environment variable is not set')
      return false
    }

    // Convert email to Google Cloud folder format: @ becomes _ and . becomes _
    const folderUserId = userId.replace(/@/g, '_').replace(/\./g, '_')
    const clientFolder = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    
    const bucket = storage.bucket(bucketName)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `note_${timestamp}.md`
    const filePath = `Reports-view/${folderUserId}/private/${clientFolder}/${fileName}`
    
    const noteContent = `# ${title || `Private Note - ${clientName}`}
**Date:** ${new Date().toLocaleDateString()}
**Client:** ${clientName}
**Type:** Private Note

---

${content}

---
*Saved automatically to private notes*`

    const file = bucket.file(filePath)
    await file.save(noteContent, {
      metadata: {
        contentType: 'text/markdown',
      },
    })

    console.log(`[savePrivateNote] Saved private note for ${clientName} to ${filePath}`)
    return true
  } catch (error) {
    console.error('Error saving private note to Google Cloud Storage:', error)
    return false
  }
}

// Cache for user reports to avoid repeated expensive operations
const reportCache = new Map<string, { content: string; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper function to extract search keywords from user query
function extractSearchKeywords(query: string): { clientNames: string[], dateKeywords: string[], projectKeywords: string[], shouldSearch: boolean } {
  const originalQuery = query
  const lowerQuery = query.toLowerCase()

  const clientNames: string[] = []

  // 1. Extract proper names (capitalized) from original query - most reliable
  const properNameMatches = [...originalQuery.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g)]
  properNameMatches.forEach(match => {
    if (match[1] && match[1].length > 3) {
      clientNames.push(match[1].trim())
    }
  })

  // 2. Extract names after client-related keywords (case insensitive)
  // Matches: "client Jack Vanderlans" or "for john smith" etc.
  const clientKeywordPattern = /(?:client|customer|for|about|with|discuss)\s+([a-z]+(?:\s+[a-z]+)+?)(?=\s+(?:project|in|last|this|the|and|or|\.|$))/gi
  const clientKeywordMatches = [...originalQuery.matchAll(clientKeywordPattern)]
  clientKeywordMatches.forEach(match => {
    if (match[1] && match[1].trim().length > 3) {
      // Capitalize first letter of each word for consistency
      const name = match[1].trim().split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
      if (!clientNames.includes(name)) {
        clientNames.push(name)
      }
    }
  })

  // 3. Fallback: Extract multi-word lowercase names that look like names (2-3 words)
  if (clientNames.length === 0) {
    const namePattern = /\b([a-z]{3,}\s+[a-z]{3,}(?:\s+[a-z]{3,})?)\b/g
    const nameMatches = [...lowerQuery.matchAll(namePattern)]
    nameMatches.forEach(match => {
      const name = match[1].trim()
      // Skip common stop words and generic terms
      const skipWords = ['the client', 'the customer', 'last week', 'this year', 'last year', 'tax return', 'and the']
      if (name.length > 5 && !skipWords.some(skip => name.includes(skip))) {
        const capitalizedName = name.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
        if (!clientNames.includes(capitalizedName)) {
          clientNames.push(capitalizedName)
        }
      }
    })
  }
  
  // Check for date-related keywords
  const dateKeywords = [
    '2023', '2024', '2025', 'last year', 'this year', 'last week', 'this week',
    'last month', 'this month', 'recent', 'latest', 'today', 'yesterday',
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ].filter(keyword => lowerQuery.includes(keyword))
  
  // Check for project-related keywords
  const projectKeywords = [
    'tax', 'audit', 'bookkeeping', 'planning', 'preparation', 'estimate',
    'return', 'deduction', 'expense', 'income', 'consultation', 'report'
  ].filter(keyword => lowerQuery.includes(keyword))
  
  // Explicit history reference keywords (strong signals)
  const explicitHistoryKeywords = [
    'previous', 'before', 'history', 'past', 'earlier',
    'remember', 'recall', 'last time', 'we discussed', 'we worked'
  ]
  const hasExplicitHistory = explicitHistoryKeywords.some(keyword => lowerQuery.includes(keyword))

  // Count total signals
  const signalCount =
    (clientNames.length > 0 ? 1 : 0) +
    (dateKeywords.length > 0 ? 1 : 0) +
    (projectKeywords.length > 0 ? 1 : 0) +
    (hasExplicitHistory ? 2 : 0) // Explicit history is worth 2 signals

  // Require at least 2 signals to trigger search
  // OR explicit history reference (which counts as 2)
  const shouldSearch = signalCount >= 2
  
  return { clientNames, dateKeywords, projectKeywords, shouldSearch }
}

export async function getUserReports(userId: string, query?: string, forceSearch: boolean = true, workspaceOwner?: string): Promise<string> {
  try {
    // If no query provided, return empty (no context search)
    if (!query) {
      console.log('[getUserReports] No query provided, skipping history search')
      return ''
    }

    // Analyze query to determine if we should search
    const searchAnalysis = extractSearchKeywords(query)

    // ALWAYS search when forceSearch is true (toggle is ON)
    // Otherwise, respect the signal-based shouldSearch logic
    if (!forceSearch && !searchAnalysis.shouldSearch) {
      console.log('[getUserReports] Query does not require history search, skipping')
      return ''
    }

    if (forceSearch) {
      console.log('[getUserReports] Force search enabled - searching regardless of signals')
    }
    console.log('[getUserReports] Query analysis:', searchAnalysis)

    // Use workspaceOwner for file path (where to look for files)
    const fileOwner = workspaceOwner || userId

    // Check cache first
    const cacheKey = `${fileOwner}-${JSON.stringify(searchAnalysis)}-${query}`
    const cached = reportCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[getUserReports] Returning cached results')
      return cached.content
    }

    const storage = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME

    if (!bucketName) {
      console.error('GOOGLE_CLOUD_BUCKET_NAME environment variable is not set')
      return ''
    }

    // Convert email to Google Cloud folder format: @ becomes _ and . becomes _
    const folderUserId = fileOwner.replace(/@/g, '_').replace(/\./g, '_')

    const bucket = storage.bucket(bucketName)

    console.log(`[getUserReports] Performing targeted search for user: ${folderUserId}`)

    // Search in BOTH old and new file structures for backward compatibility
    const searchPrefixes = [
      // Old structure (existing files)
      `Reports-view/${folderUserId}/`,           // Old reports location
      `Reports-view/${folderUserId}/private/`,   // Old threads location
      // New structure (new files going forward)
      `Reports-view/${folderUserId}/client-files/`  // New unified client files location
    ]

    // Get files from all locations
    const allFiles = []
    for (const prefix of searchPrefixes) {
      try {
        const [files] = await bucket.getFiles({ prefix })
        allFiles.push(...files)
        console.log(`[getUserReports] Found ${files.length} files in ${prefix}`)
      } catch (error) {
        console.error(`[getUserReports] Error searching ${prefix}:`, error)
      }
    }

    console.log(`[getUserReports] Found ${allFiles.length} total files across all locations`)
    
    // Filter files based on search criteria - FUZZY MATCHING
    const relevantFiles = allFiles.filter(file => {
      const fileName = file.name.toLowerCase()
      const filePath = file.name.toLowerCase()

      // FUZZY CLIENT NAME MATCHING
      // Match if ANY word from the client name appears in the file path
      if (searchAnalysis.clientNames.length > 0) {
        const matchesClient = searchAnalysis.clientNames.some(clientName => {
          // Split client name into individual words
          const words = clientName.toLowerCase().split(/\s+/)

          // Match if ANY word appears in the path (handles "Jacquita" matching "cline-jacquita")
          const anyWordMatches = words.some(word =>
            word.length > 2 && filePath.includes(word)
          )

          if (anyWordMatches) return true

          // Also try exact phrase match (handles "jacquita cline" → "jacquita-cline")
          const exactPhrase = clientName.toLowerCase().replace(/\s+/g, '-')
          if (filePath.includes(exactPhrase)) return true

          return false
        })
        if (matchesClient) return true
      }

      // Check if file matches date keywords
      if (searchAnalysis.dateKeywords.length > 0) {
        const matchesDate = searchAnalysis.dateKeywords.some(dateKeyword =>
          fileName.includes(dateKeyword.toLowerCase())
        )
        if (matchesDate) return true
      }

      // Check if file matches project keywords
      if (searchAnalysis.projectKeywords.length > 0) {
        const matchesProject = searchAnalysis.projectKeywords.some(projectKeyword =>
          fileName.includes(projectKeyword.toLowerCase())
        )
        if (matchesProject) return true
      }

      return false
    })
    
    // Sort by modification date (most recent first) and limit to 20 files
    const sortedFiles = relevantFiles
      .sort((a, b) => new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime())
      .slice(0, 20)
    
    console.log(`[getUserReports] Processing ${sortedFiles.length} relevant files (filtered from ${allFiles.length})`)
    
    if (sortedFiles.length === 0) {
      console.log('[getUserReports] No relevant files found for query')
      return ''
    }

    let allReportsContent = ''
    
    // Read only the relevant files
    for (const file of sortedFiles) {
      try {
        const [content] = await file.download()
        const reportContent = content.toString()
        
        // Skip very large files to avoid performance issues
        if (reportContent.length > 50000) {
          console.log(`[getUserReports] Skipping large file: ${file.name} (${reportContent.length} chars)`)
          continue
        }
        
        // Extract file name parts for context
        const fileName = file.name.split('/').pop() || 'Unknown'
        const folderPath = file.name.split('/').slice(-2, -1)[0] || 'general'
        
        // Check if this is a conversation thread file (starts with [THREAD] and contains JSON)
        if (fileName.startsWith('[THREAD]')) {
          try {
            const threadData = JSON.parse(reportContent)
            
            // Format thread content for AI context
            allReportsContent += `\n\n--- CONVERSATION THREAD: ${threadData.metadata?.title || fileName} ---\n`
            allReportsContent += `Client: ${threadData.metadata?.clientName || folderPath}\n`
            allReportsContent += `Project Type: ${threadData.metadata?.projectType || 'General'}\n`
            allReportsContent += `Status: ${threadData.metadata?.status || 'Active'}\n`
            allReportsContent += `Priority: ${threadData.metadata?.priority || 'Normal'}\n`
            allReportsContent += `Created: ${threadData.metadata?.createdAt || 'Unknown'}\n`
            allReportsContent += `Messages: ${threadData.metadata?.messageCount || 0}\n`
            allReportsContent += `Thread ID: ${threadData.threadId || 'Unknown'}\n`
            allReportsContent += `Conversation:\n`
            
            // Include the conversation messages (truncate if too long)
            if (threadData.conversation && Array.isArray(threadData.conversation)) {
              let messageCount = 0
              for (const message of threadData.conversation) {
                if (messageCount >= 10) { // Limit to last 10 messages per thread
                  allReportsContent += `\n[... ${threadData.conversation.length - messageCount} more messages ...]\n`
                  break
                }
                allReportsContent += `\n[${message.role?.toUpperCase() || 'UNKNOWN'}]: ${message.content || ''}\n`
                messageCount++
              }
            }
            
            allReportsContent += `--- END CONVERSATION THREAD ---\n`
            
            console.log(`[getUserReports] Loaded thread: ${threadData.metadata?.title || fileName} from ${folderPath}`)
          } catch (jsonError) {
            // If JSON parsing fails, treat as regular file
            allReportsContent += `\n\n--- REPORT: ${fileName} ---\n`
            allReportsContent += `Client/Category: ${folderPath}\n`
            allReportsContent += `File: ${file.name}\n`
            allReportsContent += `Content:\n${reportContent.substring(0, 5000)}${reportContent.length > 5000 ? '...[truncated]' : ''}\n`
            allReportsContent += `--- END REPORT ---\n`
            
            console.log(`[getUserReports] Loaded report: ${fileName} from ${folderPath}`)
          }
        } else {
          // Regular report file
          allReportsContent += `\n\n--- REPORT: ${fileName} ---\n`
          allReportsContent += `Client/Category: ${folderPath}\n`
          allReportsContent += `File: ${file.name}\n`
          allReportsContent += `Content:\n${reportContent.substring(0, 5000)}${reportContent.length > 5000 ? '...[truncated]' : ''}\n`
          allReportsContent += `--- END REPORT ---\n`
          
          console.log(`[getUserReports] Loaded report: ${fileName} from ${folderPath}`)
        }
      } catch (parseError) {
        console.error(`Error reading report file ${file.name}:`, parseError)
        continue
      }
    }

    const finalContent = allReportsContent.trim()
    
    // Cache the results
    reportCache.set(cacheKey, {
      content: finalContent,
      timestamp: Date.now()
    })
    
    // Clean up old cache entries
    for (const [key, value] of reportCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_DURATION) {
        reportCache.delete(key)
      }
    }
    
    console.log(`[getUserReports] Returning ${finalContent.length} characters of relevant content`)
    return finalContent
  } catch (error) {
    console.error('Error fetching user reports from Google Cloud Storage:', error)
    return ''
  }
}