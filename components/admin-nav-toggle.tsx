"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, MessageSquareText, X, Save } from "lucide-react"
import { FastTooltip } from "@/components/fast-tooltip"

interface AdminNavToggleProps {
  userEmail?: string
  isAdmin?: boolean
}

interface AdminSettings {
  trainingRoomVisible: boolean
  dynamicMessage: string
  lastUpdated: string
  updatedBy: string
}

export function AdminNavToggle({ userEmail, isAdmin }: AdminNavToggleProps) {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageInput, setMessageInput] = useState('')

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin-settings')
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.settings)
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    }
  }

  const toggleTrainingRoom = async () => {
    if (!settings) return

    try {
      setUpdating(true)

      const response = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainingRoomVisible: !settings.trainingRoomVisible,
          userEmail
        })
      })

      const data = await response.json()

      if (data.success) {
        setSettings(data.settings)
        // Reload the page to update the navigation
        window.location.reload()
      }
    } catch (err) {
      console.error('Error updating settings:', err)
    } finally {
      setUpdating(false)
    }
  }

  const updateDynamicMessage = async () => {
    if (!settings || !messageInput.trim()) return

    try {
      setUpdating(true)

      const response = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dynamicMessage: messageInput.trim(),
          userEmail
        })
      })

      const data = await response.json()

      if (data.success) {
        setSettings(data.settings)
        setShowMessageModal(false)
        setMessageInput('')
        // Reload the page to update the message display
        window.location.reload()
      }
    } catch (err) {
      console.error('Error updating dynamic message:', err)
    } finally {
      setUpdating(false)
    }
  }

  const openMessageModal = () => {
    setMessageInput(settings?.dynamicMessage || '')
    setShowMessageModal(true)
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  // Only show to admin users - moved after hooks
  if (!isAdmin || !userEmail) {
    return null
  }

  if (!settings) {
    return null
  }

  const tooltipText = `Training Room is ${settings.trainingRoomVisible ? 'visible' : 'hidden'}. Click to ${settings.trainingRoomVisible ? 'hide' : 'show'}.`

  return (
    <>
      <div className="flex items-center gap-2">
        <FastTooltip content={tooltipText}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTrainingRoom}
            disabled={updating}
            className={`h-8 w-8 p-0 ${
              settings.trainingRoomVisible 
                ? 'text-green-600 hover:text-green-700' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {updating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : settings.trainingRoomVisible ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
        </FastTooltip>
        
        <FastTooltip content="Edit welcome message">
          <Button
            variant="ghost"
            size="sm"
            onClick={openMessageModal}
            disabled={updating}
            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
          >
            <MessageSquareText className="w-4 h-4" />
          </Button>
        </FastTooltip>
      </div>

      {/* Dynamic Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMessageModal(false)}
          />
          
          {/* Modal */}
          <Card className="relative w-full max-w-md mx-4 p-6 shadow-2xl border-2 border-primary/20">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMessageModal(false)}
              className="absolute right-2 top-2 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <MessageSquareText className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Edit Welcome Message</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Welcome Message
                </label>
                <Input
                  id="message"
                  type="text"
                  placeholder="Enter welcome message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="w-full"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This message appears at the top of the chat page when users start a new conversation.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={updateDynamicMessage}
                  disabled={updating || !messageInput.trim()}
                  className="flex-1"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Message
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowMessageModal(false)}
                  disabled={updating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}