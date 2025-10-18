import { Storage } from '@google-cloud/storage'

export interface ClientMetadata {
  clientName: string
  clientSlug: string
  lastInteraction: string
  summary: string
  fileCounts: {
    projects: number
    notes: number
    reports: number
    threads: number
  }
  recentActivity: Array<{
    type: 'project' | 'note' | 'report' | 'thread'
    title: string
    date: string
    path: string
  }>
  tags: string[]
  createdAt: string
  updatedAt: string
}

let storage: Storage | null = null

const initializeStorage = () => {
  if (!storage) {
    let credentials = undefined
    if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
      try {
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

/**
 * Get or create client metadata
 */
export async function getClientMetadata(userId: string, clientSlug: string): Promise<ClientMetadata | null> {
  try {
    const storage = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME
    if (!bucketName) return null

    const folderUserId = userId.replace(/@/g, '_').replace(/\./g, '_')
    const metadataPath = `Reports-view/${folderUserId}/client-files/${clientSlug}/_metadata.json`

    const bucket = storage.bucket(bucketName)
    const file = bucket.file(metadataPath)

    const [exists] = await file.exists()
    if (!exists) return null

    const [content] = await file.download()
    return JSON.parse(content.toString())
  } catch (error) {
    console.error('[getClientMetadata] Error:', error)
    return null
  }
}

/**
 * Update client metadata after file operations
 */
export async function updateClientMetadata(
  userId: string,
  clientName: string,
  clientSlug: string,
  operation: {
    type: 'project' | 'note' | 'report' | 'thread'
    title: string
    path: string
  }
): Promise<boolean> {
  try {
    const storage = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME
    if (!bucketName) return false

    const folderUserId = userId.replace(/@/g, '_').replace(/\./g, '_')
    const metadataPath = `Reports-view/${folderUserId}/client-files/${clientSlug}/_metadata.json`

    const bucket = storage.bucket(bucketName)
    const file = bucket.file(metadataPath)

    // Get existing metadata or create new
    let metadata: ClientMetadata
    const [exists] = await file.exists()

    if (exists) {
      const [content] = await file.download()
      metadata = JSON.parse(content.toString())
    } else {
      metadata = {
        clientName,
        clientSlug,
        lastInteraction: new Date().toISOString(),
        summary: `Client workspace for ${clientName}`,
        fileCounts: { projects: 0, notes: 0, reports: 0, threads: 0 },
        recentActivity: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    // Update counts
    const typeMap = { project: 'projects', note: 'notes', report: 'reports', thread: 'threads' } as const
    const countKey = typeMap[operation.type]
    metadata.fileCounts[countKey] = (metadata.fileCounts[countKey] || 0) + 1

    // Update recent activity (keep last 10)
    metadata.recentActivity.unshift({
      type: operation.type,
      title: operation.title,
      date: new Date().toISOString(),
      path: operation.path
    })
    metadata.recentActivity = metadata.recentActivity.slice(0, 10)

    // Update timestamps
    metadata.lastInteraction = new Date().toISOString()
    metadata.updatedAt = new Date().toISOString()

    // Generate summary from recent activity
    metadata.summary = generateSummary(metadata)

    // Save metadata
    await file.save(JSON.stringify(metadata, null, 2), {
      metadata: { contentType: 'application/json' }
    })

    console.log(`[updateClientMetadata] Updated metadata for ${clientSlug}`)
    return true
  } catch (error) {
    console.error('[updateClientMetadata] Error:', error)
    return false
  }
}

/**
 * Generate a brief summary from metadata
 */
function generateSummary(metadata: ClientMetadata): string {
  const { fileCounts, recentActivity } = metadata
  const totalFiles = Object.values(fileCounts).reduce((a, b) => a + b, 0)

  if (totalFiles === 0) {
    return `Client workspace for ${metadata.clientName}`
  }

  const parts = []
  if (fileCounts.projects > 0) parts.push(`${fileCounts.projects} project${fileCounts.projects > 1 ? 's' : ''}`)
  if (fileCounts.notes > 0) parts.push(`${fileCounts.notes} note${fileCounts.notes > 1 ? 's' : ''}`)
  if (fileCounts.reports > 0) parts.push(`${fileCounts.reports} report${fileCounts.reports > 1 ? 's' : ''}`)

  const recentWork = recentActivity.length > 0
    ? `, most recent: ${recentActivity[0].title}`
    : ''

  return `${parts.join(', ')}${recentWork}`
}

/**
 * Refresh metadata by scanning actual files (for data migrations/repairs)
 */
export async function refreshClientMetadata(userId: string, clientName: string, clientSlug: string): Promise<boolean> {
  try {
    const storage = initializeStorage()
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME
    if (!bucketName) return false

    const folderUserId = userId.replace(/@/g, '_').replace(/\./g, '_')
    const clientPrefix = `Reports-view/${folderUserId}/client-files/${clientSlug}/`

    const bucket = storage.bucket(bucketName)
    const [files] = await bucket.getFiles({ prefix: clientPrefix })

    // Count files by type
    const fileCounts = { projects: 0, notes: 0, reports: 0, threads: 0 }
    const recentActivity: ClientMetadata['recentActivity'] = []

    for (const file of files) {
      if (file.name.includes('/_metadata.json')) continue

      const fileName = file.name.toLowerCase()
      let type: 'project' | 'note' | 'report' | 'thread' | null = null

      if (fileName.includes('/threads/')) { type = 'thread'; fileCounts.threads++ }
      else if (fileName.includes('/notes/')) { type = 'note'; fileCounts.notes++ }
      else if (fileName.includes('/projects/')) { type = 'project'; fileCounts.projects++ }
      else if (fileName.includes('/reports/')) { type = 'report'; fileCounts.reports++ }

      if (type && file.metadata?.updated) {
        recentActivity.push({
          type,
          title: file.name.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Untitled',
          date: file.metadata.updated,
          path: file.name
        })
      }
    }

    // Sort by date and keep most recent 10
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const topActivity = recentActivity.slice(0, 10)

    const metadata: ClientMetadata = {
      clientName,
      clientSlug,
      lastInteraction: topActivity[0]?.date || new Date().toISOString(),
      summary: '',
      fileCounts,
      recentActivity: topActivity,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    metadata.summary = generateSummary(metadata)

    // Save metadata
    const metadataPath = `Reports-view/${folderUserId}/client-files/${clientSlug}/_metadata.json`
    const metadataFile = bucket.file(metadataPath)
    await metadataFile.save(JSON.stringify(metadata, null, 2), {
      metadata: { contentType: 'application/json' }
    })

    console.log(`[refreshClientMetadata] Refreshed metadata for ${clientSlug}:`, fileCounts)
    return true
  } catch (error) {
    console.error('[refreshClientMetadata] Error:', error)
    return false
  }
}
