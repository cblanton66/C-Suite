"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, ChevronRight } from "lucide-react"
import { toast } from "sonner"

interface Client {
  id?: string
  clientName: string
  email: string
  phone: string
  address: string
  industry: string
  status: string
  workspaceOwner: string
  createdBy: string
  sharedWith: string[] | string
  dateAdded: string
}

interface ClientProjectsTabProps {
  client: Client
  userEmail: string
  workspaceOwner: string
  onLoadThread?: (messages: any[], threadData: { threadId: string; filePath: string; metadata: any }) => void
  onCloseAll: () => void
}

export function ClientProjectsTab({
  client,
  userEmail,
  workspaceOwner,
  onLoadThread,
  onCloseAll
}: ClientProjectsTabProps) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  // Fetch projects when component mounts or showArchived changes
  useEffect(() => {
    fetchProjects()
  }, [showArchived])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      // Use client.workspaceOwner (the actual owner) instead of workspaceOwner (current user)
      const clientOwner = client.workspaceOwner || workspaceOwner
      console.log('[ClientProjectsTab] Fetching projects for client:', client.clientName, 'owner:', clientOwner)
      const response = await fetch(
        `/api/list-threads?userId=${encodeURIComponent(userEmail)}&workspaceOwner=${encodeURIComponent(clientOwner)}&includeArchive=${showArchived}`
      )
      const data = await response.json()
      console.log('[ClientProjectsTab] API response:', data)
      console.log('[ClientProjectsTab] Total threads:', data.threads?.length)
      console.log('[ClientProjectsTab] Sample thread structure:', data.threads?.[0])

      // Normalize client name for comparison (case-insensitive, remove extra spaces)
      const normalizeClientName = (name: string) => {
        return name?.toLowerCase().replace(/\s+/g, ' ').trim() || ''
      }

      const targetClientName = normalizeClientName(client.clientName)
      console.log('[ClientProjectsTab] Looking for client:', targetClientName)

      const clientProjects = data.threads?.filter((t: any) => {
        const threadClientName = normalizeClientName(t.metadata?.clientName)
        console.log('[ClientProjectsTab] Comparing:', threadClientName, '===', targetClientName, '?', threadClientName === targetClientName)
        return threadClientName === targetClientName
      }) || []
      console.log('[ClientProjectsTab] Filtered projects for', client.clientName, ':', clientProjects.length)
      setProjects(clientProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadThread = async (threadId: string) => {
    if (!onLoadThread) return

    try {
      console.log('[ClientProjectsTab] Loading thread:', threadId)
      // Find the thread in our projects list to get the filePath
      const thread = projects.find((p: any) => p.threadId === threadId)
      if (!thread) {
        console.error('[ClientProjectsTab] Thread not found in projects list')
        toast.error('Thread not found')
        return
      }

      console.log('[ClientProjectsTab] Found thread:', thread)
      console.log('[ClientProjectsTab] Fetching from filePath:', thread.filePath)

      // Fetch the full thread conversation
      const response = await fetch(
        `/api/load-thread?userId=${encodeURIComponent(userEmail)}&filePath=${encodeURIComponent(thread.filePath)}`
      )

      console.log('[ClientProjectsTab] Load thread response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[ClientProjectsTab] Thread data:', data)
        const messages = (data.thread?.conversation || []).map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt)
        }))
        console.log('[ClientProjectsTab] Messages count:', messages.length)
        const threadData = {
          threadId: thread.threadId,
          filePath: thread.filePath,
          metadata: thread.metadata
        }
        onLoadThread(messages, threadData)
        onCloseAll() // Close all modals when loading a thread
      } else {
        const errorText = await response.text()
        console.error('[ClientProjectsTab] Failed to load thread:', errorText)
        toast.error(`Failed to load thread conversation: ${errorText}`)
      }
    } catch (error) {
      console.error('[ClientProjectsTab] Error loading thread:', error)
      toast.error('Failed to load thread')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {showArchived ? 'All Projects' : 'Active Projects'} ({projects.length})
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
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No projects found for this client</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project: any) => (
            <div
              key={project.threadId}
              className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
              onClick={() => handleLoadThread(project.threadId)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{project.metadata?.title || 'Untitled'}</h4>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
                      {project.metadata?.projectType || 'General'}
                    </span>
                    {project.metadata?.status && (
                      <span className="px-2 py-1 bg-gray-600 text-white rounded text-xs">
                        {project.metadata.status}
                      </span>
                    )}
                    {project.isArchived && (
                      <span className="px-2 py-1 bg-gray-500 text-white rounded text-xs">
                        Archived
                      </span>
                    )}
                    <span>{new Date(project.lastUpdated).toLocaleDateString()}</span>
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
