import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

interface TrainingFile {
  fileName: string
  title: string
  description: string
  url: string
  uploadedAt: string
}

interface CategoryFiles {
  [category: string]: TrainingFile[]
}

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_CREDENTIALS) {
      return NextResponse.json({ error: 'Google Cloud configuration missing' }, { status: 500 })
    }

    // Decode the base64 credentials
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
    
    // Initialize Google Cloud Storage
    const storage = new Storage({
      credentials,
      projectId: credentials.project_id,
    })

    const bucket = storage.bucket('peaksuite-files')

    // Define category mappings
    const categoryMappings = {
      'tax': 'conversations-tax',
      'business': 'conversations-business', 
      'retirement': 'conversations-retirement',
      'accounting': 'conversations-accounting'
    }

    const categorizedFiles: CategoryFiles = {
      tax: [],
      business: [],
      retirement: [],
      accounting: []
    }

    // Get files from each category folder
    for (const [category, folderName] of Object.entries(categoryMappings)) {
      try {
        const [files] = await bucket.getFiles({
          prefix: `training-room/${folderName}/`,
          delimiter: '/'
        })

        // Filter for PDF files only and exclude folder entries
        const pdfFiles = files.filter(file => 
          file.name.endsWith('.pdf') && 
          file.name !== `training-room/${folderName}/`
        )

        for (const file of pdfFiles) {
          const [metadata] = await file.getMetadata()
          
          // Generate a signed URL that expires in 24 hours for secure access
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          })
          
          // Extract title from filename (remove path and .pdf extension)
          const fileName = file.name.split('/').pop() || ''
          const title = fileName
            .replace('.pdf', '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())

          categorizedFiles[category as keyof CategoryFiles].push({
            fileName: file.name,
            title,
            description: `${category.charAt(0).toUpperCase() + category.slice(1)} conversation: ${title}`,
            url: signedUrl,
            uploadedAt: metadata.timeCreated || new Date().toISOString()
          })
        }

        // Sort by upload date (newest first)
        categorizedFiles[category as keyof CategoryFiles].sort((a, b) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )

      } catch (categoryError) {
        console.error(`Error fetching files for category ${category}:`, categoryError)
        // Continue with other categories even if one fails
      }
    }

    return NextResponse.json({ 
      success: true,
      categories: categorizedFiles
    })

  } catch (error) {
    console.error('Training room files listing error:', error)
    return NextResponse.json({ error: 'Failed to list training room files' }, { status: 500 })
  }
}