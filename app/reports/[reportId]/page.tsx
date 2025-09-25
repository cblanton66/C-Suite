"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { Loader2, AlertCircle, Eye, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

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
          <div className="p-8">
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
                  Peak Suite AI
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="text-center mt-8 pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            Powered by{' '}
            <a 
              href="https://peaksuite.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              Peak Suite AI
            </a>
            {' '}• Professional Business Intelligence
          </p>
        </div>
      </div>
    </div>
  )
}