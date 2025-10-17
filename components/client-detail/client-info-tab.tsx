"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Phone, MapPin, Briefcase, Calendar, Users } from "lucide-react"
import { Client } from "@/types/client"

interface ClientInfoTabProps {
  client: Client
  isEditing: boolean
  onEditingChange: (isEditing: boolean) => void
  onUpdate: (client: Partial<Client>) => void
}

export function ClientInfoTab({
  client,
  isEditing,
  onEditingChange,
  onUpdate
}: ClientInfoTabProps) {
  const [formData, setFormData] = useState(client)

  const handleSave = () => {
    onUpdate(formData)
    onEditingChange(false)
  }

  const handleCancel = () => {
    onEditingChange(false)
    setFormData(client)
  }

  return (
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
  )
}
