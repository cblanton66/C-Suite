"use client"
import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getAnalyticsData, clearAnalyticsData } from '@/lib/analytics'
import { BarChart3, Clock, Users, Eye, Trash2, Lock, Settings, EyeOff } from 'lucide-react'
import { usePageAnalytics } from "@/hooks/use-analytics"
import { SessionManager } from "@/lib/session-manager"
import { useRouter } from 'next/navigation'

interface PageView {
  userCode: string;
  page: string;
  timestamp: string;
  sessionId: string;
  timeSpent?: number;
}

interface UserStats {
  userCode: string;
  totalPageViews: number;
  totalTimeSpent: number;
  pages: { [page: string]: { views: number; timeSpent: number } };
  lastActivity: string;
}

export default function AdminPage() {
  usePageAnalytics('admin')
  const router = useRouter()
  
  const [analytics, setAnalytics] = useState<{ pageViews: PageView[] }>({ pageViews: [] })
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [trainingRoomSettings, setTrainingRoomSettings] = useState<{trainingRoomVisible: boolean} | null>(null)
  const [updatingSettings, setUpdatingSettings] = useState(false)

  // Check authorization
  useEffect(() => {
    const session = SessionManager.getSession()
    if (!session) {
      router.push('/')
      return
    }
    
    const hasAdminAccess = session.permissions.includes('admin')
    setUserPermissions(session.permissions)
    setUserEmail(session.userEmail)
    setIsAuthorized(hasAdminAccess)
    
    if (!hasAdminAccess) {
      setTimeout(() => router.push('/'), 2000) // Redirect after showing error
    }
  }, [router])

  const loadData = () => {
    const data = getAnalyticsData()
    setAnalytics(data)
    
    // Process data into user stats
    const userMap = new Map<string, UserStats>()
    
    data.pageViews.forEach(pv => {
      if (!userMap.has(pv.userCode)) {
        userMap.set(pv.userCode, {
          userCode: pv.userCode,
          totalPageViews: 0,
          totalTimeSpent: 0,
          pages: {},
          lastActivity: pv.timestamp
        })
      }
      
      const user = userMap.get(pv.userCode)!
      user.totalPageViews++
      
      if (!user.pages[pv.page]) {
        user.pages[pv.page] = { views: 0, timeSpent: 0 }
      }
      user.pages[pv.page].views++
      
      if (pv.timeSpent) {
        user.totalTimeSpent += pv.timeSpent
        user.pages[pv.page].timeSpent += pv.timeSpent
      }
      
      if (pv.timestamp > user.lastActivity) {
        user.lastActivity = pv.timestamp
      }
    })
    
    setUserStats(Array.from(userMap.values()).sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    ))
  }

  useEffect(() => {
    if (isAuthorized) {
      loadData()
    }
  }, [isAuthorized])

  // Fetch training room settings
  const fetchTrainingRoomSettings = async () => {
    try {
      const response = await fetch('/api/admin-settings')
      const data = await response.json()
      
      if (data.success) {
        setTrainingRoomSettings(data.settings)
      }
    } catch (err) {
      console.error('Error fetching training room settings:', err)
    }
  }

  // Toggle training room visibility
  const toggleTrainingRoom = async () => {
    if (!trainingRoomSettings || !userEmail) return

    try {
      setUpdatingSettings(true)

      const response = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainingRoomVisible: !trainingRoomSettings.trainingRoomVisible,
          userEmail
        })
      })

      const data = await response.json()

      if (data.success) {
        setTrainingRoomSettings(data.settings)
      }
    } catch (err) {
      console.error('Error updating training room settings:', err)
    } finally {
      setUpdatingSettings(false)
    }
  }

  // Load training room settings when authorized
  useEffect(() => {
    if (isAuthorized) {
      fetchTrainingRoomSettings()
    }
  }, [isAuthorized])

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      clearAnalyticsData()
      loadData()
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Show loading while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  // Show access denied for non-admin users
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You need admin permissions to access this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting you back to the main page...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Beta User Analytics</h1>
            <p className="text-muted-foreground">Track user activity and engagement</p>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleClearData}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Data
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{userStats.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Page Views</p>
                <p className="text-2xl font-bold">{analytics.pageViews.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Time Spent</p>
                <p className="text-2xl font-bold">
                  {formatDuration(userStats.reduce((sum, user) => sum + user.totalTimeSpent, 0))}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Time/User</p>
                <p className="text-2xl font-bold">
                  {userStats.length > 0 
                    ? formatDuration(Math.round(userStats.reduce((sum, user) => sum + user.totalTimeSpent, 0) / userStats.length))
                    : '0s'
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Admin Controls Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Admin Controls</h2>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Quick-Start Guide Visibility</h3>
                <p className="text-muted-foreground">
                  Control whether the Quick-Start Guide button appears in the navigation for all users
                </p>
              </div>
              <Button
                variant="outline"
                onClick={toggleTrainingRoom}
                disabled={updatingSettings || !trainingRoomSettings}
                className={`flex items-center gap-2 min-w-24 ${
                  trainingRoomSettings?.trainingRoomVisible 
                    ? 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700' 
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                }`}
              >
                {updatingSettings ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : trainingRoomSettings?.trainingRoomVisible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                <span>
                  {trainingRoomSettings?.trainingRoomVisible ? 'Visible' : 'Hidden'}
                </span>
              </Button>
            </div>
          </Card>
        </div>

        {/* User Details */}
        <div className="space-y-6">
          {userStats.map((user) => (
            <Card key={user.userCode} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{user.userCode}</h3>
                  <p className="text-muted-foreground">
                    Last active: {formatDate(user.lastActivity)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{user.totalPageViews} views</p>
                  <p className="text-muted-foreground">{formatDuration(user.totalTimeSpent)} total</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(user.pages).map(([page, stats]) => (
                  <div key={page} className="bg-muted/50 p-3 rounded-lg">
                    <h4 className="font-medium text-foreground capitalize mb-1">{page} Page</h4>
                    <div className="text-sm text-muted-foreground">
                      <p>{stats.views} views</p>
                      <p>{formatDuration(stats.timeSpent)} spent</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {userStats.length === 0 && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground">
              Start using the app with access codes to see user analytics here.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}