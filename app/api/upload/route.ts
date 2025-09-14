import { NextRequest, NextResponse } from "next/server"
import * as XLSX from 'xlsx'

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

    try {
      // Process different file types
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        // For text and CSV files, read as text
        content = await file.text()
      } else if (file.type === 'application/pdf') {
        // For now, provide detailed PDF metadata and instructions for the AI
        const arrayBuffer = await file.arrayBuffer()
        const fileSize = (file.size / 1024).toFixed(1)
        
        content = `[PDF Document: ${file.name}]

File Details:
- Size: ${fileSize} KB
- Type: ${file.type}
- Pages: Cannot determine exact count without parsing

This PDF document has been uploaded successfully. While I cannot extract the exact text content at the moment due to parsing limitations, I can help you analyze this document in several ways:

1. **Financial Analysis**: If this contains financial data (income statements, balance sheets, tax documents), I can help interpret common financial patterns and calculations.

2. **Document Structure Guidance**: I can provide guidance on how to organize or interpret the type of document this appears to be.

3. **Specific Questions**: Ask me specific questions about what you're looking for in this document, and I'll provide targeted analysis and guidance.

4. **Data Extraction Help**: If you can tell me key numbers or sections you see, I can help analyze and organize them.

What specific information are you looking to extract or analyze from this PDF? For example:
- Financial calculations or ratios?
- Tax planning insights?
- Data organization into tables?
- Compliance or regulatory analysis?

Please describe what you see in the document or what analysis you need, and I'll provide comprehensive assistance.`
      } else if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
        // Parse Excel files
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        
        let excelContent = `[Excel Document: ${file.name}]\n\nWorksheet Data:\n\n`
        workbook.SheetNames.forEach((sheetName, index) => {
          const sheet = workbook.Sheets[sheetName]
          const csvData = XLSX.utils.sheet_to_csv(sheet)
          excelContent += `=== Sheet ${index + 1}: ${sheetName} ===\n${csvData}\n\n`
        })
        content = excelContent
      } else if (file.type.includes('word') || file.type.includes('document')) {
        // Parse Word documents using dynamic import
        const mammoth = await import('mammoth')
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        content = `[Word Document: ${file.name}]\n\nDocument Content:\n${result.value}`
      } else {
        // Fallback for unsupported file types
        content = `[${file.name}]\n\nDocument uploaded successfully (${file.type}, ${(file.size / 1024).toFixed(1)} KB).\n\nThis file type requires manual analysis. Please describe what information you're looking for or what analysis you need.`
      }
    } catch (parseError) {
      console.error(`Error parsing ${file.type} file:`, parseError)
      content = `[${file.name}]\n\nDocument uploaded but could not be parsed automatically (${file.type}, ${(file.size / 1024).toFixed(1)} KB).\n\nError: ${parseError.message}\n\nPlease describe what information you're looking for and I'll help analyze the document based on its type and your specific questions.`
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