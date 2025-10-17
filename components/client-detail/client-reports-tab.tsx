"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileText, ChevronRight } from "lucide-react"
import { Client } from "@/types/client"

interface ClientReportsTabProps {
  client: Client
  userEmail: string
  onCloseAll: () => void
}

export function ClientReportsTab({
  client,
  userEmail,
  onCloseAll
}: ClientReportsTabProps) {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [showArchived])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const includeArchived = showArchived ? 'true' : 'false'
      const response = await fetch(`/api/my-reports?userEmail=${encodeURIComponent(userEmail)}&includeArchived=${includeArchived}&clientName=${encodeURIComponent(client.clientName)}`)
      const data = await response.json()

      // No need to filter anymore - API returns only this client's reports
      setReports(data.reports || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenReport = (reportId: string) => {
    window.open(`/reports/${reportId}`, '_blank')
    onCloseAll()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {showArchived ? 'All Reports' : 'Active Reports'} ({reports.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? 'Hide Archive' : 'Show Archive'}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-800/30 rounded-lg animate-pulse">
              <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="flex gap-2 mt-2">
                <div className="h-4 bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-700 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No reports shared with this client</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((report: any) => (
            <div
              key={report.reportId}
              className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
              onClick={() => handleOpenReport(report.reportId)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{report.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Views: {report.viewCount || 0}</span>
                    <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                    {report.hasResponse && (
                      <span className="px-2 py-1 bg-green-600 text-white rounded text-xs">
                        Has Response
                      </span>
                    )}
                    {report.isActive === 'FALSE' && (
                      <span className="px-2 py-1 bg-gray-500 text-white rounded text-xs">
                        Archived
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
