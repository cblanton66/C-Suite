"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { Loader2, AlertCircle, Eye, Building2, Printer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
}

export default function SharedReportPage() {
  const params = useParams()
  const reportId = params.reportId as string
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
            <div className="flex items-center gap-3">
              {/* Logo */}
              <a 
                href="https://peaksuite.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">PeakSuite.ai</span>
              </a>
              
              {/* Title */}
              <div>
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
                {report.projectType && <span>Type: {report.projectType}</span>}
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

        {/* Branding */}
        <div className="text-center mt-8 pt-6 border-t">
          <div className="flex items-center justify-center mb-3">
            <Button
              onClick={printReport}
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
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
    </div>
  )
}