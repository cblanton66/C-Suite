"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, MessageCircle, Calendar, User, Folder, Edit, Filter, Search, Archive, Trash2 } from "lucide-react"
import { EditThreadModal } from "@/components/edit-thread-modal"

interface ThreadMetadata {
  clientName: string
  title: string
  projectType: string
  status: string
  priority: string
  createdAt: string
  lastUpdated: string
  lastAccessed?: string
  messageCount: number
}

interface SavedThread {
  threadId: string
  fileName: string
  filePath: string
  metadata: ThreadMetadata
  messageCount: number
  lastUpdated: string
  isArchived?: boolean
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

interface ThreadManagementModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string | null
  workspaceOwner?: string | null
  onLoadThread: (messages: Message[], threadData: { threadId: string; filePath: string; metadata: any }) => void
}

export function ThreadManagementModal({ isOpen, onClose, userEmail, workspaceOwner, onLoadThread }: ThreadManagementModalProps) {
  console.log('[THREAD_MODAL] Component rendered with props - userEmail:', userEmail, 'workspaceOwner:', workspaceOwner)

  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [threadToEdit, setThreadToEdit] = useState<SavedThread | null>(null)

  // Simple grouped view - load all threads upfront and group by client
  const [allThreads, setAllThreads] = useState<SavedThread[]>([])
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("") // Client search filter
  const [showAll, setShowAll] = useState(false) // Toggle for active vs all projects
  const [includeArchive, setIncludeArchive] = useState(false) // Toggle for including archived projects

  useEffect(() => {
    if (isOpen && userEmail) {
      loadAllThreads()
    }
  }, [isOpen, userEmail, includeArchive])

  const loadAllThreads = async () => {
    if (!userEmail) return

    setLoading(true)
    try {
      console.log('[THREAD_MODAL] loadAllThreads - userEmail:', userEmail, 'workspaceOwner:', workspaceOwner, 'includeArchive:', includeArchive)
      const url = `/api/list-threads?userId=${encodeURIComponent(userEmail)}${workspaceOwner ? `&workspaceOwner=${encodeURIComponent(workspaceOwner)}` : ''}${includeArchive ? '&includeArchive=true' : ''}`
      console.log('[THREAD_MODAL] Fetching URL:', url)
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setAllThreads(data.threads)
      } else {
        console.error('Failed to load threads:', data.error)
      }
    } catch (error) {
      console.error('Error loading threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleClientExpansion = (clientName: string) => {
    const newExpanded = new Set(expandedClients)
    if (newExpanded.has(clientName)) {
      newExpanded.delete(clientName)
    } else {
      newExpanded.add(clientName)
    }
    setExpandedClients(newExpanded)
  }


  const loadThread = async (thread: SavedThread) => {
    if (!userEmail) return

    try {
      const response = await fetch(`/api/load-thread?userId=${encodeURIComponent(userEmail)}&filePath=${encodeURIComponent(thread.filePath)}`)
      const data = await response.json()

      if (data.success && data.thread.conversation) {
        // Convert thread messages to the format expected by chat interface
        const messages: Message[] = data.thread.conversation.map((msg: any, index: number) => ({
          id: msg.id || `thread-msg-${index}`,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date()
        }))

        const threadData = {
          threadId: thread.threadId,
          filePath: thread.filePath,
          metadata: thread.metadata
        }
        onLoadThread(messages, threadData)
        onClose()
      } else {
        alert('Failed to load thread conversation')
      }
    } catch (error) {
      console.error('Error loading thread:', error)
      alert('Failed to load thread')
    }
  }

  const editThread = (thread: SavedThread) => {
    setThreadToEdit(thread)
    setShowEditModal(true)
  }

  const handleThreadUpdated = async () => {
    // Reload all threads
    await loadAllThreads()
    setShowEditModal(false)
    setThreadToEdit(null)
  }

  const archiveThread = async (thread: SavedThread) => {
    if (!userEmail) return

    const confirmMessage = `Are you sure you want to archive "${thread.metadata.title}"?\n\nArchived projects won't appear in search results but can be viewed by clicking "Show Archive".`

    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch('/api/archive-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userEmail,
          workspaceOwner: workspaceOwner,
          filePath: thread.filePath
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Reload threads to reflect the change
        await loadAllThreads()
        alert('Thread archived successfully!')
      } else {
        alert(`Failed to archive thread: ${data.error}`)
      }
    } catch (error) {
      console.error('Error archiving thread:', error)
      alert('Failed to archive thread')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "text-green-600 bg-green-100"
      case "Active": return "text-blue-600 bg-blue-100"
      case "On Hold": return "text-yellow-600 bg-yellow-100"
      case "Waiting for Client Info": return "text-orange-600 bg-orange-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "text-red-600"
      case "Normal": return "text-blue-600"
      case "Low": return "text-gray-600"
      default: return "text-gray-600"
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Manage Projects</h2>
            <Button
              variant={showAll ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2"
            >
              <Filter className="w-3 h-3" />
              {showAll ? "Show Active Only" : "Show All"}
            </Button>
            <Button
              variant={includeArchive ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIncludeArchive(!includeArchive)}
              className="flex items-center gap-2"
            >
              <Archive className="w-3 h-3" />
              {includeArchive ? "Hide Archive" : "Show Archive"}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-auto p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Box */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Grouped Client List */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-2">Loading projects...</span>
            </div>
          ) : (() => {
              // Filter threads based on toggle
              const filteredThreads = showAll
                ? allThreads
                : allThreads.filter(thread => thread.metadata.status !== 'Completed')

              // Group threads by client name
              const clientGroups = new Map<string, SavedThread[]>()
              filteredThreads.forEach(thread => {
                const clientName = thread.metadata.clientName || 'Unknown Client'
                if (!clientGroups.has(clientName)) {
                  clientGroups.set(clientName, [])
                }
                clientGroups.get(clientName)!.push(thread)
              })

              // Convert to array and sort by client name
              const clients = Array.from(clientGroups.entries())
                .map(([clientName, threads]) => ({
                  clientName,
                  threads: threads.sort((a, b) =>
                    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
                  )
                }))
                .sort((a, b) => a.clientName.toLowerCase().localeCompare(b.clientName.toLowerCase()))

              // Filter by search term
              const filteredClients = clients.filter(client =>
                client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
              )

              return filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? `No clients found matching "${searchTerm}"` : "No projects found"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredClients.map((client) => {
                const isExpanded = expandedClients.has(client.clientName)

                return (
                  <div key={client.clientName} className="border rounded-lg overflow-hidden">
                    {/* Client Header */}
                    <button
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      onClick={() => toggleClientExpansion(client.clientName)}
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div className="text-left">
                          <h3 className="font-medium">{client.clientName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {client.threads.length} {client.threads.length === 1 ? 'project' : 'projects'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(client.threads[0].lastUpdated)}
                        </span>
                        <span className="text-muted-foreground">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                    </button>

                    {/* Expanded Thread List */}
                    {isExpanded && (
                      <div className="border-t bg-muted/20">
                        <div className="divide-y">
                          {client.threads.map((thread) => (
                              <div
                                key={thread.threadId}
                                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => loadThread(thread)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                                      <h4 className="font-medium">{thread.metadata.title}</h4>
                                      {thread.isArchived && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                                          <Archive className="w-3 h-3 inline mr-1" />
                                          Archived
                                        </span>
                                      )}
                                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(thread.metadata.status)}`}>
                                        {thread.metadata.status}
                                      </span>
                                      <span className={`text-xs font-medium ${getPriorityColor(thread.metadata.priority)}`}>
                                        {thread.metadata.priority}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                      <div className="flex items-center gap-1">
                                        <Folder className="w-3 h-3" />
                                        {thread.metadata.projectType}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3" />
                                        {thread.messageCount} messages
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Created: {formatDate(thread.metadata.createdAt)}
                                      </div>
                                      <div>
                                        Updated: {formatDate(thread.lastUpdated)}
                                      </div>
                                      {thread.metadata.lastAccessed && (
                                        <div className="text-primary font-medium">
                                          Accessed: {formatDate(thread.metadata.lastAccessed)}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        editThread(thread)
                                      }}
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                    {!thread.isArchived && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          archiveThread(thread)
                                        }}
                                        className="text-orange-600 hover:text-orange-700"
                                      >
                                        <Archive className="w-3 h-3 mr-1" />
                                        Archive
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        loadThread(thread)
                                      }}
                                    >
                                      Load
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
              )
            })()}
        </div>

        <div className="p-6 border-t bg-muted/20">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{allThreads.length} {allThreads.length === 1 ? 'project' : 'projects'} total</span>
            <Button variant="outline" onClick={loadAllThreads}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Thread Modal */}
      <EditThreadModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setThreadToEdit(null)
        }}
        thread={threadToEdit}
        userEmail={userEmail}
        onThreadUpdated={handleThreadUpdated}
      />
    </div>
  )
}