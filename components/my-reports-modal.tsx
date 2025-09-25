"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, FileText, Copy, CheckCheck, ExternalLink, Eye, Calendar, Search, Loader2 } from "lucide-react"

interface Report {
  reportId: string
  title: string
  createdDate: string
  viewCount: number
  shareableUrl: string
  clientName?: string
  projectType?: string
  description?: string
}

interface MyReportsModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
}

export function MyReportsModal({ isOpen, onClose, userEmail }: MyReportsModalProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [error, setError] = useState("")

  // Fetch user's reports
  const fetchReports = async () => {
    if (!userEmail) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/my-reports?userEmail=${encodeURIComponent(userEmail)}`)
      const data = await response.json()

      if (response.ok) {
        setReports(data.reports || [])
        setFilteredReports(data.reports || [])
      } else {
        setError(data.error || 'Failed to load reports')
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      setError('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  // Load reports when modal opens
  useEffect(() => {
    if (isOpen && userEmail) {
      fetchReports()
    }
  }, [isOpen, userEmail])

  // Filter reports based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReports(reports)
    } else {
      const filtered = reports.filter(report =>
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.projectType?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredReports(filtered)
    }
  }, [searchQuery, reports])

  const copyToClipboard = async (url: string, reportId: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(reportId)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const openReport = (url: string) => {
    window.open(url, '_blank')
  }

  const handleClose = () => {
    setSearchQuery("")
    setError("")
    setCopiedUrl(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden shadow-2xl border-2 border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">My Reports</h2>
              <p className="text-sm text-muted-foreground">
                {reports.length} report{reports.length !== 1 ? 's' : ''} shared
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports by title, client, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-muted-foreground">Loading reports...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-red-500 mb-2">{error}</p>
                <Button onClick={fetchReports} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No reports match your search' : 'No reports shared yet'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredReports.map((report) => (
                <Card key={report.reportId} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {report.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(report.createdDate).toLocaleDateString()}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {report.viewCount} view{report.viewCount !== 1 ? 's' : ''}
                        </div>
                        
                        {report.clientName && (
                          <span>Client: {report.clientName}</span>
                        )}
                        
                        {report.projectType && (
                          <span>Type: {report.projectType}</span>
                        )}
                      </div>
                      
                      {report.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {report.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(report.shareableUrl, report.reportId)}
                        className="h-8"
                      >
                        {copiedUrl === report.reportId ? (
                          <>
                            <CheckCheck className="w-4 h-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => openReport(report.shareableUrl)}
                        className="h-8"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredReports.length > 0 && (
          <div className="p-4 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Showing {filteredReports.length} of {reports.length} reports
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}