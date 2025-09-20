interface SessionData {
  userName: string
  userEmail: string
  permissions: string[]
  assistantName: string
  loginTime: number
  lastActivity: number
  expiresAt: number
}

const SESSION_DURATION = 60 * 60 * 1000 // 60 minutes in milliseconds
const SESSION_KEY = 'peaksuite_session'

export class SessionManager {
  static createSession(userName: string, userEmail: string, permissions: string[], assistantName: string = 'Piper'): void {
    const now = Date.now()
    const sessionData: SessionData = {
      userName,
      userEmail,
      permissions,
      assistantName,
      loginTime: now,
      lastActivity: now,
      expiresAt: now + SESSION_DURATION
    }
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
    
    // Also store in the old format for backward compatibility during transition
    localStorage.setItem('peaksuite_user_name', userName)
    localStorage.setItem('peaksuite_user_email', userEmail)
    localStorage.setItem('peaksuite_user_permissions', JSON.stringify(permissions))
  }

  static getSession(): SessionData | null {
    try {
      if (typeof window === 'undefined') return null
      
      const sessionJson = localStorage.getItem(SESSION_KEY)
      console.log('SessionManager.getSession - sessionJson:', sessionJson)
      
      if (!sessionJson) {
        console.log('SessionManager.getSession - no session found')
        return null
      }

      const session: SessionData = JSON.parse(sessionJson)
      const now = Date.now()

      console.log('SessionManager.getSession - session expires at:', new Date(session.expiresAt))
      console.log('SessionManager.getSession - current time:', new Date(now))

      // Check if session has expired
      if (now > session.expiresAt) {
        console.log('SessionManager.getSession - session expired, clearing')
        this.clearSession()
        return null
      }

      // Update last activity and extend session
      session.lastActivity = now
      session.expiresAt = now + SESSION_DURATION
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))

      console.log('SessionManager.getSession - returning valid session for:', session.userEmail)
      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  static updateActivity(): void {
    const session = this.getSession()
    if (session) {
      const now = Date.now()
      session.lastActivity = now
      session.expiresAt = now + SESSION_DURATION
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }
  }

  static isSessionValid(): boolean {
    return this.getSession() !== null
  }

  static clearSession(): void {
    // Remove new session format
    localStorage.removeItem(SESSION_KEY)
    
    // Remove old format for clean transition
    localStorage.removeItem('peaksuite_user_name')
    localStorage.removeItem('peaksuite_user_email') 
    localStorage.removeItem('peaksuite_user_permissions')
    
    // Keep chat data but remove session data
    // Don't remove chat sessions or bookmarks as users want to keep those
  }

  static getTimeUntilExpiry(): number {
    const session = this.getSession()
    if (!session) return 0
    
    return Math.max(0, session.expiresAt - Date.now())
  }

  static formatTimeRemaining(): string {
    const timeLeft = this.getTimeUntilExpiry()
    if (timeLeft === 0) return 'Expired'
    
    const hours = Math.floor(timeLeft / (60 * 60 * 1000))
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // Migration helper - convert old sessionStorage to new localStorage format
  static migrateOldSession(): boolean {
    try {
      // Check for old session data
      const userName = sessionStorage.getItem('peaksuite_user_name') || localStorage.getItem('peaksuite_user_name')
      const userEmail = sessionStorage.getItem('peaksuite_user_email') || localStorage.getItem('peaksuite_user_email')  
      const permissionsJson = sessionStorage.getItem('peaksuite_user_permissions') || localStorage.getItem('peaksuite_user_permissions')
      
      if (userName && userEmail && permissionsJson) {
        const permissions = JSON.parse(permissionsJson)
        this.createSession(userName, userEmail, permissions)
        
        // Clean up old session storage
        sessionStorage.removeItem('peaksuite_user_name')
        sessionStorage.removeItem('peaksuite_user_email')
        sessionStorage.removeItem('peaksuite_user_permissions')
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error migrating session:', error)
      return false
    }
  }
}