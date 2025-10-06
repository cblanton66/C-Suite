"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, User, Clock, Monitor, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

interface LoginRecord {
  id: string
  user_email: string
  user_name: string | null
  workspace_owner: string
  ip_address: string
  user_agent: string
  login_timestamp: string
}

export default function LoginHistoryPage() {
  const router = useRouter()
  const [logins, setLogins] = useState<LoginRecord[]>([])
  const [filteredLogins, setFilteredLogins] = useState<LoginRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchLoginHistory()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = logins.filter(login =>
        login.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        login.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredLogins(filtered)
    } else {
      setFilteredLogins(logins)
    }
  }, [searchTerm, logins])

  const fetchLoginHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/login-history?limit=200')
      const data = await response.json()

      if (data.success) {
        setLogins(data.logins || [])
        setFilteredLogins(data.logins || [])
      }
    } catch (error) {
      console.error('Error fetching login history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Login History</h1>
              <p className="text-gray-400">View all user login activity</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-500">{filteredLogins.length}</p>
              <p className="text-sm text-gray-400">Total Logins</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 mb-6 bg-gray-800/50 border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700"
            />
          </div>
        </Card>

        {/* Login Records */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading login history...</p>
          </div>
        ) : filteredLogins.length === 0 ? (
          <Card className="p-12 text-center bg-gray-800/50 border-gray-700">
            <p className="text-gray-400">
              {searchTerm ? 'No logins found matching your search' : 'No login history yet'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredLogins.map((login) => (
              <Card
                key={login.id}
                className="p-4 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{login.user_name || 'Unknown User'}</p>
                      <p className="text-sm text-gray-400">{login.user_email}</p>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">
                        {formatDate(login.login_timestamp)}
                      </p>
                      <p className="text-xs text-gray-400">Login Time</p>
                    </div>
                  </div>

                  {/* Browser/Device */}
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{getBrowserInfo(login.user_agent)}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">
                        {login.user_agent}
                      </p>
                    </div>
                  </div>

                  {/* IP Address */}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{login.ip_address}</p>
                      <p className="text-xs text-gray-400">IP Address</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
