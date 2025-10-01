"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, MessageCircle, Calendar, User, Folder, Edit, Filter, Search } from "lucide-react"
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
  onLoadThread: (messages: Message[], threadData: { threadId: string; filePath: string; metadata: any }) => void
}

export function ThreadManagementModal({ isOpen, onClose, userEmail, onLoadThread }: ThreadManagementModalProps) {
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [threadToEdit, setThreadToEdit] = useState<SavedThread | null>(null)

  // States for grouped client view
  const [clientSummaries, setClientSummaries] = useState<Array<{
    clientName: string
    threadCount: number
    activeCount: number
    lastUpdated: string
  }>>([])
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())
  const [clientThreads, setClientThreads] = useState<Map<string, SavedThread[]>>(new Map())
  const [showAllClients, setShowAllClients] = useState(false) // Default to active only
  const [searchTerm, setSearchTerm] = useState("") // Client search filter

  useEffect(() => {
    if (isOpen && userEmail) {
      loadClientSummaries()
    }
  }, [isOpen, userEmail, showAllClients]) // Reload when toggle changes

  const loadClientSummaries = async () => {
    if (!userEmail) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client-threads-summary?userEmail=${encodeURIComponent(userEmail)}&showAll=${showAllClients}`)
      const data = await response.json()

      if (data.success) {
        setClientSummaries(data.clients)
      } else {
        console.error('Failed to load client summaries:', data.error)
      }
    } catch (error) {
      console.error('Error loading client summaries:', error)
    } finally {
      setLoading(false)
    }
  }


  const toggleClientExpansion = async (clientName: string) => {
    const newExpanded = new Set(expandedClients)

    if (newExpanded.has(clientName)) {
      // Collapse
      newExpanded.delete(clientName)
    } else {
      // Expand - load threads for this client if not already loaded
      newExpanded.add(clientName)

      if (!clientThreads.has(clientName) && userEmail) {
        // Load threads for this specific client
        try {
          const response = await fetch(`/api/list-threads?userId=${encodeURIComponent(userEmail)}`)
          const data = await response.json()

          if (data.success) {
            // Filter threads for this client
            const clientSpecificThreads = data.threads.filter(
              (thread: SavedThread) => thread.metadata.clientName === clientName
            )
            setClientThreads(new Map(clientThreads).set(clientName, clientSpecificThreads))
          }
        } catch (error) {
          console.error('Error loading client threads:', error)
        }
      }
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

  const handleThreadUpdated = () => {
    loadClientSummaries() // Refresh the client summaries
    // Also refresh threads for any expanded clients
    expandedClients.forEach(clientName => {
      toggleClientExpansion(clientName) // This will reload threads for that client
    })
    setShowEditModal(false)
    setThreadToEdit(null)
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
              variant={showAllClients ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowAllClients(!showAllClients)}
              className="flex items-center gap-2"
            >
              <Filter className="w-3 h-3" />
              {showAllClients ? "Show Active Only" : "Show All Clients"}
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
              <span className="ml-2">Loading clients...</span>
            </div>
          ) : (() => {
              // Filter clients by search term (client-side)
              const filteredClients = clientSummaries.filter(client =>
                client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
              )

              return filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? `No clients found matching "${searchTerm}"` : "No clients found"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredClients.map((client) => {
                const isExpanded = expandedClients.has(client.clientName)
                const clientThreadList = clientThreads.get(client.clientName) || []

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
                            {client.threadCount} {client.threadCount === 1 ? 'project' : 'projects'}
                            {client.activeCount > 0 && ` • ${client.activeCount} active`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(client.lastUpdated)}
                        </span>
                        <span className="text-muted-foreground">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                    </button>

                    {/* Expanded Thread List */}
                    {isExpanded && (
                      <div className="border-t bg-muted/20">
                        {clientThreadList.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading projects...
                          </div>
                        ) : (
                          <div className="divide-y">
                            {clientThreadList.map((thread) => (
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
                        )}
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
            <span>
              {(() => {
                const filteredCount = clientSummaries.filter(client =>
                  client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
                ).length
                const total = clientSummaries.length

                if (searchTerm && filteredCount !== total) {
                  return `Showing ${filteredCount} of ${total} ${total === 1 ? 'client' : 'clients'}`
                }
                return `Showing ${total} ${total === 1 ? 'client' : 'clients'}`
              })()}
            </span>
            <Button variant="outline" onClick={loadClientSummaries}>
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