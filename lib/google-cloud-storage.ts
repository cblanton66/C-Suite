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
  
  // Check if query contains specific client-related terms or names (improved patterns)
  const clientPatterns = [
    /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g, // "John Smith" pattern (case sensitive for proper names)
    /\b([a-z]+ [a-z]+)\b/g, // "betty green" pattern (lowercase names)
    /\b([a-z]{3,})\b(?=\s*(client|customer|taxpayer|business|company|llc|inc|corp))/g, // Names before business terms
    /(?:for|about|client|customer)\s+([a-z]+ ?[a-z]*)/g, // "for john smith" pattern
    /(?:with|discuss|work)\s+([a-z]+ ?[a-z]*)/g // "discuss with betty" pattern
  ]
  
  const clientNames: string[] = []
  
  // Use original query for proper name detection
  const properNameMatches = [...originalQuery.matchAll(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g)]
  properNameMatches.forEach(match => {
    if (match[1] && match[1].length > 3) {
      clientNames.push(match[1].trim())
    }
  })
  
  // Use lowercase query for other patterns
  const otherPatterns = [
    /\b([a-z]+ [a-z]+)\b/g,
    /\b([a-z]{3,})\b(?=\s*(client|customer|taxpayer|business|company|llc|inc|corp))/g,
    /(?:for|about|client|customer|with|discuss)\s+([a-z]+ ?[a-z]*)/g
  ]
  
  otherPatterns.forEach(pattern => {
    const matches = [...lowerQuery.matchAll(pattern)]
    matches.forEach(match => {
      if (match[1] && match[1].length > 2 && !match[1].includes('the') && !match[1].includes('and') && !match[1].includes('tax')) {
        clientNames.push(match[1].trim())
      }
    })
  })
  
  // Check for date-related keywords
  const dateKeywords = [
    '2023', '2024', '2025', 'last year', 'this year', 'recent', 'latest', 
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ].filter(keyword => lowerQuery.includes(keyword))
  
  // Check for project-related keywords
  const projectKeywords = [
    'tax', 'audit', 'bookkeeping', 'planning', 'preparation', 'estimate',
    'return', 'deduction', 'expense', 'income', 'consultation', 'report'
  ].filter(keyword => lowerQuery.includes(keyword))
  
  // More liberal search criteria
  const shouldSearch = (
    clientNames.length > 0 || 
    dateKeywords.length > 0 || 
    projectKeywords.length > 0 || // Just 1 project keyword now
    lowerQuery.includes('previous') ||
    lowerQuery.includes('before') ||
    lowerQuery.includes('history') ||
    lowerQuery.includes('past') ||
    lowerQuery.includes('earlier') ||
    lowerQuery.includes('remember') ||
    lowerQuery.includes('recall') ||
    lowerQuery.includes('work') ||
    lowerQuery.includes('discuss') ||
    lowerQuery.includes('client') ||
    lowerQuery.includes('show me') ||
    lowerQuery.includes('tell me about') ||
    lowerQuery.includes('what about') ||
    lowerQuery.includes('find')
  )
  
  return { clientNames, dateKeywords, projectKeywords, shouldSearch }
}

export async function getUserReports(userId: string, query?: string): Promise<string> {
  try {
    // If no query provided, return empty (no context search)
    if (!query) {
      console.log('[getUserReports] No query provided, skipping history search')
      return ''
    }
    
    // Analyze query to determine if we should search
    const searchAnalysis = extractSearchKeywords(query)
    
    if (!searchAnalysis.shouldSearch) {
      console.log('[getUserReports] Query does not require history search, skipping')
      return ''
    }
    
    console.log('[getUserReports] Query analysis:', searchAnalysis)
    
    // Check cache first
    const cacheKey = `${userId}-${JSON.stringify(searchAnalysis)}-${query}`
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
    const folderUserId = userId.replace(/@/g, '_').replace(/\./g, '_')
    
    const bucket = storage.bucket(bucketName)
    const folderPrefix = `Reports-view/${folderUserId}/`
    
    console.log(`[getUserReports] Performing targeted search in: ${folderPrefix}`)
    
    // Get file list first (lightweight operation)
    const [sharedFiles] = await bucket.getFiles({
      prefix: folderPrefix,
    })
    
    const privatePrefix = `Reports-view/${folderUserId}/private/`
    const [privateFiles] = await bucket.getFiles({
      prefix: privatePrefix,
    })
    
    const allFiles = [...sharedFiles, ...privateFiles]
    console.log(`[getUserReports] Found ${allFiles.length} total files`)
    
    // Filter files based on search criteria
    const relevantFiles = allFiles.filter(file => {
      const fileName = file.name.toLowerCase()
      const filePath = file.name.toLowerCase()
      
      // Check if file matches client names
      if (searchAnalysis.clientNames.length > 0) {
        const matchesClient = searchAnalysis.clientNames.some(clientName => 
          filePath.includes(clientName.toLowerCase().replace(/\s+/g, '-'))
        )
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