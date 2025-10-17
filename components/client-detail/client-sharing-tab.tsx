"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Client } from "@/types/client"

interface ClientSharingTabProps {
  client: Client
  userEmail: string
  onUpdate: (client: Partial<Client>) => void
}

export function ClientSharingTab({
  client,
  userEmail,
  onUpdate
}: ClientSharingTabProps) {
  const [newShareEmail, setNewShareEmail] = useState('')
  const [addingShare, setAddingShare] = useState(false)

  const handleAddShare = async () => {
    if (!newShareEmail.trim() || !client.id) return

    setAddingShare(true)
    try {
      const response = await fetch('/api/client-shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          sharedWithEmail: newShareEmail.trim(),
          sharedByEmail: userEmail
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Client shared with ${newShareEmail}`)
        setNewShareEmail('')
        // Update the client's sharedWith array
        const currentSharedWith = Array.isArray(client.sharedWith) ? client.sharedWith : []
        onUpdate({ ...client, sharedWith: [...currentSharedWith, newShareEmail.trim().toLowerCase()] })
      } else {
        toast.error(data.error || 'Failed to share client')
      }
    } catch (error) {
      console.error('Error sharing client:', error)
      toast.error('Failed to share client')
    } finally {
      setAddingShare(false)
    }
  }

  const handleRemoveShare = async (emailToRemove: string) => {
    if (!client.id) return

    try {
      const response = await fetch(
        `/api/client-shares?clientId=${encodeURIComponent(client.id)}&sharedWithEmail=${encodeURIComponent(emailToRemove)}&userEmail=${encodeURIComponent(userEmail)}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        toast.success(`Removed share with ${emailToRemove}`)
        // Update the client's sharedWith array
        const currentSharedWith = Array.isArray(client.sharedWith) ? client.sharedWith : []
        onUpdate({ ...client, sharedWith: currentSharedWith.filter(email => email !== emailToRemove) })
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to remove share')
      }
    } catch (error) {
      console.error('Error removing share:', error)
      toast.error('Failed to remove share')
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Share Client Access</h3>

      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-200">
          Share this client with other users to give them full access to view and edit client information, notes, projects, and reports.
        </p>
      </div>

      {/* Add new share */}
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter email address to share with..."
          value={newShareEmail}
          onChange={(e) => setNewShareEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddShare()
            }
          }}
        />
        <Button
          onClick={handleAddShare}
          disabled={!newShareEmail.trim() || addingShare}
        >
          {addingShare ? 'Adding...' : 'Share'}
        </Button>
      </div>

      {/* List of current shares */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Shared With</h4>
        {Array.isArray(client.sharedWith) && client.sharedWith.length > 0 ? (
          <div className="space-y-2">
            {client.sharedWith.map((email: string) => (
              <div
                key={email}
                className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveShare(email)}
                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>This client is not shared with anyone</p>
          </div>
        )}
      </div>
    </div>
  )
}
