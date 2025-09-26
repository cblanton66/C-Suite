import { useState, useEffect } from 'react'

interface AdminSettings {
  trainingRoomVisible: boolean
  videoDemoVisible: boolean
  dynamicMessage: string
  lastUpdated: string
  updatedBy: string
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin-settings')
        const data = await response.json()
        
        if (data.success && data.settings) {
          setSettings(data.settings)
        } else {
          setError('Failed to load settings')
        }
      } catch (err) {
        console.error('Error fetching admin settings:', err)
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { settings, loading, error }
}