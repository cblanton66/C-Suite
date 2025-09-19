"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { FastTooltip } from "@/components/fast-tooltip"

interface AdminNavToggleProps {
  userEmail?: string
  isAdmin?: boolean
}

interface AdminSettings {
  trainingRoomVisible: boolean
  lastUpdated: string
  updatedBy: string
}

export function AdminNavToggle({ userEmail, isAdmin }: AdminNavToggleProps) {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [updating, setUpdating] = useState(false)

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
  )
}