"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  X,
  Search,
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Edit,
  Trash2,
  Users,
  FileText,
  MessageCircle,
  ChevronRight,
  Calendar,
  Copy
} from "lucide-react"

interface Client {
  clientName: string
  email: string
  phone: string
  address: string
  industry: string
  status: string
  workspaceOwner: string
  createdBy: string
  sharedWith: string
  dateAdded: string
}

interface ClientCounts {
  projects: number
  notes: number
  reports: number
}

interface ClientManagementModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
  workspaceOwner: string
  onLoadThread?: (messages: any[], threadData: { threadId: string; filePath: string; metadata: any }) => void
  onEditContent?: (reportId: string) => void
}

export function ClientManagementModal({
  isOpen,
  onClose,
  userEmail,
  workspaceOwner,
  onLoadThread,
  onEditContent
}: ClientManagementModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [showClientDetail, setShowClientDetail] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchClients()
    }
  }, [isOpen, userEmail, workspaceOwner])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/user-clients?userEmail=${encodeURIComponent(userEmail)}&workspaceOwner=${encodeURIComponent(workspaceOwner)}`
      )
      const data = await response.json()

      if (data.success) {
        setClients(data.clients || [])
        // Don't fetch counts upfront - will be loaded when client detail is opened
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleCreateClient = async (clientData: Partial<Client>) => {
    try {
      const response = await fetch('/api/user-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...clientData,
          userEmail,
          workspaceOwner
        })
      })

      const data = await response.json()

      if (data.success) {
        await fetchClients()
        setShowNewClientModal(false)
      } else {
        alert(data.error || 'Failed to create client')
      }
    } catch (error) {
      console.error('Error creating client:', error)
      alert('Failed to create client')
    }
  }

  const handleUpdateClient = async (clientData: Partial<Client>) => {
    try {
      const response = await fetch('/api/user-clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...clientData,
          userEmail,
          workspaceOwner
        })
      })

      const data = await response.json()

      if (data.success) {
        await fetchClients()
        setShowClientDetail(false)
        setSelectedClient(null)
      } else {
        alert(data.error || 'Failed to update client')
      }
    } catch (error) {
      console.error('Error updating client:', error)
      alert('Failed to update client')
    }
  }

  const handleDeleteClient = async (clientName: string) => {
    if (!confirm(`Are you sure you want to delete ${clientName}? This will set the client as inactive.`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/user-clients?clientName=${encodeURIComponent(clientName)}&userEmail=${encodeURIComponent(userEmail)}&workspaceOwner=${encodeURIComponent(workspaceOwner)}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (data.success) {
        await fetchClients()
        setShowClientDetail(false)
        setSelectedClient(null)
      } else {
        alert(data.error || 'Failed to delete client')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Failed to delete client')
    }
  }

  const filteredClients = clients.filter(client =>
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.industry.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  if (showNewClientModal) {
    return (
      <NewClientModal
        onClose={() => setShowNewClientModal(false)}
        onCreate={handleCreateClient}
      />
    )
  }

  if (showClientDetail && selectedClient) {
    return (
      <ClientDetailModal
        client={selectedClient}
        onClose={() => {
          setShowClientDetail(false)
          setSelectedClient(null)
        }}
        onUpdate={handleUpdateClient}
        onDelete={handleDeleteClient}
        userEmail={userEmail}
        workspaceOwner={workspaceOwner}
        onLoadThread={onLoadThread}
        onEditContent={onEditContent}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Client Management</h2>
              <p className="text-sm text-muted-foreground">
                {clients.length} {clients.length === 1 ? 'client' : 'clients'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowNewClientModal(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Client
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search clients by name, email, or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 dark:bg-gray-900 border-gray-700 dark:border-gray-700 text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Client List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">
                {searchTerm ? 'No clients found matching your search' : 'No clients yet'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowNewClientModal(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Client
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredClients.map((client) => {
                return (
                  <Card
                    key={client.clientName}
                    className="p-4 hover:shadow-lg transition-all cursor-pointer bg-gray-800/50 dark:bg-gray-800/50 border-gray-700 dark:border-gray-700"
                    onClick={() => {
                      setSelectedClient(client)
                      setShowClientDetail(true)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{client.clientName}</h3>
                          {client.sharedWith && (
                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                              Shared
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          {client.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </div>
                          )}
                          {client.industry && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-3 h-3" />
                              {client.industry}
                            </div>
                          )}
                          {client.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {client.address}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// New Client Modal Component
function NewClientModal({
  onClose,
  onCreate
}: {
  onClose: () => void
  onCreate: (client: Partial<Client>) => void
}) {
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phone: '',
    address: '',
    industry: ''
  })

  const handleSubmit = () => {
    if (!formData.clientName.trim()) {
      alert('Client name is required')
      return
    }
    onCreate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">New Client</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Client Name *
            </label>
            <Input
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Enter client name..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="client@example.com"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Address
            </label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, City, ST 12345"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Industry
            </label>
            <Input
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="e.g., Technology, Healthcare, Retail..."
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.clientName.trim()}>
            Create Client
          </Button>
        </div>
      </div>
    </div>
  )
}

// Client Detail Modal Component
function ClientDetailModal({
  client,
  onClose,
  onUpdate,
  onDelete,
  userEmail,
  workspaceOwner,
  onLoadThread,
  onEditContent
}: {
  client: Client
  onClose: () => void
  onUpdate: (client: Partial<Client>) => void
  onDelete: (clientName: string) => void
  userEmail: string
  workspaceOwner: string
  onLoadThread?: (messages: any[], threadData: { threadId: string; filePath: string; metadata: any }) => void
  onEditContent?: (reportId: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'projects' | 'notes' | 'reports'>('info')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(client)
  const [projects, setProjects] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [selectedNote, setSelectedNote] = useState<any>(null)
  const [noteContent, setNoteContent] = useState('')
  const [loadingNote, setLoadingNote] = useState(false)

  const handleSave = () => {
    onUpdate(formData)
    setIsEditing(false)
  }

  // Fetch projects when Projects tab is active
  useEffect(() => {
    if (activeTab === 'projects') {
      fetchProjects()
    }
  }, [activeTab, showArchived])

  // Fetch notes when Notes tab is active
  useEffect(() => {
    if (activeTab === 'notes') {
      fetchNotes()
    }
  }, [activeTab])

  // Fetch reports when Reports tab is active
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports()
    }
  }, [activeTab])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      console.log('[ClientDetailModal] Fetching projects for client:', client.clientName)
      const response = await fetch(
        `/api/list-threads?userId=${encodeURIComponent(userEmail)}&workspaceOwner=${encodeURIComponent(workspaceOwner)}&includeArchive=${showArchived}`
      )
      const data = await response.json()
      console.log('[ClientDetailModal] API response:', data)
      console.log('[ClientDetailModal] Total threads:', data.threads?.length)
      console.log('[ClientDetailModal] Sample thread structure:', data.threads?.[0])
      const clientProjects = data.threads?.filter((t: any) => t.metadata?.clientName === client.clientName) || []
      console.log('[ClientDetailModal] Filtered projects for', client.clientName, ':', clientProjects.length)
      setProjects(clientProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const clientSlug = client.clientName.toLowerCase().replace(/\s+/g, '-')
      console.log('[ClientDetailModal] Fetching notes for client slug:', clientSlug)
      const response = await fetch(
        `/api/list-files?userEmail=${encodeURIComponent(userEmail)}&workspaceOwner=${encodeURIComponent(workspaceOwner)}&folder=client-files/${clientSlug}/notes`
      )
      const data = await response.json()
      console.log('[ClientDetailModal] Notes response:', data)
      console.log('[ClientDetailModal] Notes files:', data.files)
      setNotes(data.files || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/my-reports?userEmail=${encodeURIComponent(userEmail)}`)
      const data = await response.json()
      const clientReports = data.reports?.filter((r: any) => r.clientName === client.clientName) || []
      setReports(clientReports)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadThread = async (threadId: string) => {
    if (!onLoadThread) return

    try {
      console.log('[ClientDetailModal] Loading thread:', threadId)
      // Find the thread in our projects list to get the filePath
      const thread = projects.find((p: any) => p.threadId === threadId)
      if (!thread) {
        console.error('[ClientDetailModal] Thread not found in projects list')
        alert('Thread not found')
        return
      }

      console.log('[ClientDetailModal] Found thread:', thread)
      console.log('[ClientDetailModal] Fetching from filePath:', thread.filePath)

      // Fetch the full thread conversation
      const response = await fetch(
        `/api/load-thread?userId=${encodeURIComponent(userEmail)}&filePath=${encodeURIComponent(thread.filePath)}`
      )

      console.log('[ClientDetailModal] Load thread response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[ClientDetailModal] Thread data:', data)
        const messages = (data.thread?.conversation || []).map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt)
        }))
        console.log('[ClientDetailModal] Messages count:', messages.length)
        const threadData = {
          threadId: thread.threadId,
          filePath: thread.filePath,
          metadata: thread.metadata
        }
        onLoadThread(messages, threadData)
        onClose()
      } else {
        const errorText = await response.text()
        console.error('[ClientDetailModal] Failed to load thread:', errorText)
        alert(`Failed to load thread conversation: ${errorText}`)
      }
    } catch (error) {
      console.error('[ClientDetailModal] Error loading thread:', error)
      alert('Failed to load thread')
    }
  }

  const handleOpenReport = (reportId: string) => {
    window.open(`/reports/${reportId}`, '_blank')
  }

  const handleOpenNote = async (note: any) => {
    setSelectedNote(note)
    setLoadingNote(true)
    try {
      const response = await fetch(
        `/api/get-file-content?filePath=${encodeURIComponent(note.name)}`
      )
      if (response.ok) {
        const data = await response.json()
        setNoteContent(data.content || '')
      } else {
        setNoteContent('Failed to load note content')
      }
    } catch (error) {
      console.error('Error loading note:', error)
      setNoteContent('Failed to load note content')
    } finally {
      setLoadingNote(false)
    }
  }

  const handleCopyNote = () => {
    navigator.clipboard.writeText(noteContent)
    alert('Note content copied to clipboard!')
  }

  const handleCloseNote = () => {
    setSelectedNote(null)
    setNoteContent('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{client.clientName}</h2>
                <p className="text-sm text-muted-foreground">
                  Added {new Date(client.dateAdded).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(client.clientName)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b -mb-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-2 px-2 font-medium text-sm transition-colors ${
                activeTab === 'info'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Information
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`pb-2 px-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'projects'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Projects
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {projects.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-2 px-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'notes'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Notes
              <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                {notes.filter((n: any) => !n.name?.endsWith('.placeholder')).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-2 px-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Reports
              <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                {reports.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Industry</label>
                    <Input
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false)
                      setFormData(client)
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                  </div>
                </>
              ) : (
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{client.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{client.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">{client.address || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg">
                    <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Industry</p>
                      <p className="text-sm text-muted-foreground">{client.industry || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Client Since</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(client.dateAdded).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  {client.sharedWith && (
                    <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg">
                      <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Shared With</p>
                        <p className="text-sm text-muted-foreground">{client.sharedWith}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
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
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Client Notes ({notes.length})</h3>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notes found for this client</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notes
                    .filter((note: any) => !note.name?.endsWith('.placeholder'))
                    .map((note: any, index: number) => {
                      // Use the title from API if available, otherwise parse filename
                      const noteTitle = note.title || note.name?.split('/').pop() || 'Untitled Note'
                      const noteDate = note.uploadedAt ? new Date(note.uploadedAt).toLocaleDateString() : ''

                      return (
                        <div
                          key={note.name || index}
                          className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onClick={() => handleOpenNote(note)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{noteTitle}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{noteDate}</p>
                            </div>
                            <FileText className="w-5 h-5 text-green-500" />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Shared Reports ({reports.length})</h3>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Note Viewer Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selectedNote.title || 'Note'}</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyNote}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCloseNote}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingNote ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{noteContent}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
