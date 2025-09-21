import { NextRequest, NextResponse } from 'next/server'
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'
const pdf = require('pdf-parse')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Try simple PDF parsing first as fallback
    try {
      console.log('Attempting simple PDF text extraction...')
      const data = await pdf(buffer)
      
      if (data.text && data.text.trim().length > 10) {
        const cleanedText = data.text
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n\n')
          .trim()
        
        return NextResponse.json({ 
          success: true, 
          text: cleanedText,
          fileName: file.name,
          pageCount: data.numpages || 1,
          method: 'simple-parser'
        })
      }
    } catch (simpleError) {
      console.log('Simple PDF parsing failed, trying Google Cloud Document AI...', simpleError.message)
    }

    // Check for required environment variables
    if (!process.env.GOOGLE_CREDENTIALS) {
      return NextResponse.json({ error: 'Google Cloud credentials not configured' }, { status: 500 })
    }

    // Initialize Document AI client
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
    const client = new DocumentProcessorServiceClient({
      credentials,
      projectId: credentials.project_id
    })

    // Document AI processor configuration
    const projectId = credentials.project_id
    const location = 'us'
    // Replace this with your new processor ID from Step 2
    const processorId = '95ce97589fd703d0' // TODO: Update with your actual processor ID
    
    // Correct processor name format (without :process)
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`

    // Log for debugging
    console.log('Processor name:', name)
    console.log('File size:', buffer.length)

    // Prepare the request according to the API specification
    // Try with base64 encoding again but ensure it's properly formatted
    const documentRequest = {
      name: name,
      rawDocument: {
        content: buffer.toString('base64'),
        mimeType: 'application/pdf'
      }
    }

    console.log('Request structure:', {
      name: documentRequest.name,
      rawDocument: {
        mimeType: documentRequest.rawDocument.mimeType,
        contentLength: documentRequest.rawDocument.content.length
      }
    })

    // Process the document
    const [result] = await client.processDocument(documentRequest)

    // Extract text from the result
    const extractedText = result.document?.text || ''
    
    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json({ 
        error: 'No readable text found in PDF. The file might be image-based, encrypted, or empty.' 
      }, { status: 400 })
    }

    // Clean up the extracted text
    const cleanedText = extractedText
      .replace(/\s+/g, ' ') // Clean up multiple spaces
      .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
      .trim()

    return NextResponse.json({ 
      success: true, 
      text: cleanedText,
      fileName: file.name,
      pageCount: result.document?.pages?.length || 1,
      method: 'google-document-ai'
    })
    
  } catch (error) {
    console.error('PDF extraction error:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
      statusDetails: error.statusDetails
    })
    
    // More specific error messages
    let errorMessage = 'PDF extraction failed'
    if (error.code === 3) {
      errorMessage = 'Invalid request format or processor configuration'
    } else if (error.code === 7) {
      errorMessage = 'Permission denied - check Google Cloud credentials'
    } else if (error.code === 5) {
      errorMessage = 'Processor not found - check processor ID and location'
    }
    
    return NextResponse.json({ 
      error: `${errorMessage}: ${error.message}`,
      details: error.toString(),
      code: error.code
    }, { status: 500 })
  }
}