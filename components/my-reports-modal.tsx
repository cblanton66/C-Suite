"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, FileText, Copy, CheckCheck, ExternalLink, Eye, Calendar, Search, Loader2, Edit, Archive, Bell, MessageCircle, Paperclip, AlertTriangle } from "lucide-react"

interface Report {
  reportId: string
  title: string
  createdDate: string
  viewCount: number
  shareableUrl: string
  clientName?: string
  projectType?: string
  description?: string
  expiresAt?: string
  // Response notification fields
  hasResponse?: boolean
  responseDate?: string | null
  responseEmail?: string | null
  hasAttachments?: boolean
  attachmentCount?: number
  allowResponses?: boolean
}

interface MyReportsModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
  onEditContent?: (reportContent: string, reportTitle: string) => void
}

export function MyReportsModal({ isOpen, onClose, userEmail, onEditContent }: MyReportsModalProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

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

  const deleteReport = async (reportId: string) => {
    setIsDeleting(reportId)
    try {
      const response = await fetch(`/api/my-reports`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId, userEmail }),
      })

      if (response.ok) {
        // Remove from local state
        setReports(prev => prev.filter(r => r.reportId !== reportId))
        setFilteredReports(prev => prev.filter(r => r.reportId !== reportId))
        setDeleteConfirm(null)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete report')
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      setError('Failed to delete report')
    } finally {
      setIsDeleting(null)
    }
  }

  const updateReport = async () => {
    if (!editingReport) return

    try {
      const response = await fetch(`/api/my-reports`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: editingReport.reportId,
          title: editingReport.title,
          description: editingReport.description,
          expiresAt: editingReport.expiresAt || null,
          userEmail
        }),
      })

      if (response.ok) {
        // Update local state
        setReports(prev => prev.map(r =>
          r.reportId === editingReport.reportId
            ? { ...r, title: editingReport.title, description: editingReport.description, expiresAt: editingReport.expiresAt }
            : r
        ))
        setFilteredReports(prev => prev.map(r =>
          r.reportId === editingReport.reportId
            ? { ...r, title: editingReport.title, description: editingReport.description, expiresAt: editingReport.expiresAt }
            : r
        ))
        setEditingReport(null)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update report')
      }
    } catch (error) {
      console.error('Error updating report:', error)
      setError('Failed to update report')
    }
  }

  const editReportContent = async (report: Report) => {
    if (!onEditContent) return
    
    try {
      // Extract the report ID from the shareable URL to fetch content
      const reportId = report.shareableUrl.split('/').pop()
      const response = await fetch(`/api/reports?reportId=${reportId}`)
      const data = await response.json()
      
      if (response.ok && data.report?.content) {
        // Close this modal and trigger content edit
        onClose()
        onEditContent(data.report.content, report.title)
      } else {
        setError('Unable to load report content for editing')
      }
    } catch (error) {
      console.error('Error loading report content:', error)
      setError('Failed to load report content')
    }
  }

  const handleClose = () => {
    setSearchQuery("")
    setError("")
    setCopiedUrl(null)
    setEditingReport(null)
    setDeleteConfirm(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal - slides up from bottom on mobile */}
      <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg w-full sm:max-w-4xl overflow-hidden flex flex-col" style={{ maxHeight: 'min(90vh, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 20px))' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-2 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Client Comms</h2>
              <p className="text-sm text-muted-foreground">
                {reports.length} report{reports.length !== 1 ? 's' : ''} shared
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 sm:p-4 border-b shrink-0">
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
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
                <Card
                  key={report.reportId}
                  className={`p-4 transition-colors ${
                    report.hasResponse
                      ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800 hover:bg-green-100/50 dark:hover:bg-green-950/30'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {report.clientName || 'No Client'}
                        </h3>
                        {/* Notification badges */}
                        {report.hasResponse && (
                          <div className="flex items-center gap-1">
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                              <MessageCircle className="w-3 h-3" />
                              Response
                            </div>
                            {report.hasAttachments && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                <Paperclip className="w-3 h-3" />
                                {report.attachmentCount} file{report.attachmentCount !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-foreground mt-1">
                        {report.title}
                      </p>

                      {report.description && (
                        <p className="text-sm text-foreground mt-1 truncate">
                          {report.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(report.createdDate).toLocaleDateString()}
                        </div>

                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {report.viewCount} view{report.viewCount !== 1 ? 's' : ''}
                        </div>

                        {report.expiresAt && (
                          <div className="flex items-center gap-1">
                            <span>Expires: {new Date(report.expiresAt).toLocaleDateString()}</span>
                          </div>
                        )}

                        {report.projectType && (
                          <span>Type: {report.projectType}</span>
                        )}

                        {report.hasResponse && report.responseDate && (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <MessageCircle className="w-4 h-4" />
                            Response: {new Date(report.responseDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      {report.hasResponse && report.responseEmail && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Response from: {report.responseEmail}
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

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingReport(report)}
                        className="h-8"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit Info
                      </Button>

                      {onEditContent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editReportContent(report)}
                          className="h-8 text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Edit Content
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirm(report.reportId)}
                        disabled={isDeleting === report.reportId}
                        className="h-8 text-red-600 hover:text-red-700"
                      >
                        {isDeleting === report.reportId ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Deleting
                          </>
                        ) : (
                          <>
                            <Archive className="w-4 h-4 mr-1" />
                            Archive
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        {filteredReports.length > 0 && (
          <div className="p-4 border-t bg-muted/30 shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <p className="text-xs text-muted-foreground text-center">
              Showing {filteredReports.length} of {reports.length} reports
            </p>
          </div>
        )}
      </div>

      {/* Archive Confirmation Dialog */}
      {deleteConfirm && (() => {
        const reportToDelete = reports.find(r => r.reportId === deleteConfirm)
        const hasAttachments = reportToDelete?.hasAttachments || (reportToDelete?.attachmentCount && reportToDelete.attachmentCount > 0)

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 p-6">
              <h3 className="text-lg font-semibold mb-4">Archive Report</h3>

              {hasAttachments && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                      This report has {reportToDelete?.attachmentCount || 1} client attachment{reportToDelete?.attachmentCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-500">
                      Make sure you've downloaded all attachments before archiving. You won't be able to access them after archiving.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-muted-foreground mb-6">
                This will remove the report from your list. Your client can still view it until the expiration date.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteReport(deleteConfirm)}
                  disabled={isDeleting === deleteConfirm}
                  className="flex-1"
                >
                  {isDeleting === deleteConfirm ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Archiving...
                    </>
                  ) : (
                    'Archive Report'
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )
      })()}

      {/* Edit Report Modal */}
      {editingReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Report</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={editingReport.title}
                  onChange={(e) => setEditingReport(prev => prev ? {...prev, title: e.target.value} : null)}
                  placeholder="Report title"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Input
                  value={editingReport.description || ''}
                  onChange={(e) => setEditingReport(prev => prev ? {...prev, description: e.target.value} : null)}
                  placeholder="Report description"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Expiration Date</label>
                <Input
                  type="date"
                  value={editingReport.expiresAt ? new Date(editingReport.expiresAt).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingReport(prev => prev ? {...prev, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined} : null)}
                  placeholder="Expiration date"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank for no expiration
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditingReport(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={updateReport}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}