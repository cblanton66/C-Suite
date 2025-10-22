import { Storage } from '@google-cloud/storage'
import { updateClientMetadata, getClientMetadata } from './client-metadata'

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
    // NEW STRUCTURE: Use client-files/{client}/notes/ instead of private/{client}/
    const filePath = `Reports-view/${folderUserId}/client-files/${clientFolder}/notes/${fileName}`
    
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

    // Update client metadata (don't block on this)
    updateClientMetadata(userId, clientName, clientFolder, {
      type: 'note',
      title: title || `Private Note - ${clientName}`,
      path: filePath
    }).catch(err => console.error('[savePrivateNote] Metadata update failed:', err))

    return true
  } catch (error) {
    console.error('Error saving private note to Google Cloud Storage:', error)
    return false
  }
}

// Cache for user reports to avoid repeated expensive operations
const reportCache = new Map<string, { content: string; timestamp: number; clientName?: string }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes - longer duration for conversation continuity

// Track last searched client per user for conversation continuity
const lastSearchedClient = new Map<string, { clientName: string; timestamp: number }>()

// Function to clear cache for a specific user (called when starting new conversation)
export function clearUserCache(userId: string) {
  // Clear all cache entries for this user
  for (const [key] of reportCache.entries()) {
    if (key.startsWith(userId)) {
      reportCache.delete(key)
    }
  }

  // Clear last searched client for this user
  lastSearchedClient.delete(userId)

  console.log(`[clearUserCache] Cleared all cache for user: ${userId}`)
}

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

// Helper function to find all matching clients based on partial name
export async function findMatchingClients(userId: string, partialName: string): Promise<string[]> {
  try {
    const storage = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME

    if (!bucketName) {
      console.error('GOOGLE_CLOUD_BUCKET_NAME environment variable is not set')
      return []
    }

    const folderUserId = userId.replace(/@/g, '_').replace(/\./g, '_')
    const bucket = storage.bucket(bucketName)

    // Search both active and archived client folders
    const searchPrefixes = [
      `Reports-view/${folderUserId}/client-files/`,
      `Reports-view/${folderUserId}/archive/`
    ]

    const matchingClients = new Set<string>()
    const searchTermLower = partialName.toLowerCase()

    for (const prefix of searchPrefixes) {
      try {
        const [files] = await bucket.getFiles({ prefix, delimiter: '/' })

        // Get unique client folder names
        const options = { prefix, delimiter: '/' }
        const [, , apiResponse] = await bucket.getFiles(options)

        if (apiResponse?.prefixes) {
          apiResponse.prefixes.forEach((clientPrefix: string) => {
            const clientSlug = clientPrefix.replace(prefix, '').replace(/\/$/, '')

            // Check if partial name matches any part of the client slug
            if (clientSlug.includes(searchTermLower) || searchTermLower.split(/\s+/).some(word => clientSlug.includes(word))) {
              // Convert slug back to readable name (capitalize words, replace dashes with spaces)
              const readableName = clientSlug
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
              matchingClients.add(readableName)
            }
          })
        }
      } catch (error) {
        console.error(`Error searching for clients in ${prefix}:`, error)
      }
    }

    return Array.from(matchingClients).sort()
  } catch (error) {
    console.error('Error finding matching clients:', error)
    return []
  }
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

    // If forceSearch is ON but no client detected, use last searched client for continuity
    if (forceSearch && searchAnalysis.clientNames.length === 0) {
      const lastClient = lastSearchedClient.get(fileOwner)
      if (lastClient && Date.now() - lastClient.timestamp < CACHE_DURATION) {
        console.log(`[getUserReports] No client in query, using last searched client: ${lastClient.clientName}`)
        searchAnalysis.clientNames.push(lastClient.clientName)
      }
    }

    // IMPROVED CACHING: Cache by client name instead of full query
    const clientCacheKey = searchAnalysis.clientNames.length > 0
      ? `${fileOwner}-client-${searchAnalysis.clientNames[0]}`
      : `${fileOwner}-general`

    const cached = reportCache.get(clientCacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[getUserReports] Returning cached results for client:', clientCacheKey)
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

    // OPTIMIZATION: If client name is specified, try to use metadata first
    let metadataContent = ''
    if (searchAnalysis.clientNames.length > 0) {
      for (const clientName of searchAnalysis.clientNames) {
        const clientSlug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
        const metadata = await getClientMetadata(fileOwner, clientSlug)

        if (metadata) {
          console.log(`[getUserReports] Found metadata for ${clientName}:`, {
            files: metadata.fileCounts,
            lastInteraction: metadata.lastInteraction
          })

          metadataContent += `\n\n--- CLIENT: ${metadata.clientName} ---\n`
          metadataContent += `Summary: ${metadata.summary}\n`
          metadataContent += `Files: ${metadata.fileCounts.projects} projects, ${metadata.fileCounts.notes} notes, ${metadata.fileCounts.reports} reports\n`
          metadataContent += `Last Interaction: ${new Date(metadata.lastInteraction).toLocaleDateString()}\n`

          if (metadata.recentActivity.length > 0) {
            metadataContent += `\nRecent Activity:\n`
            metadata.recentActivity.slice(0, 5).forEach(activity => {
              metadataContent += `- ${activity.type.toUpperCase()}: ${activity.title} (${new Date(activity.date).toLocaleDateString()})\n`
            })
          }
          metadataContent += `--- END CLIENT METADATA ---\n`
        }
      }
    }

    // Search in new file structure INCLUDING archive folder
    const searchPrefixes = [
      `Reports-view/${folderUserId}/client-files/`,  // Active client files
      `Reports-view/${folderUserId}/archive/`        // Archived client files
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

    // Sort by modification date (most recent first) - search ALL files for the client
    const sortedFiles = relevantFiles
      .sort((a, b) => new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime())
    
    console.log(`[getUserReports] Processing ${sortedFiles.length} relevant files (filtered from ${allFiles.length})`)

    if (sortedFiles.length === 0) {
      console.log('[getUserReports] No relevant files found for query')

      // Smart client matching - suggest similar clients if search came up empty
      if (searchAnalysis.clientNames.length > 0) {
        const partialName = searchAnalysis.clientNames[0]
        const matches = await findMatchingClients(fileOwner, partialName)

        if (matches.length > 0) {
          console.log(`[getUserReports] Found ${matches.length} potential client matches for "${partialName}":`, matches)
          return `\n\n--- CLIENT NAME SUGGESTIONS ---\nYou searched for "${partialName}" but no exact match was found.\n\nDid you mean one of these clients?\n${matches.map((name, i) => `${i + 1}. ${name}`).join('\n')}\n\nPlease specify the exact client name to search their history.\n--- END SUGGESTIONS ---\n`
        }
      }

      return ''
    }

    let allReportsContent = ''
    
    // Read only the relevant files
    for (const file of sortedFiles) {
      try {
        const [content] = await file.download()
        const reportContent = content.toString()

        // Allow larger files for comprehensive client search
        if (reportContent.length > 200000) {
          console.log(`[getUserReports] Skipping very large file: ${file.name} (${reportContent.length} chars)`)
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
            allReportsContent += `Content:\n${reportContent.substring(0, 15000)}${reportContent.length > 15000 ? '...[truncated]' : ''}\n`
            allReportsContent += `--- END REPORT ---\n`
            
            console.log(`[getUserReports] Loaded report: ${fileName} from ${folderPath}`)
          }
        } else {
          // Regular report file
          allReportsContent += `\n\n--- REPORT: ${fileName} ---\n`
          allReportsContent += `Client/Category: ${folderPath}\n`
          allReportsContent += `File: ${file.name}\n`
          allReportsContent += `Content:\n${reportContent.substring(0, 15000)}${reportContent.length > 15000 ? '...[truncated]' : ''}\n`
          allReportsContent += `--- END REPORT ---\n`
          
          console.log(`[getUserReports] Loaded report: ${fileName} from ${folderPath}`)
        }
      } catch (parseError) {
        console.error(`Error reading report file ${file.name}:`, parseError)
        continue
      }
    }

    // Prepend metadata content (if any) before file content
    const finalContent = (metadataContent + allReportsContent).trim()

    // Cache the results with improved cache key
    reportCache.set(clientCacheKey, {
      content: finalContent,
      timestamp: Date.now(),
      clientName: searchAnalysis.clientNames[0]
    })

    // Track last searched client for conversation continuity
    if (searchAnalysis.clientNames.length > 0) {
      lastSearchedClient.set(fileOwner, {
        clientName: searchAnalysis.clientNames[0],
        timestamp: Date.now()
      })
      console.log(`[getUserReports] Tracking last searched client: ${searchAnalysis.clientNames[0]}`)
    }

    // Clean up old cache entries
    for (const [key, value] of reportCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_DURATION) {
        reportCache.delete(key)
      }
    }

    // Clean up old last-searched tracking
    for (const [key, value] of lastSearchedClient.entries()) {
      if (Date.now() - value.timestamp > CACHE_DURATION) {
        lastSearchedClient.delete(key)
      }
    }
    
    console.log(`[getUserReports] Returning ${finalContent.length} characters of relevant content`)
    return finalContent
  } catch (error) {
    console.error('Error fetching user reports from Google Cloud Storage:', error)
    return ''
  }
}