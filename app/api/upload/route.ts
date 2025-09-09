import { NextRequest, NextResponse } from "next/server"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Unsupported file type. Please upload PDF, Excel, CSV, Word, or text files.' 
      }, { status: 400 })
    }

    let content = ''

    // Process different file types
    if (file.type === 'text/plain' || file.type === 'text/csv') {
      // For text and CSV files, read as text
      content = await file.text()
    } else if (file.type === 'application/pdf') {
      // For PDF files, we'll need to implement PDF parsing
      // For now, return a placeholder that indicates PDF processing is needed
      content = `[PDF Document: ${file.name}]\nThis is a PDF document that requires processing. The AI will analyze the document structure and content.`
    } else if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
      // For Excel files, we'll need to implement Excel parsing
      // For now, return a placeholder
      content = `[Excel Document: ${file.name}]\nThis is an Excel spreadsheet that contains financial data. The AI will analyze the data structure, formulas, and values.`
    } else if (file.type.includes('word') || file.type.includes('document')) {
      // For Word documents, we'll need to implement Word parsing
      // For now, return a placeholder
      content = `[Word Document: ${file.name}]\nThis is a Word document that requires processing. The AI will analyze the document content and structure.`
    }

    // Log file upload for debugging
    console.log(`File uploaded: ${file.name}, type: ${file.type}, size: ${file.size}`)

    return NextResponse.json({
      success: true,
      filename: file.name,
      size: file.size,
      type: file.type,
      content: content
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to process file upload' }, { status: 500 })
  }
}