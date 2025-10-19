"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Phone, MapPin, Briefcase, Calendar, Users, Edit2 } from "lucide-react"
import { Client } from "@/types/client"
import { toast } from "sonner"

interface ClientInfoTabProps {
  client: Client
  isEditing: boolean
  onEditingChange: (isEditing: boolean) => void
  onUpdate: (client: Partial<Client>) => void
  userEmail?: string
  workspaceOwner?: string
}

export function ClientInfoTab({
  client,
  isEditing,
  onEditingChange,
  onUpdate,
  userEmail,
  workspaceOwner
}: ClientInfoTabProps) {
  const [formData, setFormData] = useState(client)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [newClientName, setNewClientName] = useState(client.clientName)
  const [isRenaming, setIsRenaming] = useState(false)

  const handleSave = () => {
    onUpdate(formData)
    onEditingChange(false)
  }

  const handleCancel = () => {
    onEditingChange(false)
    setFormData(client)
  }

  const handleRenameClient = async () => {
    if (!newClientName.trim()) {
      toast.error('Client name cannot be empty')
      return
    }

    if (newClientName.trim() === client.clientName) {
      toast.info('Client name is unchanged')
      setShowRenameModal(false)
      return
    }

    setIsRenaming(true)
    try {
      const response = await fetch('/api/rename-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          oldClientName: client.clientName,
          newClientName: newClientName.trim(),
          userEmail,
          workspaceOwner
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(data.message || 'Client renamed successfully!')
        onUpdate({ clientName: newClientName.trim() })
        setShowRenameModal(false)
        // Reload the page to refresh all references
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        toast.error(data.error || 'Failed to rename client')
      }
    } catch (error) {
      console.error('Error renaming client:', error)
      toast.error('Failed to rename client. Please try again.')
    } finally {
      setIsRenaming(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Rename Client Button */}
        {!isEditing && (
          <div className="flex justify-end mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewClientName(client.clientName)
                setShowRenameModal(true)
              }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Rename Client
            </Button>
          </div>
        )}

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
              <Button variant="outline" onClick={handleCancel}>
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

      {/* Rename Client Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Rename Client</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will rename the client and move all associated files (projects, notes, reports) to a new folder.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Name</label>
                <Input value={client.clientName} disabled className="bg-gray-100 dark:bg-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Name *</label>
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Enter new client name"
                  disabled={isRenaming}
                />
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> This operation may take a few moments if there are many files. The page will reload when complete.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRenameModal(false)
                  setNewClientName(client.clientName)
                }}
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button onClick={handleRenameClient} disabled={isRenaming}>
                {isRenaming ? 'Renaming...' : 'Rename Client'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
