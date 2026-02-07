"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
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
  ChevronRight,
  ChevronDown
} from "lucide-react"
import { ClientProjectsTab } from "@/components/client-detail/client-projects-tab"
import { ClientNotesTab } from "@/components/client-detail/client-notes-tab"
import { ClientReportsTab } from "@/components/client-detail/client-reports-tab"
import { ClientInfoTab } from "@/components/client-detail/client-info-tab"
import { ClientSharingTab } from "@/components/client-detail/client-sharing-tab"
import { Client } from "@/types/client"

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
  const [loading, setLoading] = useState(false)
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [showClientDetail, setShowClientDetail] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showDropdown, setShowDropdown] = useState(true)

  // Fetch recent clients on initial open
  const fetchClients = async (recentOnly = false) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/user-clients?userEmail=${encodeURIComponent(userEmail)}&workspaceOwner=${encodeURIComponent(workspaceOwner)}&recentOnly=${recentOnly}`
      )
      const data = await response.json()

      if (data.success) {
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch recent clients when modal opens
  useEffect(() => {
    if (isOpen && !searchTerm) {
      fetchClients(true) // Get recent 6
    }
  }, [isOpen])

  // Debounced search when user types
  useEffect(() => {
    if (!searchTerm.trim()) {
      // When search is cleared, go back to showing recent clients
      fetchClients(true)
      setShowDropdown(true)
      return
    }

    const timeoutId = setTimeout(() => {
      fetchClients(false) // Get all clients for search
      setShowDropdown(true)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Handle dropdown toggle
  const handleDropdownToggle = () => {
    if (!showDropdown) {
      fetchClients(true) // Get recent 6
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
      // Don't clear clients immediately to avoid flicker
      setTimeout(() => {
        if (!showDropdown) setClients([])
      }, 300)
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
        toast.success('Client created successfully!')
        await fetchClients()
        setShowNewClientModal(false)
      } else {
        toast.error(data.error || 'Failed to create client')
      }
    } catch (error) {
      console.error('Error creating client:', error)
      toast.error('Failed to create client')
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
        toast.success('Client updated successfully!')
        await fetchClients()
        setShowClientDetail(false)
        setSelectedClient(null)
      } else {
        toast.error(data.error || 'Failed to update client')
      }
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error('Failed to update client')
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
        toast.success('Client deleted successfully!')
        await fetchClients()
        setShowClientDetail(false)
        setSelectedClient(null)
      } else {
        toast.error(data.error || 'Failed to delete client')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    }
  }

  // Filter clients on frontend only when searching
  // (API already returns recent-only when not searching)
  const filteredClients = searchTerm.trim()
    ? clients.filter(client =>
        client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : clients

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
        onCloseAll={onClose}
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg w-full sm:max-w-6xl flex flex-col" style={{ maxHeight: 'min(90vh, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 20px))' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Client Management</h2>
              <p className="text-sm text-muted-foreground">
                {searchTerm.trim() ? `Search Results • ${filteredClients.length} found` : 'Search or browse recent clients'}
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
        <div className="p-4 sm:p-6 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
            <Input
              placeholder="Search clients by name, email, or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-gray-900 dark:bg-gray-900 border-gray-700 dark:border-gray-700 text-white placeholder:text-gray-400"
            />
            <button
              onClick={handleDropdownToggle}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors z-10"
              title={showDropdown ? "Hide recent clients" : "Show recent clients"}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown list of recent clients */}
            {showDropdown && clients.length > 0 && !searchTerm && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                {clients.map((client) => (
                  <button
                    key={client.clientName}
                    onClick={async () => {
                      setSelectedClient(client)
                      setShowClientDetail(true)
                      setShowDropdown(false)

                      // Update last_accessed timestamp
                      try {
                        await fetch('/api/user-clients', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            clientName: client.clientName,
                            userEmail,
                            workspaceOwner
                          })
                        })
                      } catch (error) {
                        console.error('Failed to update last accessed:', error)
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-medium">{client.clientName}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Client List - Only show when searching */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {searchTerm ? (
            loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground mt-4">Searching clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">No clients found matching your search</p>
              </div>
            ) : (
            <div className="grid gap-4">
              {filteredClients.map((client) => {
                return (
                  <Card
                    key={client.clientName}
                    className="p-4 hover:shadow-lg transition-all cursor-pointer bg-gray-800/50 dark:bg-gray-800/50 border-gray-700 dark:border-gray-700"
                    onClick={async () => {
                      setSelectedClient(client)
                      setShowClientDetail(true)

                      // Update last_accessed timestamp
                      try {
                        await fetch('/api/user-clients', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            clientName: client.clientName,
                            userEmail,
                            workspaceOwner
                          })
                        })
                      } catch (error) {
                        console.error('Failed to update last accessed:', error)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{client.clientName}</h3>
                          {Array.isArray(client.sharedWith) && client.sharedWith.length > 0 && (
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
            )
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">
                Search for a client or click the arrow to see recent clients
              </p>
              <Button
                onClick={() => setShowNewClientModal(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Client
              </Button>
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
      toast.error('Client name is required')
      return
    }
    onCreate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg w-full sm:max-w-2xl flex flex-col" style={{ maxHeight: 'min(90vh, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 20px))' }}>
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 pb-2 border-b shrink-0">
          <h2 className="text-xl font-semibold">New Client</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

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

        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end gap-2 p-4 sm:p-6 pt-4 border-t shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
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
  onCloseAll,
  onUpdate,
  onDelete,
  userEmail,
  workspaceOwner,
  onLoadThread,
  onEditContent
}: {
  client: Client
  onClose: () => void
  onCloseAll: () => void
  onUpdate: (client: Partial<Client>) => void
  onDelete: (clientName: string) => void
  userEmail: string
  workspaceOwner: string
  onLoadThread?: (messages: any[], threadData: { threadId: string; filePath: string; metadata: any }) => void
  onEditContent?: (reportId: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'projects' | 'notes' | 'reports' | 'sharing'>('info')
  const [isEditing, setIsEditing] = useState(false)
  const [counts, setCounts] = useState({ projects: 0, notes: 0, reports: 0 })
  const [loadingCounts, setLoadingCounts] = useState(true)

  // Fetch counts on mount
  useEffect(() => {
    const fetchCounts = async () => {
      setLoadingCounts(true)
      try {
        const clientOwner = client.workspaceOwner || workspaceOwner
        const clientSlug = client.clientName.toLowerCase().replace(/\s+/g, '-')

        // Fetch all counts in parallel
        const [projectsRes, notesRes, reportsRes] = await Promise.all([
          fetch(`/api/list-threads?userId=${encodeURIComponent(userEmail)}&workspaceOwner=${encodeURIComponent(clientOwner)}&includeArchive=false&clientName=${encodeURIComponent(client.clientName)}`),
          fetch(`/api/list-files?userEmail=${encodeURIComponent(userEmail)}&workspaceOwner=${encodeURIComponent(clientOwner)}&folder=client-files/${clientSlug}/notes`),
          fetch(`/api/my-reports?userEmail=${encodeURIComponent(userEmail)}&includeArchived=false&clientName=${encodeURIComponent(client.clientName)}`)
        ])

        const [projectsData, notesData, reportsData] = await Promise.all([
          projectsRes.json(),
          notesRes.json(),
          reportsRes.json()
        ])

        // Filter out placeholder files from notes
        const actualNotes = (notesData.files || []).filter((file: any) =>
          file.name && !file.name.endsWith('.placeholder')
        )

        setCounts({
          projects: projectsData.threads?.length || 0,
          notes: actualNotes.length,
          reports: reportsData.reports?.length || 0
        })
      } catch (error) {
        console.error('Error fetching counts:', error)
      } finally {
        setLoadingCounts(false)
      }
    }

    fetchCounts()
  }, [client.clientName, userEmail, workspaceOwner])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg w-full sm:max-w-4xl flex flex-col" style={{ maxHeight: 'min(90vh, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 20px))' }}>
        {/* Fixed Header */}
        <div className="p-4 sm:p-6 border-b shrink-0">
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
              {!loadingCounts && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'projects'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {counts.projects}
                </span>
              )}
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
              {!loadingCounts && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'notes'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {counts.notes}
                </span>
              )}
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
              {!loadingCounts && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'reports'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {counts.reports}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sharing')}
              className={`pb-2 px-2 font-medium text-sm transition-colors ${
                activeTab === 'sharing'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sharing
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {activeTab === 'info' && (
            <ClientInfoTab
              client={client}
              isEditing={isEditing}
              onEditingChange={setIsEditing}
              onUpdate={onUpdate}
              userEmail={userEmail}
              workspaceOwner={workspaceOwner}
            />
          )}

          {activeTab === 'projects' && (
            <ClientProjectsTab
              client={client}
              userEmail={userEmail}
              workspaceOwner={workspaceOwner}
              onLoadThread={onLoadThread}
              onCloseAll={onCloseAll}
            />
          )}

          {activeTab === 'notes' && (
            <ClientNotesTab
              client={client}
              userEmail={userEmail}
              workspaceOwner={workspaceOwner}
            />
          )}

          {activeTab === 'reports' && (
            <ClientReportsTab
              client={client}
              userEmail={userEmail}
              onCloseAll={onCloseAll}
            />
          )}

          {activeTab === 'sharing' && (
            <ClientSharingTab
              client={client}
              userEmail={userEmail}
              onUpdate={onUpdate}
            />
          )}
        </div>
      </div>
    </div>
  )
}
