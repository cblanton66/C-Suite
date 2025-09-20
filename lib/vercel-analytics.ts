"use client"
import { track } from '@vercel/analytics'

// User Behavior Event Types
export const AnalyticsEvents = {
  // Authentication Events
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Chat Events
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_SESSION_STARTED: 'chat_session_started',
  CHAT_MESSAGE_BOOKMARKED: 'chat_message_bookmarked',
  CHAT_MESSAGE_COPIED: 'chat_message_copied',
  CHAT_CONVERSATION_EXPORTED: 'chat_conversation_exported',
  
  // File Upload Events
  FILE_UPLOAD_STARTED: 'file_upload_started',
  FILE_UPLOAD_COMPLETED: 'file_upload_completed',
  FILE_UPLOAD_FAILED: 'file_upload_failed',
  
  // Navigation Events
  PAGE_VIEW: 'page_view',
  QUICK_START_GUIDE_OPENED: 'quick_start_guide_opened',
  ADMIN_PANEL_ACCESSED: 'admin_panel_accessed',
  
  // Feature Usage
  VOICE_INPUT_USED: 'voice_input_used',
  SEARCH_PERFORMED: 'search_performed',
  THEME_CHANGED: 'theme_changed',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  
  // Business Intelligence
  ANALYTICS_CLEARED: 'analytics_cleared',
  TRAINING_ROOM_TOGGLED: 'training_room_toggled',
} as const

type AnalyticsEventType = typeof AnalyticsEvents[keyof typeof AnalyticsEvents]

// Enhanced analytics tracking with user context
export class VercelAnalytics {
  private static getUserContext() {
    if (typeof window === 'undefined') return {}
    
    try {
      const userEmail = localStorage.getItem('peaksuite_user_email')
      const userPermissions = localStorage.getItem('peaksuite_user_permissions')
      
      return {
        user_email: userEmail ? userEmail.substring(0, 3) + '***' : 'anonymous', // Anonymized
        user_permissions: userPermissions ? JSON.parse(userPermissions) : ['chat'],
        timestamp: new Date().toISOString(),
      }
    } catch {
      return { user_email: 'anonymous', user_permissions: ['chat'] }
    }
  }

  // Track user behavior events
  static trackEvent(event: AnalyticsEventType, properties: Record<string, any> = {}) {
    if (typeof window === 'undefined') return
    
    const userContext = this.getUserContext()
    
    track(event, {
      ...properties,
      ...userContext,
    })
    
    console.log(`Analytics: ${event}`, { ...properties, ...userContext })
  }

  // Convenience methods for common events
  static trackLogin(method: 'email' | 'code', userPermissions: string[]) {
    this.trackEvent(AnalyticsEvents.USER_LOGIN, {
      method,
      permissions: userPermissions.join(','),
    })
  }

  static trackLogout() {
    this.trackEvent(AnalyticsEvents.USER_LOGOUT)
  }

  static trackChatMessage(messageLength: number, hasFiles: boolean) {
    this.trackEvent(AnalyticsEvents.CHAT_MESSAGE_SENT, {
      message_length: messageLength,
      has_attachments: hasFiles,
    })
  }

  static trackFileUpload(fileType: string, fileSize: number, success: boolean) {
    const event = success ? AnalyticsEvents.FILE_UPLOAD_COMPLETED : AnalyticsEvents.FILE_UPLOAD_FAILED
    this.trackEvent(event, {
      file_type: fileType,
      file_size_kb: Math.round(fileSize / 1024),
    })
  }

  static trackPageView(page: string, timeSpent?: number) {
    this.trackEvent(AnalyticsEvents.PAGE_VIEW, {
      page,
      time_spent_seconds: timeSpent ? Math.round(timeSpent / 1000) : undefined,
    })
  }

  static trackFeatureUsage(feature: string, details: Record<string, any> = {}) {
    this.trackEvent(feature as AnalyticsEventType, details)
  }

  static trackConversationExport(format: 'text' | 'html' | 'markdown' | 'email') {
    this.trackEvent(AnalyticsEvents.CHAT_CONVERSATION_EXPORTED, {
      export_format: format,
    })
  }

  static trackAdminAction(action: string, details: Record<string, any> = {}) {
    this.trackEvent(action as AnalyticsEventType, {
      admin_action: action,
      ...details,
    })
  }
}