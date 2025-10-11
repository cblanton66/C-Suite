"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Calendar, FileText, MessageSquare, FolderOpen, Loader2, Download } from "lucide-react"

interface ActivityReportModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
  workspaceOwner?: string
}

interface ActivityData {
  [clientName: string]: {
    reports: Array<{
      title: string
      date: string
      type: string
      reportId?: string
      viewCount?: number
      projectType?: string
      description?: string
    }>
    notes: Array<{
      clientName: string
      title: string
      date: string
      type: string
    }>
    threads: Array<{
      clientName: string
      title: string
      date: string
      type: string
      projectType?: string
      status?: string
      messageCount?: number
    }>
  }
}

export function ActivityReportModal({ isOpen, onClose, userEmail, workspaceOwner }: ActivityReportModalProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activityData, setActivityData] = useState<ActivityData | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [error, setError] = useState("")

  const fetchActivityReport = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates")
      return
    }

    if (!userEmail) {
      setError("User email not found")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(
        `/api/activity-report?userEmail=${encodeURIComponent(userEmail)}&workspaceOwner=${encodeURIComponent(workspaceOwner || userEmail)}&startDate=${startDate}&endDate=${endDate}`
      )

      const data = await response.json()

      if (response.ok) {
        setActivityData(data.activity)
        setSummary(data.summary)
      } else {
        setError(data.error || 'Failed to fetch activity report')
      }
    } catch (error) {
      console.error('Error fetching activity report:', error)
      setError('Failed to fetch activity report')
    } finally {
      setIsLoading(false)
    }
  }

  const setPresetRange = (preset: 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'last30Days') => {
    const today = new Date()
    let start = new Date()
    let end = new Date()

    switch (preset) {
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        end = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3)
        start = new Date(today.getFullYear(), quarter * 3, 1)
        end = new Date(today.getFullYear(), quarter * 3 + 3, 0)
        break
      case 'last30Days':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        end = today
        break
    }

    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  const handleClose = () => {
    setStartDate("")
    setEndDate("")
    setActivityData(null)
    setSummary(null)
    setError("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Activity Report</h2>
              <p className="text-sm text-muted-foreground">
                View all work by date range
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

        {/* Date Selection */}
        <div className="p-6 border-b bg-muted/30">
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPresetRange('thisMonth')}
              >
                This Month
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPresetRange('lastMonth')}
              >
                Last Month
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPresetRange('thisQuarter')}
              >
                This Quarter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPresetRange('last30Days')}
              >
                Last 30 Days
              </Button>
            </div>

            <Button
              onClick={fetchActivityReport}
              disabled={isLoading || !startDate || !endDate}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="p-6 border-b bg-muted/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{summary.totalClients}</div>
                <div className="text-sm text-muted-foreground">Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{summary.totalReports}</div>
                <div className="text-sm text-muted-foreground">Reports</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{summary.totalThreads}</div>
                <div className="text-sm text-muted-foreground">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{summary.totalNotes}</div>
                <div className="text-sm text-muted-foreground">Notes</div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {activityData && Object.keys(activityData).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(activityData).map(([clientName, activities]) => {
                const totalActivities =
                  activities.reports.length +
                  activities.notes.length +
                  activities.threads.length

                if (totalActivities === 0) return null

                return (
                  <Card key={clientName} className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center justify-between">
                      <span>{clientName}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {totalActivities} item{totalActivities !== 1 ? 's' : ''}
                      </span>
                    </h3>

                    {/* Reports */}
                    {activities.reports.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Reports ({activities.reports.length})
                        </h4>
                        <div className="space-y-2 ml-6">
                          {activities.reports.map((report, idx) => (
                            <div key={idx} className="text-sm">
                              <div className="font-medium">{report.title}</div>
                              <div className="text-muted-foreground text-xs">
                                {new Date(report.date).toLocaleDateString()} • {report.viewCount || 0} views
                                {report.projectType && ` • ${report.projectType}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects/Threads */}
                    {activities.threads.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" />
                          Projects ({activities.threads.length})
                        </h4>
                        <div className="space-y-2 ml-6">
                          {activities.threads.map((thread, idx) => (
                            <div key={idx} className="text-sm">
                              <div className="font-medium">{thread.title}</div>
                              <div className="text-muted-foreground text-xs">
                                {new Date(thread.date).toLocaleDateString()}
                                {thread.projectType && ` • ${thread.projectType}`}
                                {thread.status && ` • ${thread.status}`}
                                {thread.messageCount && ` • ${thread.messageCount} messages`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {activities.notes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Notes ({activities.notes.length})
                        </h4>
                        <div className="space-y-2 ml-6">
                          {activities.notes.map((note, idx) => (
                            <div key={idx} className="text-sm">
                              <div className="font-medium">{note.title}</div>
                              <div className="text-muted-foreground text-xs">
                                {new Date(note.date).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : activityData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No activity found for the selected date range</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a date range and click "Generate Report" to view activity</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
