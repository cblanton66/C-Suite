"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Search, MessageCircle, Calendar, User, Folder, ArrowUpDown, Edit } from "lucide-react"
import { EditThreadModal } from "@/components/edit-thread-modal"

interface ThreadMetadata {
  clientName: string
  title: string
  projectType: string
  status: string
  priority: string
  createdAt: string
  lastUpdated: string
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
  const [threads, setThreads] = useState<SavedThread[]>([])
  const [filteredThreads, setFilteredThreads] = useState<SavedThread[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("active")
  const [filterProjectType, setFilterProjectType] = useState("all")
  const [sortBy, setSortBy] = useState("lastUpdated")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showEditModal, setShowEditModal] = useState(false)
  const [threadToEdit, setThreadToEdit] = useState<SavedThread | null>(null)

  useEffect(() => {
    if (isOpen && userEmail) {
      loadThreads()
    }
  }, [isOpen, userEmail])

  useEffect(() => {
    filterAndSortThreads()
  }, [threads, searchTerm, filterStatus, filterProjectType, sortBy, sortOrder])

  const loadThreads = async () => {
    if (!userEmail) return

    setLoading(true)
    try {
      const response = await fetch(`/api/list-threads?userId=${encodeURIComponent(userEmail)}`)
      const data = await response.json()

      if (data.success) {
        setThreads(data.threads)
      } else {
        console.error('Failed to load threads:', data.error)
      }
    } catch (error) {
      console.error('Error loading threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortThreads = () => {
    let filtered = threads.filter(thread => {
      const matchesSearch = 
        thread.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.metadata.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.metadata.projectType.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = 
        filterStatus === "all" || 
        (filterStatus === "active" && thread.metadata.status !== "Completed") ||
        thread.metadata.status === filterStatus
      const matchesProjectType = filterProjectType === "all" || thread.metadata.projectType === filterProjectType

      return matchesSearch && matchesStatus && matchesProjectType
    })

    // Sort threads
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case "title":
          aValue = a.metadata.title.toLowerCase()
          bValue = b.metadata.title.toLowerCase()
          break
        case "clientName":
          aValue = a.metadata.clientName.toLowerCase()
          bValue = b.metadata.clientName.toLowerCase()
          break
        case "createdAt":
          aValue = new Date(a.metadata.createdAt).getTime()
          bValue = new Date(b.metadata.createdAt).getTime()
          break
        case "messageCount":
          aValue = a.messageCount
          bValue = b.messageCount
          break
        default: // lastUpdated
          aValue = new Date(a.lastUpdated).getTime()
          bValue = new Date(b.lastUpdated).getTime()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredThreads(filtered)
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
    loadThreads() // Refresh the thread list
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
          <h2 className="text-lg font-semibold">Saved Conversation Threads</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-auto p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search threads by title, client, or project type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Active Threads" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Threads</SelectItem>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Waiting for Client Info">Waiting</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProjectType} onValueChange={setFilterProjectType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="Tax Planning">Tax Planning</SelectItem>
                <SelectItem value="Tax Preparation">Tax Preparation</SelectItem>
                <SelectItem value="Business Consultation">Business Consultation</SelectItem>
                <SelectItem value="Bookkeeping">Bookkeeping</SelectItem>
                <SelectItem value="Financial Planning">Financial Planning</SelectItem>
                <SelectItem value="Audit">Audit</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastUpdated">Last Updated</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="clientName">Client Name</SelectItem>
                <SelectItem value="messageCount">Message Count</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-2">Loading threads...</span>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {threads.length === 0 ? "No saved threads found" : "No threads match your search criteria"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredThreads.map((thread) => (
                <div
                  key={thread.threadId}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => loadThread(thread)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-medium">{thread.metadata.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(thread.metadata.status)}`}>
                          {thread.metadata.status}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(thread.metadata.priority)}`}>
                          {thread.metadata.priority}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {thread.metadata.clientName}
                        </div>
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
                        Load Thread
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-muted/20">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredThreads.length} of {threads.length} threads
            </span>
            <Button variant="outline" onClick={loadThreads}>
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