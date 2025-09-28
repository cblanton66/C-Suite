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

export async function getUserReports(userId: string): Promise<string> {
  try {
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
    
    console.log(`[getUserReports] Looking for user reports in: ${folderPrefix}`)
    console.log(`[getUserReports] Original userId: ${userId}, converted: ${folderUserId}`)
    
    // List all files in both shared and private folders
    const [sharedFiles] = await bucket.getFiles({
      prefix: folderPrefix,
    })
    
    const privatePrefix = `Reports-view/${folderUserId}/private/`
    const [privateFiles] = await bucket.getFiles({
      prefix: privatePrefix,
    })
    
    const allFiles = [...sharedFiles, ...privateFiles]
    console.log(`[getUserReports] Found ${sharedFiles.length} shared files and ${privateFiles.length} private files (${allFiles.length} total)`)

    let allReportsContent = ''
    
    // Read each report file
    for (const file of allFiles) {
      try {
        const [content] = await file.download()
        const reportContent = content.toString()
        
        // Extract file name parts for context
        const fileName = file.name.split('/').pop() || 'Unknown'
        const folderPath = file.name.split('/').slice(-2, -1)[0] || 'general'
        
        // Add report content for AI context
        allReportsContent += `\n\n--- REPORT: ${fileName} ---\n`
        allReportsContent += `Client/Category: ${folderPath}\n`
        allReportsContent += `File: ${file.name}\n`
        allReportsContent += `Content:\n${reportContent}\n`
        allReportsContent += `--- END REPORT ---\n`
        
        console.log(`[getUserReports] Loaded report: ${fileName} from ${folderPath}`)
      } catch (parseError) {
        console.error(`Error reading report file ${file.name}:`, parseError)
        continue
      }
    }

    return allReportsContent.trim()
  } catch (error) {
    console.error('Error fetching user reports from Google Cloud Storage:', error)
    return ''
  }
}