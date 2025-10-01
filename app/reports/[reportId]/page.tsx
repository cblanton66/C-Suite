"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { Loader2, AlertCircle, Eye, Building2, Printer, MessageCircle, Send, Upload, X, FileText, Download, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ReportData {
  reportId: string
  title: string
  content: string
  chartData?: any
  createdDate: string
  createdBy: string
  clientName?: string
  clientEmail?: string
  description?: string
  projectType?: string
  viewCount: number
  allowResponses: boolean
  recipientResponse: string
  responseDate: string
  responseEmail: string
  responseAttachments: Array<{
    fileId: string
    name: string
    originalName: string
    size: number
    type: string
    uploadedAt: string
  }>
  reportAttachments: Array<{
    fileId: string
    name: string
    originalName: string
    size: number
    type: string
    uploadedAt: string
  }>
}

export default function SharedReportPage() {
  const params = useParams()
  const reportId = params.reportId as string
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [responseEmail, setResponseEmail] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    fileId: string
    name: string
    originalName: string
    size: number
    type: string
    uploadedAt: string
  }>>([])
  const [uploading, setUploading] = useState(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [showErrorNotification, setShowErrorNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  useEffect(() => {
    if (reportId) {
      fetchReport(reportId)
    }
  }, [reportId])

  const printReport = () => {
    // Find the report content element
    const reportElement = document.querySelector('[data-report-content]')
    
    let renderedContent = ''
    
    if (reportElement) {
      // Get the beautifully rendered HTML content with all styling
      renderedContent = reportElement.innerHTML
    } else {
      // Fallback: get content from the prose element
      const proseElement = document.querySelector('.prose')
      if (proseElement) {
        renderedContent = proseElement.innerHTML
      }
    }
    
    // If we couldn't find rendered content, fall back to processing the raw text
    if (!renderedContent || renderedContent.trim() === '' || !report) {
      alert('Unable to prepare report for printing')
      return
    }

    // Create enhanced print content with perfect styling
    const printContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Print: ${report.title}</title>
        <style>
          @page {
            margin: 0.75in;
            size: letter;
          }
          
          body {
            font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 100%;
            margin: 0;
            padding: 20px 0;
            background: white;
          }
          
          .print-header {
            text-align: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .print-header h1 {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            margin: 0 0 8px 0;
          }
          
          .print-header .subtitle {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
          }
          
          .print-content {
            font-size: 11pt;
            line-height: 1.7;
          }
          
          /* Enhanced typography */
          .print-content h1, .print-content h2, .print-content h3, .print-content h4, .print-content h5, .print-content h6 {
            color: #111827;
            font-weight: bold;
            margin: 24px 0 12px 0;
            page-break-after: avoid;
          }
          
          .print-content h1 { font-size: 20pt; }
          .print-content h2 { font-size: 16pt; }
          .print-content h3 { font-size: 14pt; }
          .print-content h4 { font-size: 12pt; }
          
          .print-content p {
            margin: 12px 0;
            text-align: justify;
            orphans: 2;
            widows: 2;
          }
          
          .print-content ul, .print-content ol {
            margin: 16px 0;
            padding-left: 24px;
          }
          
          .print-content li {
            margin: 6px 0;
          }
          
          .print-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10pt;
            page-break-inside: avoid;
          }
          
          .print-content table th,
          .print-content table td {
            padding: 8px 10px;
            border: 1px solid #d1d5db;
            text-align: left;
            vertical-align: top;
          }
          
          .print-content table th {
            background-color: #f9fafb;
            font-weight: bold;
            color: #374151;
          }
          
          .print-content blockquote {
            border-left: 4px solid #e5e7eb;
            padding-left: 20px;
            margin: 20px 0;
            font-style: italic;
            color: #4b5563;
          }
          
          .print-content pre {
            background: #f3f4f6;
            padding: 16px;
            border-radius: 6px;
            font-family: ui-monospace, SFMono-Regular, 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace;
            font-size: 9pt;
            line-height: 1.5;
            overflow-wrap: break-word;
            white-space: pre-wrap;
          }
          
          .print-content code {
            background: #f3f4f6;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: ui-monospace, SFMono-Regular, 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace;
            font-size: 9pt;
          }
          
          .print-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 10pt;
            color: #6b7280;
            text-align: center;
          }
          
          /* Print-specific styles */
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .print-content { font-size: 10pt; }
            .print-content table { font-size: 9pt; }
            
            /* Avoid breaking elements across pages */
            .print-content h1,
            .print-content h2,
            .print-content h3,
            .print-content h4,
            .print-content h5,
            .print-content h6 {
              page-break-after: avoid;
            }
            
            .print-content table,
            .print-content blockquote,
            .print-content pre {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>${report.title}</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString()} • Powered by PeakSuite.ai</p>
        </div>
        
        <div class="print-content">
          ${renderedContent}
        </div>
        
        <div class="print-footer">
          <p>This report was generated by PeakSuite.ai Professional Business Intelligence</p>
          ${report.clientName ? `<p>Prepared for: ${report.clientName}</p>` : ''}
          <p>Visit peaksuite.ai for more information</p>
        </div>
      </body>
      </html>
    `

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      
      // Wait for content to load then print
      printWindow.onload = function() {
        printWindow.focus()
        printWindow.print()
        // Close the print window after printing or if user cancels
        setTimeout(() => {
          printWindow.close()
        }, 100)
      }
    } else {
      alert('Unable to open print window. Please check if pop-ups are blocked.')
    }
  }

  const fetchReport = async (id: string) => {
    try {
      const response = await fetch(`/api/reports?reportId=${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report')
      }

      setReport(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const submitResponse = async () => {
    if (!responseText.trim() || !responseEmail.trim()) {
      alert('Please fill in both your email and response message.')
      return
    }

    if (!isValidEmail(responseEmail)) {
      alert('Please enter a valid email address.')
      return
    }

    setSubmittingResponse(true)
    try {
      const response = await fetch('/api/report-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          responseText: responseText.trim(),
          responseEmail: responseEmail.trim(),
          attachments: uploadedFiles,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit response')
      }

      // Update the local report data to show the response
      if (report) {
        setReport({
          ...report,
          recipientResponse: responseText.trim(),
          responseEmail: responseEmail.trim(),
          responseDate: new Date().toISOString()
        })
      }

      setShowResponseForm(false)
      setResponseText('')
      setResponseEmail('')
      setUploadedFiles([])
      
      // Show modern success notification
      setNotificationMessage('Thank you! Your response has been submitted successfully.')
      setShowSuccessNotification(true)
      
      // Auto-hide notification after 4 seconds
      setTimeout(() => {
        setShowSuccessNotification(false)
      }, 4000)
    } catch (err) {
      console.error('Error submitting response:', err)
      
      // Show modern error notification
      setNotificationMessage(err instanceof Error ? err.message : 'Failed to submit response')
      setShowErrorNotification(true)
      
      // Auto-hide notification after 4 seconds
      setTimeout(() => {
        setShowErrorNotification(false)
      }, 4000)
    } finally {
      setSubmittingResponse(false)
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Validate file sizes (10MB max each)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const invalidFiles = Array.from(files).filter(file => file.size > maxSize)
    
    if (invalidFiles.length > 0) {
      alert(`The following files exceed the 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}`)
      return
    }

    setUploading(true)
    const uploadedFilesList: typeof uploadedFiles = []
    
    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('reportId', reportId)

        const response = await fetch('/api/upload-response-file', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`)
        }

        uploadedFilesList.push(data.file)
      }

      setUploadedFiles(prev => [...prev, ...uploadedFilesList])
      
      // Show modern success notification
      setNotificationMessage(`Successfully uploaded ${uploadedFilesList.length} file${uploadedFilesList.length > 1 ? 's' : ''}!`)
      setShowSuccessNotification(true)
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setShowSuccessNotification(false)
      }, 3000)
    } catch (err) {
      console.error('Error uploading files:', err)
      
      // Show modern error notification
      setNotificationMessage(err instanceof Error ? err.message : 'Failed to upload files')
      setShowErrorNotification(true)
      
      // Auto-hide notification after 4 seconds
      setTimeout(() => {
        setShowErrorNotification(false)
      }, 4000)
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.fileId !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Report Not Available</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <p className="text-sm text-muted-foreground">
                This report may have expired, been deactivated, or the link may be incorrect.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Report Not Found</h3>
              <p className="text-muted-foreground">
                The requested report could not be found.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {/* Title */}
              <a 
                href="https://peaksuite.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <h1 className="text-xl font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">
                  {report.title}
                </h1>
              </a>
              {report.description && (
                <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {report.clientName && (
                <span>For: {report.clientName}</span>
              )}
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{report.viewCount} view{report.viewCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-8" data-report-content>
            <MarkdownRenderer 
              content={report.content} 
              className="prose-lg max-w-none"
            />
          </div>
          
          {/* Footer */}
          <div className="border-t px-8 py-6 bg-muted/30">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-6">
                <span>Created: {new Date(report.createdDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Prepared by:</span>
                <a
                  href="https://peaksuite.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  PeakSuite.ai
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Report Attachments Section */}
        {report.reportAttachments && report.reportAttachments.length > 0 && (
          <div className="mt-8 bg-card rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Downloadable Files
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                The following files have been included with this report for your review and signature:
              </p>
              
              <div className="space-y-3">
                {report.reportAttachments.map((file) => (
                  <div
                    key={file.fileId}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">
                          {file.originalName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const downloadUrl = `/api/report-files/${file.fileId}?reportId=${reportId}`
                        window.open(downloadUrl, '_blank')
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  💡 <strong>Tip:</strong> Please download, review, and sign any required documents. 
                  You can upload the signed files back using the response section below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Response Section - only show if responses are allowed */}
        {report.allowResponses && (
          <div className="mt-8 pt-6 border-t">
            {report.recipientResponse ? (
              // Show existing response
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                    Response Submitted
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">From:</p>
                    <p className="text-green-800 dark:text-green-300">{report.responseEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Response:</p>
                    <p className="text-green-800 dark:text-green-300 whitespace-pre-wrap">{report.recipientResponse}</p>
                  </div>
                  
                  {/* Show attached files if any */}
                  {report.responseAttachments && report.responseAttachments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                        Attached Files:
                      </p>
                      <div className="space-y-2">
                        {report.responseAttachments.map((file) => (
                          <div
                            key={file.fileId}
                            className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-950/50 rounded-lg border border-green-300 dark:border-green-700"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                  {file.originalName}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const downloadUrl = `/api/response-files/${file.fileId}?reportId=${reportId}`
                                window.open(downloadUrl, '_blank')
                              }}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-200"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Submitted: {new Date(report.responseDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : showResponseForm ? (
              // Show response form
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                    Respond to this Report
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                      Your Email
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={responseEmail}
                      onChange={(e) => setResponseEmail(e.target.value)}
                      disabled={submittingResponse}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                      Your Response
                    </label>
                    <textarea
                      placeholder="Share your thoughts, questions, or feedback about this report..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      disabled={submittingResponse}
                      className="w-full min-h-[120px] px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    />
                  </div>

                  {/* File Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                      Attach Files (Optional)
                    </label>
                    
                    {/* File Upload Input */}
                    <div className="mb-3">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        onChange={handleFileUpload}
                        disabled={submittingResponse || uploading}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls,.docx,.doc,.txt,.csv"
                      />
                      <label
                        htmlFor="file-upload"
                        className={`flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          submittingResponse || uploading
                            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                            : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-700 dark:hover:border-blue-600 dark:hover:bg-blue-950/30'
                        }`}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            <span className="text-blue-700 dark:text-blue-400">Uploading files...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-blue-600" />
                            <span className="text-blue-700 dark:text-blue-400">
                              Click to upload files (PDF, images, Office docs - max 10MB each)
                            </span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.fileId}
                            className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                  {file.originalName}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.fileId)}
                              disabled={submittingResponse}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowResponseForm(false)}
                      disabled={submittingResponse}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={submitResponse}
                      disabled={submittingResponse || !responseText.trim() || !responseEmail.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {submittingResponse ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Response
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Show response button
              <div className="text-center">
                <Button
                  onClick={() => setShowResponseForm(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Respond to Report
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Share your thoughts or feedback with the report author
                </p>
              </div>
            )}
          </div>
        )}

        {/* Branding */}
        <div className="text-center mt-8 pt-6 border-t">
          <div className="flex items-center justify-center mb-3">
            <Button
              onClick={printReport}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by{' '}
            <a 
              href="https://peaksuite.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              PeakSuite.ai
            </a>
            {' '}• Professional Business Intelligence
          </p>
        </div>
      </div>

      {/* Modern Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-2 duration-300">
          <div className="bg-green-50 dark:bg-green-950/90 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Success!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {notificationMessage}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuccessNotification(false)}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Error Notification */}
      {showErrorNotification && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-2 duration-300">
          <div className="bg-red-50 dark:bg-red-950/90 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {notificationMessage}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowErrorNotification(false)}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}