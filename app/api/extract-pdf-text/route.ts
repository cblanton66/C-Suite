import { NextRequest, NextResponse } from 'next/server'
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'

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
    
    // Note: Google Cloud Document AI has a 30-page limit
    // We can't easily check page count before processing, so we'll handle it in the error response

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Simple PDF parser temporarily disabled due to library debug mode bug
    // TODO: Re-enable when pdf-parse library issue is resolved
    console.log('Skipping simple PDF parser, using Google Cloud Document AI...')

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
    // Document OCR processor for general PDF text extraction
    const processorId = 'bf02bcc94035f695'
    
    // Correct processor name format (without :process)
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`

    // Log for debugging
    console.log('Processor name:', name)
    console.log('File size:', buffer.length)

    // Prepare the request for Document OCR processor
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
      code: error.code,
      details: error.details,
      statusDetails: error.statusDetails
    })
    
    // Log field violations if available
    if (error.statusDetails && error.statusDetails.length > 0) {
      console.error('Field violations:', JSON.stringify(error.statusDetails, null, 2))
    }
    
    // More specific error messages
    let errorMessage = 'PDF extraction failed'
    if (error.code === 3) {
      // Check if it's a page limit error
      if (error.message && error.message.includes('pages exceed the limit')) {
        errorMessage = 'PDF has too many pages. Google Cloud Document AI supports up to 30 pages per document. Please split your PDF into smaller files or try a shorter document.'
      } else {
        errorMessage = 'Invalid request format or processor configuration'
      }
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