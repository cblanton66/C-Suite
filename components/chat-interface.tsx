"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import Link from "next/link"
import { toast } from "sonner"

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Calculator, FileText, TrendingUp, Home, Paperclip, X, Upload, File, AlertCircle, Plus, History, DollarSign, BarChart3, PieChart, Target, Download, Share2, Edit3, Check, RotateCcw, Copy, CheckCheck, Bookmark, BookmarkCheck, Search, Mic, MicOff, LogOut, User, ChevronDown, Mail, Clipboard, FileDown, ChevronUp, MessageCircle, BookOpen, Bell, Printer, Users, UserCheck, Megaphone, AlertTriangle, Lightbulb, FolderOpen, Edit, CreditCard, Receipt, HelpCircle, StickyNote, Building2, Calendar, Trash2, MoreVertical, Briefcase, Sparkles } from "lucide-react"
import { FileUploadModal } from "@/components/file-upload-modal"
import { ChatHistoryModal } from "@/components/chat-history-modal"
import { BookmarksModal } from "@/components/bookmarks-modal"
import { FeedbackModal } from "@/components/feedback-modal"
import { CommunicationsModal } from "@/components/communications-modal"
import { ThreadSaveModal } from "@/components/thread-save-modal"
import { ThreadManagementModal } from "@/components/thread-management-modal"
import { AdminCommunicationsModal } from "@/components/admin-communications-modal"
import { ClientManagementModal } from "@/components/client-management-modal"
import { ClientAutocomplete } from "@/components/client-autocomplete"
import { PDFTextExtractorModal } from "@/components/pdf-text-extractor-modal"
import { ShareReportModal } from "@/components/share-report-modal"
import { MyReportsModal } from "@/components/my-reports-modal"
import { ReportDetailsModal } from "@/components/report-details-modal"
import { CustomInstructionsModal } from "@/components/custom-instructions-modal"
import { ActivityReportModal } from "@/components/activity-report-modal"
// import { FloatingChatCompanion } from "@/components/floating-chat-companion"
import { FastTooltip } from "@/components/fast-tooltip"
import { AdminNavToggle } from "@/components/admin-nav-toggle"
import { SessionManager } from "@/lib/session-manager"
import { VercelAnalytics } from "@/lib/vercel-analytics"

interface UploadedFile {
  name: string
  size: number
  type: string
  content?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  file?: UploadedFile
  files?: UploadedFile[]
  isBookmarked?: boolean
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  lastUpdated: Date
}

interface ApiStatus {
  hasApiKey: boolean
  status: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [workspaceOwner, setWorkspaceOwner] = useState<string | null>(null) // For team members
  const [assistantName, setAssistantName] = useState<string>('Piper')
  const [dynamicMessage, setDynamicMessage] = useState<string>('You Have the Advantage Today!')
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'Business Owner' | 'CPA' | 'Bookkeeper'>('Bookkeeper')
  const [userPermissions, setUserPermissions] = useState<string[]>(['chat'])
  const [selectedModel, setSelectedModel] = useState<'grok-4-0709' | 'grok-4-fast-reasoning'>('grok-4-fast-reasoning')
  const [searchMyHistory, setSearchMyHistory] = useState(false)

  // Get time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<string>('')
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showPDFExtractor, setShowPDFExtractor] = useState(false)
  const [showCommunications, setShowCommunications] = useState(false)
  const [showAdminCommunications, setShowAdminCommunications] = useState(false)
  const [communicationsCount, setCommunicationsCount] = useState(0)
  const [adminFeedbackCount, setAdminFeedbackCount] = useState(0)
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<ChatSession[]>([])
  const [currentMessageSearch, setCurrentMessageSearch] = useState<string>('')
  const [showSearchBox, setShowSearchBox] = useState(false)
  const [showConversationSearch, setShowConversationSearch] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isInputExpanded, setIsInputExpanded] = useState(true)
  const [shareReportLoading, setShareReportLoading] = useState<string | null>(null)
  const [sharedReportUrl, setSharedReportUrl] = useState<string | null>(null)
  const [showShareReportModal, setShowShareReportModal] = useState(false)
  const [currentSharedReportTitle, setCurrentSharedReportTitle] = useState<string>('')
  const [showMyReportsModal, setShowMyReportsModal] = useState(false)
  const [showReportDetailsModal, setShowReportDetailsModal] = useState(false)
  const [showActivityReportModal, setShowActivityReportModal] = useState(false)
  const [currentMessageToShare, setCurrentMessageToShare] = useState<Message | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isHoveringBottom, setIsHoveringBottom] = useState(false)
  const [isInputPinned, setIsInputPinned] = useState(false)
  const [showPrivateNoteModal, setShowPrivateNoteModal] = useState(false)
  const [privateNoteModalKey, setPrivateNoteModalKey] = useState(0)
  const [privateNoteContent, setPrivateNoteContent] = useState('')
  const [privateNoteClient, setPrivateNoteClient] = useState('')
  const [privateNoteTitle, setPrivateNoteTitle] = useState('')
  const [showClientNotesModal, setShowClientNotesModal] = useState(false)
  const [showClientManagementModal, setShowClientManagementModal] = useState(false)
  const [showThreadSaveModal, setShowThreadSaveModal] = useState(false)
  const [showThreadManagementModal, setShowThreadManagementModal] = useState(false)
  const [openMessageMoreMenu, setOpenMessageMoreMenu] = useState<string | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const [showPromptsMenu, setShowPromptsMenu] = useState(false)
  const [showCustomInstructions, setShowCustomInstructions] = useState(false)
  const [showWelcomeMessageModal, setShowWelcomeMessageModal] = useState(false)
  const [savingPrivateNote, setSavingPrivateNote] = useState(false)
  const [forceHidden, setForceHidden] = useState(false)
  const [showProjectTooltip, setShowProjectTooltip] = useState(false)
  const [loadedThread, setLoadedThread] = useState<{
    threadId: string
    filePath: string
    metadata: any
  } | null>(null)
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout>()
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [inputHasFocus, setInputHasFocus] = useState(false)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const multiFileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const workspaceMenuRef = useRef<HTMLDivElement>(null)
  const promptsMenuRef = useRef<HTMLDivElement>(null)

  // Load chat history and current session on mount
  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then(setApiStatus)
      .catch(console.error)

    // Activity tracking to keep session alive
    const handleActivity = () => {
      SessionManager.updateActivity()
    }

    // Session validation interval (check every 5 minutes)
    const sessionCheckInterval = setInterval(() => {
      if (!SessionManager.isSessionValid()) {
        console.log('Session expired, redirecting to home')
        handleSignOut()
      }
    }, 5 * 60 * 1000) // 5 minutes

    // Activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Cleanup
    return () => {
      clearInterval(sessionCheckInterval)
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [])

  // Show project tooltip for new users after first message
  useEffect(() => {
    const tooltipDismissed = localStorage.getItem('projectTooltipDismissed')
    const userMessages = messages.filter(m => m.role === 'user')

    // Show tooltip if: not dismissed, has at least 1 user message, and not loading a thread
    if (!tooltipDismissed && userMessages.length >= 1 && !loadedThread) {
      // Show tooltip after a short delay so user sees their message first
      const timer = setTimeout(() => {
        setShowProjectTooltip(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [messages, loadedThread])

  const dismissProjectTooltip = () => {
    setShowProjectTooltip(false)
    localStorage.setItem('projectTooltipDismissed', 'true')
  }

  useEffect(() => {
    // Reset logout flag when component mounts
    setIsLoggingOut(false)
    
    // Load user data and validate session
    if (typeof window !== 'undefined') {
      // Get current session first
      let session = SessionManager.getSession()

      // Only migrate if no valid session exists
      if (!session) {
        SessionManager.migrateOldSession()
        session = SessionManager.getSession()
      }
      if (session) {
        setUserName(session.userName)
        setUserEmail(session.userEmail)
        setWorkspaceOwner(session.workspaceOwner) // Set workspace owner
        setUserPermissions(session.permissions)
        setAssistantName(session.assistantName || 'Piper')

        // Check for unread updates
        checkForUnreadUpdates(session.userEmail)
      } else {
        // Session expired or doesn't exist
        console.log('No valid session found')
        setUserPermissions(['chat']) // Default permission
      }
      
      const savedSessions = localStorage.getItem('peaksuiteai_chat_sessions')
      const savedCurrentSession = localStorage.getItem('peaksuiteai_current_session')
      
      if (savedSessions) {
        try {
          const sessions: ChatSession[] = JSON.parse(savedSessions).map((session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            lastUpdated: new Date(session.lastUpdated),
            messages: session.messages.map((msg: any) => ({
              ...msg,
              createdAt: new Date(msg.createdAt)
            }))
          }))
          setChatSessions(sessions)
        } catch (error) {
          console.error('Error loading chat sessions:', error)
        }
      }
      
      // Always start with a new conversation on login
      startNewChat()
    }
  }, [])

  // Function to fetch admin feedback count (moved to component scope for reusability)
  const fetchAdminFeedbackCount = async () => {
    if (userEmail && userPermissions.includes('admin')) {
      try {
        // Get the last time user read updates
        const readUpdatesKey = `read_updates_${userEmail}`
        const lastReadTime = localStorage.getItem(readUpdatesKey) || '2020-01-01T00:00:00.000Z'
        
        const response = await fetch(`/api/admin-feedback-count?userEmail=${encodeURIComponent(userEmail)}&lastReadTime=${encodeURIComponent(lastReadTime)}`)
        const data = await response.json()
        if (data.success) {
          setAdminFeedbackCount(data.totalUnreadCount || 0)
        }
      } catch (error) {
        console.error('Error fetching admin feedback count:', error)
      }
    }
  }

  // Check for unread updates and auto-open communications modal
  const checkForUnreadUpdates = async (userEmail: string) => {
    try {
      // Get the last time user read updates (or use a very old date if never read)
      const readUpdatesKey = `read_updates_${userEmail}`
      const lastReadTime = localStorage.getItem(readUpdatesKey) || '2020-01-01T00:00:00.000Z'
      
      console.log('Checking for unread updates...', { userEmail, lastReadTime })
      const response = await fetch(`/api/communications?userEmail=${encodeURIComponent(userEmail)}&type=all&lastLoginTime=${encodeURIComponent(lastReadTime)}`)
      const data = await response.json()
      
      console.log('Unread updates response:', data)
      
      if (data.success && data.unreadUpdatesCount > 0) {
        console.log(`Found ${data.unreadUpdatesCount} unread updates - opening modal`)
        // Small delay to ensure the UI is fully loaded
        setTimeout(() => {
          setShowCommunications(true)
        }, 1000)
      } else {
        console.log('No unread updates found')
      }
    } catch (error) {
      console.error('Error checking for unread updates:', error)
    }
  }

  // Check Training Room visibility and fetch communications count on component mount
  useEffect(() => {
    const checkAdminSettings = async () => {
      try {
        const response = await fetch('/api/admin-settings')
        const data = await response.json()
        if (data.success) {
          setDynamicMessage(data.settings.dynamicMessage || 'You Have the Advantage Today!')
        }
      } catch (error) {
        console.error('Error checking admin settings:', error)
        // Default to default message if there's an error
        setDynamicMessage('You Have the Advantage Today!')
      }
    }

    const fetchCommunicationsCount = async () => {
      if (userEmail) {
        try {
          const response = await fetch(`/api/communications?userEmail=${encodeURIComponent(userEmail)}&type=all`)
          const data = await response.json()
          if (data.success) {
            setCommunicationsCount(data.count || 0)
          }
        } catch (error) {
          console.error('Error fetching communications count:', error)
        }
      }
    }

    checkAdminSettings()
    fetchCommunicationsCount()
    fetchAdminFeedbackCount()
  }, [userEmail, userPermissions])

  // Load bookmarks on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBookmarks = localStorage.getItem('peaksuiteai_bookmarks')
      if (savedBookmarks) {
        try {
          const bookmarks: Message[] = JSON.parse(savedBookmarks).map((bookmark: any) => ({
            ...bookmark,
            createdAt: new Date(bookmark.createdAt)
          }))
          setBookmarkedMessages(bookmarks)
        } catch (error) {
          console.error('Error loading bookmarks:', error)
        }
      }
    }
  }, [])

  // Save bookmarks to localStorage whenever they change (but not during logout)
  useEffect(() => {
    if (typeof window !== 'undefined' && bookmarkedMessages.length >= 0 && !isLoggingOut) {
      localStorage.setItem('peaksuiteai_bookmarks', JSON.stringify(bookmarkedMessages))
    }
  }, [bookmarkedMessages, isLoggingOut])

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && chatSessions.length > 0) {
      localStorage.setItem('peaksuiteai_chat_sessions', JSON.stringify(chatSessions))
    }
  }, [chatSessions])

  // Save current session ID
  useEffect(() => {
    if (typeof window !== 'undefined' && currentSessionId) {
      localStorage.setItem('peaksuiteai_current_session', currentSessionId)
    }
  }, [currentSessionId])

  // Update current session when messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      updateCurrentSession()
    }
  }, [messages, currentSessionId])

  // Clear silence timeout helper
  const clearSilenceTimeout = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
  }

  // Auto-stop recording after silence
  const startSilenceTimeout = () => {
    clearSilenceTimeout()
    silenceTimeoutRef.current = setTimeout(() => {
      if (recognition && isListening) {
        recognition.stop()
      }
    }, 15000) // 15 seconds
  }

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true  // Keep listening continuously
        recognitionInstance.interimResults = true  // Show intermediate results
        recognitionInstance.lang = 'en-US'

        let finalTranscript = ''

        recognitionInstance.onstart = () => {
          setIsListening(true)
          finalTranscript = ''
          startSilenceTimeout()
        }

        recognitionInstance.onresult = (event) => {
          let interimTranscript = ''
          let newFinalTranscript = ''
          let hasNewSpeech = false
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              newFinalTranscript += transcript
              hasNewSpeech = true
            } else {
              interimTranscript += transcript
              if (transcript.trim().length > 0) {
                hasNewSpeech = true
              }
            }
          }
          
          // Reset silence timer when new speech is detected
          if (hasNewSpeech) {
            startSilenceTimeout()
          }
          
          // Update input with new final transcript only
          if (newFinalTranscript) {
            const newText = newFinalTranscript.trim()
            setInput(prev => {
              const baseText = prev || ''
              // Only add if this specific new text isn't already at the end
              if (!baseText.endsWith(newText)) {
                return baseText ? baseText + ' ' + newText : newText
              }
              return baseText
            })
            // Update the accumulated final transcript
            finalTranscript += newFinalTranscript
          }
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
          finalTranscript = ''
          clearSilenceTimeout()
        }

        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          if (event.error !== 'no-speech') {
            setIsListening(false)
            clearSilenceTimeout()
          }
        }

        setRecognition(recognitionInstance)
      }
    }
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimeout()
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const toggleSpeechRecognition = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please try Chrome, Safari, or Edge.')
      return
    }

    if (isListening) {
      recognition.stop()
      clearSilenceTimeout()
    } else {
      try {
        recognition.start()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        setIsListening(false)
        clearSilenceTimeout()
      }
    }
  }

  const handlePinToggle = () => {
    setIsInputPinned(!isInputPinned)
    // No complex scrolling - keep it simple!
  }

  const handleSignOut = () => {
    // Track logout
    VercelAnalytics.trackLogout()
    
    // Set logout flag to prevent bookmark saving
    setIsLoggingOut(true)
    
    // Clear session using SessionManager
    if (typeof window !== 'undefined') {
      SessionManager.clearSession()
      // Keep chat data - users may want to see their conversations when they log back in
      // localStorage.removeItem('peaksuiteai_chat_sessions')
      // localStorage.removeItem('peaksuiteai_current_session')
      // localStorage.removeItem('peaksuiteai_bookmarks')
    }
    
    // Reset state
    setUserName(null)
    setUserEmail(null)
    setUserPermissions(['chat'])
    setAssistantName('Piper')
    setChatSessions([])
    setMessages([])
    setBookmarkedMessages([])
    setCurrentSessionId('')
    setUploadedFile(null)
    setUploadedFiles([])
    setUploadError(null)
    
    // Navigate back to landing page
    window.location.href = '/'
  }

  const startNewChat = async () => {
    const newSessionId = Date.now().toString()
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    setChatSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSessionId)
    setMessages([])
    setUploadedFile(null)
    setUploadedFiles([])
    setUploadError(null)
    setLoadedThread(null) // Clear loaded thread when starting new chat

    // Clear client history cache for fresh start
    if (userEmail) {
      try {
        await fetch('/api/clear-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userEmail,
            workspaceOwner: workspaceOwnerEmail
          })
        })
        console.log('[startNewChat] Cache cleared for new conversation')
      } catch (error) {
        console.error('[startNewChat] Failed to clear cache:', error)
        // Continue anyway - cache will expire naturally
      }
    }
  }

  const updateCurrentSession = () => {
    if (!currentSessionId) return
    
    setChatSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        // Generate title from first user message if still 'New Conversation'
        let title = session.title
        if (title === 'New Conversation' && messages.length > 0) {
          const firstUserMessage = messages.find(m => m.role === 'user')
          if (firstUserMessage) {
            title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
          }
        }
        
        return {
          ...session,
          title,
          messages: [...messages],
          lastUpdated: new Date()
        }
      }
      return session
    }))
  }

  const loadChatSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages)
      setUploadedFile(null)
      setUploadedFiles([])
      setUploadError(null)
      setShowHistory(false)
    }
  }

  const deleteChatSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChatSessions(prev => prev.filter(s => s.id !== sessionId))

    if (sessionId === currentSessionId) {
      const remainingSessions = chatSessions.filter(s => s.id !== sessionId)
      if (remainingSessions.length > 0) {
        loadChatSession(remainingSessions[0].id)
      } else {
        startNewChat()
      }
    }
  }

  const clearAllChatSessions = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      setChatSessions([])
      startNewChat()
      setShowHistory(false)
    }
  }

  // Force hide input panel function
  const forceHideInputPanel = () => {
    setForceHidden(true)
    setIsInputExpanded(false)
    setIsHoveringBottom(false)
    setIsInputPinned(false)
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    // Reset force hidden after a short delay to allow future interactions
    setTimeout(() => setForceHidden(false), 1000)
  }

  // Save private note function
  const savePrivateNote = async () => {
    if (!privateNoteClient.trim() || !privateNoteContent.trim() || !userEmail) {
      toast.error('Please fill in both client name and content')
      return
    }

    setSavingPrivateNote(true)
    try {
      const response = await fetch('/api/save-private-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userEmail,
          workspaceOwner,
          clientName: privateNoteClient,
          content: privateNoteContent,
          title: privateNoteTitle || `Private Note - ${privateNoteClient}`,
        }),
      })

      if (response.ok) {
        toast.success('Private note saved successfully!')
        setShowPrivateNoteModal(false)
        setPrivateNoteContent('')
        setPrivateNoteClient('')
        setPrivateNoteTitle('')
      } else {
        toast.error('Failed to save private note. Please try again.')
      }
    } catch (error) {
      console.error('Error saving private note:', error)
      toast.error('Failed to save private note. Please try again.')
    } finally {
      setSavingPrivateNote(false)
    }
  }

  // Function to prepare private note from message
  const preparePrivateNote = (message: Message) => {
    setPrivateNoteContent(message.content)
    setPrivateNoteClient('')
    setPrivateNoteTitle('')
    setShowPrivateNoteModal(true)
  }

  // Function to load thread messages into current conversation
  const handleLoadThread = (threadMessages: Message[], threadData: { threadId: string; filePath: string; metadata: any }) => {
    setMessages(threadMessages)
    setLoadedThread(threadData)
    // Clear current input
    setInput('')
    // Close the thread management modal
    setShowThreadManagementModal(false)
    // Scroll to bottom to show most recent messages
    setTimeout(() => scrollToBottom(true, true), 100)
  }

  // Voice command detection for quick notes
  const detectSaveNoteCommand = (text: string): { isCommand: boolean; clientName?: string; content?: string } => {
    const saveNotePattern = /^save note\s+([^:]+):\s*(.+)$/i
    const match = text.match(saveNotePattern)
    
    if (match) {
      return {
        isCommand: true,
        clientName: match[1].trim(),
        content: match[2].trim()
      }
    }
    
    return { isCommand: false }
  }

  // Quick note saving function for voice commands
  const saveQuickNote = async (clientName: string, content: string) => {
    console.log('saveQuickNote called with:', { clientName, content, userEmail })
    
    if (!userEmail) {
      alert('User email not available')
      return false
    }

    try {
      const response = await fetch('/api/save-private-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userEmail,
          clientName: clientName,
          content: content,
          title: `Quick Note - ${clientName}`,
        }),
      })

      if (response.ok) {
        const savedMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Private note saved for **${clientName}**\n\n*Note: ${content}*`,
          createdAt: new Date(),
        }
        setMessages(prev => [...prev, savedMessage])
        
        return true
      } else {
        const errorText = await response.text()
        console.error('Save note error:', errorText)
        alert(`Failed to save note: ${errorText}`)
        return false
      }
    } catch (error) {
      console.error('Error saving quick note:', error)
      alert('Failed to save note. Please try again.')
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !apiStatus?.hasApiKey) return

    // Stop recording if currently listening
    if (isListening && recognition) {
      recognition.stop()
      clearSilenceTimeout()
    }

    // Check for voice command "save note ClientName: content"
    const saveNoteCommand = detectSaveNoteCommand(input.trim())
    if (saveNoteCommand.isCommand && saveNoteCommand.clientName && saveNoteCommand.content) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input,
        createdAt: new Date(),
      }
      setMessages(prev => [...prev, userMessage])
      setInput('')
      
      await saveQuickNote(saveNoteCommand.clientName, saveNoteCommand.content)
      return
    }


    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    
    // Track chat message sent
    VercelAnalytics.trackChatMessage(input.trim().length, uploadedFiles.length > 0)
    
    // Auto-hide input area after sending message (Apple-style)
    setIsInputExpanded(false)
    setIsHoveringBottom(false)
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    // Scroll to bottom immediately when user sends message
    setTimeout(() => scrollToBottom(), 50)

    try {
      const chatPayload = {
        messages: [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        model: selectedModel,
        searchMyHistory,
        userId: userEmail,
        workspaceOwner,
        ...(uploadedFiles.length > 0 && {
          fileContext: uploadedFiles.map(file => ({
            filename: file.name,
            type: file.type,
            size: file.size,
            content: file.content
          }))
        }),
        // Maintain backward compatibility with single file
        ...(uploadedFile && !uploadedFiles.length && {
          fileContext: {
            filename: uploadedFile.name,
            type: uploadedFile.type,
            size: uploadedFile.size,
            content: uploadedFile.content
          }
        })
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatPayload),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullResponse += chunk

          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content: fullResponse } : msg)),
          )
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault()
      if (input.trim() && !isLoading && apiStatus?.hasApiKey) {
        handleSubmit(e as any)
      }
    }
    if ((e.key === 'Enter' && e.ctrlKey) || (e.key === 'Enter' && e.metaKey)) {
      e.preventDefault()
      if (input.trim() && !isLoading && apiStatus?.hasApiKey) {
        handleSubmit(e as any)
      }
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('csv')) return '📊'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('text')) return '📄'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB')
      return
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload Excel, CSV, Word, or text files.')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('File upload failed')
      }

      const result = await response.json()

      const uploadedFileData: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        content: result.content
      }

      setUploadedFile(uploadedFileData)
      
      // Track successful file upload
      VercelAnalytics.trackFileUpload(file.type, file.size, true)

      // Add file upload message to chat
      const fileMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `Uploaded file: ${file.name}`,
        createdAt: new Date(),
        file: uploadedFileData
      }

      setMessages((prev) => [...prev, fileMessage])

      // Auto-trigger analysis
      setInput(`Please analyze the uploaded file "${file.name}" and provide insights.`)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const removeUploadedFile = () => {
    setUploadedFile(null)
    setUploadError(null)
  }

  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 5 files
    if (files.length > 5) {
      setUploadError('Please select up to 5 files maximum')
      return
    }

    setUploadError(null)
    setIsUploading(true)

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ]

    // Validate all files
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File "${file.name}" is too large. Each file must be less than 10MB`)
        setIsUploading(false)
        return
      }
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`File "${file.name}" has an unsupported type. Please upload Excel, CSV, Word, or text files.`)
        setIsUploading(false)
        return
      }
    }

    try {
      const uploadedFilesList: UploadedFile[] = []

      // Upload files one by one
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const result = await response.json()

        uploadedFilesList.push({
          name: file.name,
          size: file.size,
          type: file.type,
          content: result.content
        })
      }

      setUploadedFiles(uploadedFilesList)
      
      // Track successful multi-file upload
      uploadedFilesList.forEach(file => {
        VercelAnalytics.trackFileUpload(file.type, file.size, true)
      })

      // Add file upload message to chat
      const fileMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `Uploaded ${uploadedFilesList.length} file(s): ${uploadedFilesList.map(f => f.name).join(', ')}`,
        createdAt: new Date(),
        files: uploadedFilesList
      }

      setMessages((prev) => [...prev, fileMessage])

      // Auto-trigger analysis
      if (uploadedFilesList.length === 1) {
        setInput(`Please analyze the uploaded file "${uploadedFilesList[0].name}" and provide insights.`)
      } else {
        setInput(`Please analyze the ${uploadedFilesList.length} uploaded files and provide insights.`)
      }

    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Failed to upload files. Please try again.')
    } finally {
      setIsUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const removeUploadedFiles = () => {
    setUploadedFiles([])
    setUploadError(null)
  }

  const removeIndividualFile = (fileIndex: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== fileIndex))
  }

  const roleBasedActions = {
    'Business Owner': [
      {
        icon: <TrendingUp className="w-4 h-4" />,
        title: "Review Financials",
        description: "Check cash flow & profit margins",
        prompt: "Help me review my business financials. I need to check cash flow, profit margins, and expenses to ensure my business stays on track."
      },
      {
        icon: <User className="w-4 h-4" />,
        title: "Client Interaction",
        description: "Manage customer relationships",
        prompt: "I need help managing client relationships and communications. What are best practices for maintaining key client relationships?"
      },
      {
        icon: <UserCheck className="w-4 h-4" />,
        title: "Team Management",
        description: "Employee oversight & delegation",
        prompt: "Help me with team management strategies. I need guidance on employee oversight, addressing staffing issues, and effective delegation."
      },
      {
        icon: <Megaphone className="w-4 h-4" />,
        title: "Marketing Oversight",
        description: "Campaign & brand visibility",
        prompt: "I want to review my marketing efforts. Help me analyze campaign performance, social media engagement, and strategies to boost brand visibility."
      },
      {
        icon: <Target className="w-4 h-4" />,
        title: "Strategic Planning",
        description: "Growth & expansion opportunities",
        prompt: "Help me with strategic planning for business growth. I want to brainstorm new opportunities like product lines or market expansion."
      },
      {
        icon: <AlertTriangle className="w-4 h-4" />,
        title: "Problem-Solving",
        description: "Handle unexpected issues",
        prompt: "I need help with business problem-solving strategies. How do I effectively tackle unexpected issues like equipment problems or customer complaints?"
      }
    ],
    'CPA': [
      {
        icon: <FileText className="w-4 h-4" />,
        title: "Prepare Tax Returns",
        description: "Federal, state & local filings",
        prompt: "I need help preparing tax returns. What documents and information do I need for federal, state, and local tax filings?"
      },
      {
        icon: <Calculator className="w-4 h-4" />,
        title: "Calculate Tax Liabilities",
        description: "Income, self-employment & sales tax",
        prompt: "Help me calculate tax liabilities including income tax, self-employment tax, and sales tax. What deductions should I consider?"
      },
      {
        icon: <Lightbulb className="w-4 h-4" />,
        title: "Tax Strategies",
        description: "Optimize deductions & credits",
        prompt: "I need advice on tax strategies to optimize my tax outcome. What deductions, credits, or retirement contributions should I consider?"
      },
      {
        icon: <BookOpen className="w-4 h-4" />,
        title: "Tax Law Updates",
        description: "Stay current on regulations",
        prompt: "Help me stay updated on current tax law changes. What recent tax regulation changes should I be aware of for compliance?"
      },
      {
        icon: <AlertCircle className="w-4 h-4" />,
        title: "Tax Notices",
        description: "IRS & state authority inquiries",
        prompt: "I received a tax notice from the IRS/state. Help me understand how to respond to tax authority inquiries and what steps to take."
      },
      {
        icon: <FolderOpen className="w-4 h-4" />,
        title: "Review Tax Documents",
        description: "Analyze W-2s, 1099s & receipts",
        prompt: "I need help reviewing tax documents for accuracy and compliance. What should I look for in W-2s, 1099s, and business receipts?"
      }
    ],
    'Bookkeeper': [
      {
        icon: <Edit className="w-4 h-4" />,
        title: "Record Transactions",
        description: "Daily sales, expenses & payments",
        prompt: "Help me with recording daily transactions in my accounting software. What's the best way to enter sales, expenses, and payments accurately?"
      },
      {
        icon: <CreditCard className="w-4 h-4" />,
        title: "Reconcile Accounts",
        description: "Match bank statements",
        prompt: "I need help reconciling my accounts. How do I match bank statements with my ledgers and catch any discrepancies?"
      },
      {
        icon: <DollarSign className="w-4 h-4" />,
        title: "Process Payroll",
        description: "Calculate wages & taxes",
        prompt: "Help me with payroll processing. How do I calculate employee wages, taxes, and benefits while ensuring timely payments?"
      },
      {
        icon: <Receipt className="w-4 h-4" />,
        title: "Manage Invoices",
        description: "Send & track receivables",
        prompt: "I need help managing invoices and accounts receivable. What's the best way to send invoices and track overdue payments?"
      },
      {
        icon: <TrendingUp className="w-4 h-4" />,
        title: "Monitor Cash Flow",
        description: "Track incoming & outgoing funds",
        prompt: "Help me monitor my business cash flow effectively. How do I track incoming and outgoing funds to avoid cash crunches?"
      },
      {
        icon: <BarChart3 className="w-4 h-4" />,
        title: "Prepare Financial Reports",
        description: "Balance sheets & income statements",
        prompt: "I need help preparing financial reports. How do I generate accurate balance sheets and income statements for my business?"
      }
    ]
  }

  const quickActions = roleBasedActions[selectedRole]

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
  }

  const handleRoleChange = (role: 'Business Owner' | 'CPA' | 'Bookkeeper') => {
    setSelectedRole(role)
    // Save to localStorage for persistence
    localStorage.setItem('selectedRole', role)
  }

  const handleModelChange = (model: 'grok-4-0709' | 'grok-4-fast-reasoning') => {
    setSelectedModel(model)
    // Save to localStorage for persistence
    localStorage.setItem('selectedModel', model)
  }

  // Load saved role and model on component mount
  useEffect(() => {
    const savedRole = localStorage.getItem('selectedRole') as 'Business Owner' | 'CPA' | 'Bookkeeper' | null
    if (savedRole && ['Business Owner', 'CPA', 'Bookkeeper'].includes(savedRole)) {
      setSelectedRole(savedRole)
    }
    
    const savedModel = localStorage.getItem('selectedModel') as 'grok-4-0709' | 'grok-4-fast-reasoning' | null
    if (savedModel && ['grok-4-0709', 'grok-4-fast-reasoning'].includes(savedModel)) {
      setSelectedModel(savedModel)
    }
  }, [])

  const startEditingMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditingContent(content)
  }

  const cancelEditingMessage = () => {
    setEditingMessageId(null)
    setEditingContent('')
  }

  const saveEditedMessage = async (messageId: string, regenerateResponse: boolean = false) => {
    if (!editingContent.trim()) return

    // Update the message content
    const updatedMessages = messages.map((msg) =>
      msg.id === messageId ? { ...msg, content: editingContent.trim() } : msg
    )

    // If regenerating response, remove all messages after the edited one
    let messagesToKeep = updatedMessages
    if (regenerateResponse) {
      const editedIndex = updatedMessages.findIndex(msg => msg.id === messageId)
      messagesToKeep = updatedMessages.slice(0, editedIndex + 1)
    }

    setMessages(messagesToKeep)
    setEditingMessageId(null)
    setEditingContent('')

    // If regenerating, send the edited message to get a new response
    if (regenerateResponse) {
      setIsLoading(true)
      try {
        const chatPayload = {
          messages: messagesToKeep.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model: selectedModel,
          searchMyHistory,
          userId: userEmail,
          workspaceOwner,
          ...(uploadedFile && {
            fileContext: {
              filename: uploadedFile.name,
              type: uploadedFile.type,
              size: uploadedFile.size,
              content: uploadedFile.content
            }
          })
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(chatPayload),
        })

        if (!response.ok) {
          throw new Error("Failed to get response")
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          createdAt: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ""

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            fullResponse += chunk

            setMessages((prev) =>
              prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content: fullResponse } : msg)),
            )
          }
        }
      } catch (error) {
        console.error("Chat error:", error)
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again.",
          createdAt: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      // Create rich HTML content optimized for business documents (always light theme)
      const richContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0;">
          <div style="background: #ffffff; color: #1f2937; border: 1px solid #d1d5db; padding: 16px 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <div style="white-space: pre-wrap; word-wrap: break-word; font-size: 14px;">
              ${text.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>
      `

      // Create clipboard item with both HTML and plain text
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([richContent], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      })

      await navigator.clipboard.write([clipboardItem])
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy rich text: ', err)
      // Fallback to plain text only
      try {
        await navigator.clipboard.writeText(text)
        setCopiedMessageId(messageId)
        setTimeout(() => setCopiedMessageId(null), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr)
        // Final fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          setCopiedMessageId(messageId)
          setTimeout(() => setCopiedMessageId(null), 2000)
        } catch (finalErr) {
          console.error('Final fallback copy failed: ', finalErr)
        }
        document.body.removeChild(textArea)
      }
    }
  }

  const deleteMessagePair = (messageIndex: number) => {
    // Delete both the user question and the assistant response
    // User messages are at even indices, assistant messages at odd indices
    const updatedMessages = [...messages]

    // Remove the message pair (question + answer)
    // If clicking on user message (even index), remove it and the next message
    // If clicking on assistant message (odd index), remove it and the previous message
    if (messageIndex % 2 === 0) {
      // User message - remove this and next (assistant response)
      updatedMessages.splice(messageIndex, 2)
    } else {
      // Assistant message - remove this and previous (user question)
      updatedMessages.splice(messageIndex - 1, 2)
    }

    setMessages(updatedMessages)
    toast.success('Message pair deleted')
  }

  const printMessage = (text: string, messageId: string) => {
    // Find the actual rendered message element on screen
    const messageElement = document.querySelector(`[data-message-id='${messageId}']`)
    
    let renderedContent = ''
    
    if (messageElement) {
      // Look specifically for the prose div that contains rendered markdown
      const proseElement = messageElement.querySelector('.prose')
      
      if (proseElement) {
        // Get the beautifully rendered HTML content with all styling
        renderedContent = proseElement.innerHTML
      } else {
        // Fallback: look for the card content or any content container
        const cardContent = messageElement.querySelector('.prose, [class*="markdown"], .group > div')
        if (cardContent) {
          renderedContent = cardContent.innerHTML
        } else {
          // Last fallback: get all content from the message element
          renderedContent = messageElement.innerHTML
        }
      }
    }
    
    // If we couldn't find rendered content, fall back to processing the raw text
    if (!renderedContent || renderedContent.trim() === '') {
      // Convert markdown tables to HTML as fallback
      renderedContent = text
        .replace(/\n/g, '<br>')
        // Convert markdown tables to HTML tables
        .replace(/\|(.+)\|\n\|[-\s\|]+\|\n((?:\|.+\|\n?)*)/g, (match, header, rows) => {
          const headerCells = header.split('|').map(cell => `<th style="padding: 12px; border: 1px solid #d1d5db; background: #f9fafb; font-weight: bold; text-align: left;">${cell.trim()}</th>`).filter(cell => cell !== '<th style="padding: 12px; border: 1px solid #d1d5db; background: #f9fafb; font-weight: bold; text-align: left;"></th>').join('')
          const rowCells = rows.trim().split('\n').map(row => {
            const cells = row.split('|').map(cell => `<td style="padding: 12px; border: 1px solid #d1d5db; text-align: left;">${cell.trim()}</td>`).filter(cell => cell !== '<td style="padding: 12px; border: 1px solid #d1d5db; text-align: left;"></td>').join('')
            return `<tr>${cells}</tr>`
          }).join('')
          return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #d1d5db;"><thead><tr>${headerCells}</tr></thead><tbody>${rowCells}</tbody></table>`
        })
    }

    // Create enhanced print content with perfect styling
    const printContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PeakSuite.ai - Professional Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #ffffff;
          }
          .message-container {
            background: #ffffff;
            color: #1f2937;
            border: 1px solid #d1d5db;
            padding: 24px 30px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin: 20px 0;
          }
          .message-content {
            font-size: 14px;
            line-height: 1.6;
          }
          
          /* Perfect table styling to match screen MarkdownRenderer */
          .overflow-x-auto {
            overflow-x: auto;
            margin-bottom: 8px;
          }
          table {
            min-width: 100% !important;
            border-collapse: collapse !important;
            border: 1px solid var(--border, #e2e8f0) !important;
            border-radius: 8px !important;
            font-size: 12px !important;
            margin: 8px 0 !important;
          }
          thead {
            background: var(--muted, #f1f5f9) !important;
          }
          th {
            padding: 8px 12px !important;
            text-align: left !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            color: var(--foreground, #0f172a) !important;
            border-bottom: 1px solid var(--border, #e2e8f0) !important;
          }
          td {
            padding: 8px 12px !important;
            font-size: 12px !important;
            color: var(--foreground, #0f172a) !important;
            border-bottom: 1px solid var(--border, #e2e8f0) !important;
          }
          tr:nth-child(even) {
            background-color: #f9fafb !important;
          }
          
          /* Prose styling to match MarkdownRenderer */
          .message-content {
            font-size: 14px !important;
            line-height: 1.6 !important;
          }
          .message-content h1 {
            font-size: 18px !important;
            font-weight: 600 !important;
            color: #0f172a !important;
            margin-bottom: 12px !important;
            margin-top: 16px !important;
          }
          .message-content h2 {
            font-size: 16px !important;
            font-weight: 600 !important;
            color: #0f172a !important;
            margin-bottom: 8px !important;
            margin-top: 12px !important;
          }
          .message-content h3 {
            font-size: 14px !important;
            font-weight: 600 !important;
            color: #0f172a !important;
            margin-bottom: 8px !important;
            margin-top: 8px !important;
          }
          .message-content p {
            font-size: 14px !important;
            line-height: 1.5 !important;
            color: #0f172a !important;
            margin-bottom: 8px !important;
          }
          .message-content ul, .message-content ol {
            margin-left: 24px !important;
            font-size: 14px !important;
            color: #0f172a !important;
            margin-bottom: 8px !important;
          }
          .message-content li {
            font-size: 14px !important;
            line-height: 1.5 !important;
            padding-left: 4px !important;
            margin-bottom: 4px !important;
          }
          .message-content code {
            background: #f1f5f9 !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            font-family: 'Monaco', 'Courier New', monospace !important;
          }
          .message-content pre {
            background: #f1f5f9 !important;
            padding: 12px !important;
            border-radius: 8px !important;
            overflow-x: auto !important;
            font-size: 12px !important;
            font-family: 'Monaco', 'Courier New', monospace !important;
            margin: 8px 0 !important;
          }
          .message-content blockquote {
            border-left: 4px solid #3b82f6 !important;
            padding-left: 16px !important;
            margin: 8px 0 !important;
            background: #f8fafc !important;
            padding: 8px 16px !important;
            border-radius: 0 8px 8px 0 !important;
          }
          .message-content strong {
            font-weight: 600 !important;
            color: #0f172a !important;
          }
          .message-content em {
            font-style: italic !important;
            color: #0f172a !important;
          }
          .message-content a {
            color: #3b82f6 !important;
            text-decoration: underline !important;
          }
          
          /* Headers and text formatting */
          h1, h2, h3, h4, h5, h6 {
            color: #1f2937 !important;
            margin: 20px 0 10px 0 !important;
          }
          p {
            margin: 10px 0 !important;
          }
          strong, b {
            font-weight: bold !important;
            color: #1f2937 !important;
          }
          
          @media print {
            body { margin: 0; padding: 15px; }
            .message-container { box-shadow: none; border: 1px solid #d1d5db; }
            table { page-break-inside: avoid; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="message-container">
          <div class="message-content">${renderedContent}</div>
        </div>
      </body>
      </html>
    `

    // Open new window with the perfectly formatted content
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
    
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      
      // Auto-focus and trigger print dialog
      printWindow.focus()
      
      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.print()
        // Close window after printing (optional)
        // printWindow.close()
      }, 500)
    } else {
      alert('Pop-up blocked! Please allow pop-ups for printing functionality.')
    }
  }

  const shareReport = (message: Message) => {
    if (!message.content.trim()) {
      alert('Cannot share empty message')
      return
    }

    setCurrentMessageToShare(message)
    setShowReportDetailsModal(true)
  }

  const handleShareWithDetails = async (details: any) => {
    if (!currentMessageToShare) return

    setShareReportLoading(currentMessageToShare.id)
    setSharedReportUrl(null)

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: details.title,
          content: currentMessageToShare.content,
          chartData: null, // Can be enhanced later to extract chart data from content
          description: details.description,
          projectType: 'AI Analysis',
          clientName: details.clientName,
          clientEmail: details.clientEmail,
          expiresAt: details.expiresAt,
          userEmail: userEmail || 'anonymous', // Include logged-in user email
          allowResponses: details.allowResponses,
          reportAttachments: details.reportAttachments || []
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSharedReportUrl(data.shareableUrl)
        setCurrentSharedReportTitle(details.title)
        setShowReportDetailsModal(false)
        setShowShareReportModal(true)
      } else {
        throw new Error(data.error || 'Failed to share report')
      }
    } catch (error) {
      console.error('Share report error:', error)
      alert('Failed to share report. Please try again.')
    } finally {
      setShareReportLoading(null)
    }
  }

  const handleEditReportContent = (reportContent: string, reportTitle: string) => {
    // Create a new message with the report content as an assistant response
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: reportContent,
      createdAt: new Date()
    }

    // Add a context message showing this is being edited
    const contextMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'user', 
      content: `Edit this report: "${reportTitle}"`,
      createdAt: new Date()
    }

    // Add both messages to the current session
    setMessages(prev => [...prev, contextMessage, newMessage])
    
    // Set input to suggest editing
    setInput(`Please improve or modify the above report. You can ask me to:\n- Add more details to specific sections\n- Change the tone or style\n- Include additional analysis\n- Restructure the content\n- Or any other modifications you'd like`)
    
    // Focus on the input
    setTimeout(() => {
      const inputElement = document.querySelector('textarea')
      if (inputElement) {
        inputElement.focus()
        inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length)
      }
    }, 100)
  }

  const toggleBookmark = (message: Message) => {
    const messageWithSessionInfo = {
      ...message,
      sessionId: currentSessionId,
      sessionTitle: chatSessions.find(s => s.id === currentSessionId)?.title || 'Unknown Session'
    }

    if (message.isBookmarked) {
      // Remove from bookmarks
      setBookmarkedMessages(prev => prev.filter(bm => bm.id !== message.id))
      // Update the message in current session
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, isBookmarked: false } : msg
      ))
    } else {
      // Add to bookmarks
      setBookmarkedMessages(prev => [...prev, messageWithSessionInfo])
      
      // Track bookmark added
      VercelAnalytics.trackFeatureUsage('chat_message_bookmarked', { message_length: message.content.length })
      // Update the message in current session
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, isBookmarked: true } : msg
      ))
    }
  }

  const removeBookmark = (messageId: string) => {
    setBookmarkedMessages(prev => prev.filter(bm => bm.id !== messageId))
    // Also update if the message is in current session
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isBookmarked: false } : msg
    ))
  }

  const jumpToBookmarkedMessage = (message: Message & { sessionId?: string }) => {
    if (message.sessionId && message.sessionId !== currentSessionId) {
      // Switch to the session containing this message
      const session = chatSessions.find(s => s.id === message.sessionId)
      if (session) {
        loadChatSession(message.sessionId)
      }
    }
    setShowBookmarks(false)
    
    // Scroll to message (we'll add this functionality)
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${message.id}`)
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        messageElement.classList.add('highlight-message')
        setTimeout(() => messageElement.classList.remove('highlight-message'), 2000)
      }
    }, 100)
  }

  // Search functionality
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const results = chatSessions.filter(session => {
      // Search in session title
      const titleMatch = session.title.toLowerCase().includes(query.toLowerCase())
      
      // Search in session messages
      const messageMatch = session.messages.some(message => 
        message.content.toLowerCase().includes(query.toLowerCase())
      )
      
      return titleMatch || messageMatch
    })

    setSearchResults(results)
  }

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
  }

  const searchCurrentMessages = (query: string) => {
    setCurrentMessageSearch(query)
    
    if (!query.trim()) {
      // Remove all highlights
      const highlightedElements = document.querySelectorAll('.search-highlight')
      highlightedElements.forEach(el => el.classList.remove('search-highlight'))
      return
    }

    // Find and highlight matching messages
    const messageElements = document.querySelectorAll('[id^="message-"]')
    messageElements.forEach(el => {
      const messageText = el.textContent?.toLowerCase() || ''
      if (messageText.includes(query.toLowerCase())) {
        el.classList.add('search-highlight')
      } else {
        el.classList.remove('search-highlight')
      }
    })
  }

  useEffect(() => {
    performSearch(searchQuery)
  }, [searchQuery, chatSessions])

  // Handle search box interactions
  const toggleSearchBox = () => {
    if (showSearchBox) {
      // Closing search box - clear search
      setSearchQuery('')
      setSearchResults([])
      setShowSearchBox(false)
    } else {
      // Opening search box - focus input
      setShowSearchBox(true)
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      toggleSearchBox()
    }
  }

  // Click outside to close search box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSearchBox && 
          searchContainerRef.current && 
          !searchContainerRef.current.contains(event.target as Node)) {
        toggleSearchBox()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSearchBox])

  // Click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu &&
          userMenuRef.current &&
          !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu &&
          exportMenuRef.current &&
          !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  // Click outside to close workspace menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showWorkspaceMenu &&
          workspaceMenuRef.current &&
          !workspaceMenuRef.current.contains(event.target as Node)) {
        setShowWorkspaceMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showWorkspaceMenu])

  // Click outside to close prompts menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPromptsMenu &&
          promptsMenuRef.current &&
          !promptsMenuRef.current.contains(event.target as Node)) {
        setShowPromptsMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPromptsMenu])


  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = (smooth = true, force = false) => {
    if (messagesEndRef.current && (!isAutoScrollPaused || force)) {
      // Use instant scroll during streaming to prevent jumps
      const shouldUseSmooth = smooth && !isLoading
      messagesEndRef.current.scrollIntoView({
        behavior: shouldUseSmooth ? 'smooth' : 'auto',
        block: isLoading ? 'nearest' : 'end'
      })
    }
  }

  // Debounced scroll to bottom - only scroll when content stabilizes
  useEffect(() => {
    if (!chatContainerRef.current) return

    const container = chatContainerRef.current
    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150

    // Only auto-scroll if user is already near bottom
    if (!isNearBottom && !isAutoScrollPaused) return

    // Debounce scroll during streaming to reduce jumps
    const debounceTime = isLoading ? 250 : 100
    const timer = setTimeout(() => {
      requestAnimationFrame(() => scrollToBottom(false))
    }, debounceTime)

    return () => clearTimeout(timer)
  }, [messages, isLoading])

  // Smart scroll behavior - pause auto-scroll when user scrolls up
  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current) return
      
      const container = chatContainerRef.current
      const { scrollTop, scrollHeight, clientHeight } = container
      
      // Check if user is near the bottom (within 100px)
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      
      // If user scrolled up from bottom, pause auto-scroll
      if (!isNearBottom && !isAutoScrollPaused) {
        setIsAutoScrollPaused(true)
      }
      
      // If user scrolled back to bottom, resume auto-scroll
      if (isNearBottom && isAutoScrollPaused) {
        setIsAutoScrollPaused(false)
      }
    }

    // Attach scroll listener to window (since chat might scroll the whole page)
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Also attach to chat container if it's scrollable
    if (chatContainerRef.current) {
      chatContainerRef.current.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (chatContainerRef.current) {
        chatContainerRef.current.removeEventListener('scroll', handleScroll)
      }
    }
  }, [isAutoScrollPaused])

  const exportConversationAsText = () => {
    const currentSession = chatSessions.find(s => s.id === currentSessionId)
    if (!currentSession) return
    
    // Track export action
    VercelAnalytics.trackConversationExport('text')

    let content = `PeakSuite.ai Conversation Export\\n`
    content += `Title: ${currentSession.title}\\n`
    content += `Date: ${currentSession.createdAt.toLocaleDateString()}\\n`
    content += `Messages: ${currentSession.messages.length}\\n`
    content += `\\n${'='.repeat(50)}\\n\\n`

    currentSession.messages.forEach((message, index) => {
      content += `${message.role.toUpperCase()}: ${message.createdAt.toLocaleString()}\\n`
      if (message.file) {
        content += `[File: ${message.file.name} (${formatFileSize(message.file.size)})]\\n`
      }
      content += `${message.content}\\n\\n`
      if (index < currentSession.messages.length - 1) {
        content += `${'-'.repeat(30)}\\n\\n`
      }
    })

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${currentSession.createdAt.toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportConversationAsPDF = async () => {
    const currentSession = chatSessions.find(s => s.id === currentSessionId)
    if (!currentSession) return
    
    // Track export action
    VercelAnalytics.trackConversationExport('html')

    // Create a beautifully styled HTML version matching the app design
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${currentSession.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.7; 
            color: #0f172a;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 40px 20px;
            max-width: 1200px;
            margin: 0 auto;
            min-height: 100vh;
          }
          
          .header { 
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 16px;
            padding: 40px;
            margin-bottom: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #e2e8f0;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #1d4ed8, #6366f1);
          }
          
          .header h1 { 
            color: #1e293b;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .header h1::before {
            content: '🧮';
            font-size: 28px;
          }
          
          .header-info { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-top: 25px;
          }
          
          .header-info-item {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 16px 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
          }
          
          .header-info-item:hover {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
          }
          
          .header-info-item strong { 
            color: #334155;
            font-weight: 600;
            font-size: 14px;
            display: block;
            margin-bottom: 4px;
          }
          
          .header-info-item span {
            color: #64748b;
            font-size: 14px;
          }
          
          .conversation {
            display: flex;
            flex-direction: column;
            gap: 24px;
            padding: 20px 0;
          }
          
          .message { 
            display: flex;
            width: 100%;
            animation: fadeInUp 0.3s ease-out;
          }
          
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .message.user {
            justify-content: flex-end;
          }
          
          .message.assistant {
            justify-content: flex-start;
          }
          
          .message-content {
            max-width: 75%;
            padding: 20px 24px;
            border-radius: 18px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
            position: relative;
            backdrop-filter: blur(10px);
          }
          
          .message.user .message-content {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            border-bottom-right-radius: 6px;
          }
          
          .message.assistant .message-content {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            color: #1e293b;
            border: 1px solid #e2e8f0;
            border-bottom-left-radius: 6px;
          }
          
          .role-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            padding: 6px 12px;
            border-radius: 20px;
            margin-bottom: 14px;
            letter-spacing: 0.5px;
            backdrop-filter: blur(10px);
          }
          
          .role-badge::before {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 50%;
            display: inline-block;
          }
          
          .message.user .role-badge {
            background: rgba(255, 255, 255, 0.25);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
          
          .message.user .role-badge::before {
            background: rgba(255, 255, 255, 0.8);
          }
          
          .message.assistant .role-badge {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border: 1px solid rgba(59, 130, 246, 0.2);
          }
          
          .message.assistant .role-badge::before {
            background: #3b82f6;
          }
          
          .file-attachment {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            font-size: 14px;
            color: #1e40af;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .file-icon {
            margin-right: 8px;
          }
          
          .message-text {
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          
          .message.user .message-text {
            color: white;
          }
          
          .message.assistant .message-text {
            color: #374151;
          }
          
          /* Markdown styling for assistant messages */
          .message.assistant .message-text h1,
          .message.assistant .message-text h2,
          .message.assistant .message-text h3 {
            font-weight: 600;
            margin: 16px 0 8px 0;
            color: #1f2937;
          }
          
          .message.assistant .message-text h1 { font-size: 18px; }
          .message.assistant .message-text h2 { font-size: 16px; }
          .message.assistant .message-text h3 { font-size: 14px; }
          
          .message.assistant .message-text p {
            margin: 8px 0;
          }
          
          .message.assistant .message-text ul,
          .message.assistant .message-text ol {
            margin: 12px 0;
            padding-left: 0;
            list-style: none;
          }
          
          .message.assistant .message-text li {
            margin: 8px 0;
            padding-left: 28px;
            position: relative;
            line-height: 1.6;
          }
          
          .message.assistant .message-text ul > li::before {
            content: "•";
            position: absolute;
            left: 8px;
            color: #6b7280;
            font-weight: bold;
          }
          
          .message.assistant .message-text ol {
            counter-reset: list-counter;
          }
          
          .message.assistant .message-text ol > li {
            counter-increment: list-counter;
          }
          
          .message.assistant .message-text ol > li::before {
            content: counter(list-counter) ".";
            position: absolute;
            left: 8px;
            color: #6b7280;
            font-weight: 500;
          }
          
          .message.assistant .message-text code {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            padding: 4px 8px;
            border-radius: 6px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
            font-size: 13px;
            color: #475569;
            border: 1px solid #e2e8f0;
            font-weight: 500;
          }
          
          .message.assistant .message-text pre {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: #e2e8f0;
            padding: 20px;
            border-radius: 12px;
            overflow-x: auto;
            margin: 16px 0;
            border: 1px solid #334155;
            position: relative;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
          
          .message.assistant .message-text pre::before {
            content: '';
            position: absolute;
            top: 12px;
            left: 16px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ef4444;
            box-shadow: 20px 0 0 #f59e0b, 40px 0 0 #10b981;
          }
          
          .message.assistant .message-text blockquote {
            border-left: 4px solid #3b82f6;
            padding-left: 16px;
            margin: 12px 0;
            font-style: italic;
            color: #6b7280;
          }
          
          .message.assistant .message-text table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .message.assistant .message-text th,
          .message.assistant .message-text td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
          }
          
          .message.assistant .message-text th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
          }
          
          .message.assistant .message-text strong {
            font-weight: 600;
            color: #1f2937;
          }
          
          .timestamp {
            font-size: 12px;
            color: #64748b;
            margin-top: 12px;
            font-weight: 500;
            opacity: 0.8;
          }
          
          .message.user .timestamp {
            color: rgba(255, 255, 255, 0.75);
          }
          
          /* Responsive Design */
          @media (max-width: 768px) {
            body { padding: 20px 16px; }
            .header { padding: 24px; margin-bottom: 24px; }
            .header h1 { font-size: 24px; }
            .header-info { grid-template-columns: 1fr; gap: 12px; }
            .message-content { 
              max-width: 90%; 
              padding: 16px 20px;
              border-radius: 16px;
            }
            .conversation { gap: 20px; }
          }
          
          @media (max-width: 480px) {
            body { padding: 16px 12px; }
            .header { padding: 20px; }
            .header h1 { font-size: 20px; }
            .message-content { 
              max-width: 95%; 
              padding: 14px 18px;
            }
          }
          
          /* Print Styles */
          @media print {
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            body { 
              background: white !important; 
              font-size: 12px;
              padding: 20px;
            }
            .header { 
              background: white !important; 
              border: 1px solid #e2e8f0 !important;
              page-break-inside: avoid;
            }
            .message-content { 
              box-shadow: none !important; 
              border: 1px solid #e2e8f0 !important;
              page-break-inside: avoid;
            }
            .message.user .message-content {
              background: #f1f5f9 !important;
              color: #1e293b !important;
            }
            .conversation { gap: 16px; }
            .message { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🧮 PeakSuite.ai Conversation Export</h1>
          <div class="header-info">
            <div class="header-info-item">
              <strong>Title:</strong> ${currentSession.title}
            </div>
            <div class="header-info-item">
              <strong>Date:</strong> ${currentSession.createdAt.toLocaleDateString()}
            </div>
            <div class="header-info-item">
              <strong>Messages:</strong> ${currentSession.messages.length}
            </div>
            <div class="header-info-item">
              <strong>Export Date:</strong> ${new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div class="conversation">
    `

    currentSession.messages.forEach(message => {
      const fileAttachment = message.file ? `
        <div class="file-attachment">
          <span class="file-icon">📎</span>
          <strong>Attached:</strong> ${message.file.name} (${formatFileSize(message.file.size)})
        </div>` : ''
      
      const multipleFiles = message.files && message.files.length > 0 ? `
        <div class="file-attachment">
          <span class="file-icon">📎</span>
          <strong>Attached ${message.files.length} files:</strong> ${message.files.map(f => f.name).join(', ')}
        </div>` : ''

      htmlContent += `
        <div class="message ${message.role}">
          <div class="message-content">
            <div class="role-badge">${message.role === 'user' ? 'You' : 'Assistant'}</div>
            ${fileAttachment}
            ${multipleFiles}
            <div class="message-text">${message.content.replace(/\\n/g, '<br>')}</div>
            <div class="timestamp">${message.createdAt.toLocaleDateString()} at ${message.createdAt.toLocaleTimeString()}</div>
          </div>
        </div>
      `
    })

    htmlContent += `
        </div>
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${currentSession.createdAt.toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyAsRichText = async () => {
    const currentSession = chatSessions.find(s => s.id === currentSessionId)
    if (!currentSession) return
    
    // Track export action
    VercelAnalytics.trackConversationExport('markdown')

    try {
      // Create rich HTML content optimized for business documents (always light theme)
      const richContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
              🧮 ${currentSession.title}
            </h2>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">
              Exported on ${new Date().toLocaleDateString()} • ${currentSession.messages.length} messages
            </p>
          </div>
          
          ${currentSession.messages.map(message => {
            const isUser = message.role === 'user'
            const bgColor = isUser ? 'background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white;' : 'background: #f8fafc; color: #1e293b; border: 1px solid #e2e8f0;'
            const alignment = isUser ? 'margin-left: 60px;' : 'margin-right: 60px;'
            
            return `
              <div style="margin: 16px 0; ${alignment}">
                <div style="${bgColor} padding: 16px 20px; border-radius: 16px; ${isUser ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; opacity: 0.8;">
                    ${isUser ? 'You' : 'Assistant'}
                  </div>
                  <div style="white-space: pre-wrap; word-wrap: break-word;">
                    ${message.content.replace(/\n/g, '<br>')}
                  </div>
                  <div style="font-size: 11px; margin-top: 8px; opacity: 0.7;">
                    ${message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            `
          }).join('')}
        </div>
      `

      // Create clipboard item with both HTML and plain text
      const plainText = `${currentSession.title}\nExported on ${new Date().toLocaleDateString()}\n\n${currentSession.messages.map(msg => 
        `${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`
      ).join('\n\n')}`

      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([richContent], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      })

      await navigator.clipboard.write([clipboardItem])
      
      // Show success feedback
      const existingToast = document.querySelector('.copy-toast')
      if (existingToast) existingToast.remove()
      
      const toast = document.createElement('div')
      toast.className = 'copy-toast'
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1000;
        background: #10b981; color: white; padding: 12px 20px;
        border-radius: 8px; font-size: 14px; font-weight: 500;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
      `
      toast.textContent = '✓ Rich text copied! Ready to paste in email or documents'
      
      const style = document.createElement('style')
      style.textContent = '@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }'
      document.head.appendChild(style)
      
      document.body.appendChild(toast)
      setTimeout(() => {
        toast.remove()
        style.remove()
      }, 3000)

    } catch (error) {
      console.error('Failed to copy rich text:', error)
      // Fallback to plain text
      const plainText = `${currentSession.title}\n\n${currentSession.messages.map(msg => 
        `${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`
      ).join('\n\n')}`
      
      await navigator.clipboard.writeText(plainText)
      alert('Copied as plain text (rich text not supported by your browser)')
    }
  }

  const exportAsEmailFormat = () => {
    const currentSession = chatSessions.find(s => s.id === currentSessionId)
    if (!currentSession) return
    
    // Track export action
    VercelAnalytics.trackConversationExport('email')

    // Create email-optimized content
    const emailContent = `
📧 PEAKSUITE.AI CONVERSATION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CONVERSATION DETAILS
• Title: ${currentSession.title}
• Date: ${currentSession.createdAt.toLocaleDateString()}
• Time: ${currentSession.createdAt.toLocaleTimeString()}
• Messages: ${currentSession.messages.length}
• Exported: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 CONVERSATION TRANSCRIPT

${currentSession.messages.map((message, index) => {
  const prefix = message.role === 'user' ? '👤 YOU' : '🤖 ASSISTANT'
  const timestamp = message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  return `${index + 1}. ${prefix} (${timestamp})
${message.content.split('\n').map(line => `   ${line}`).join('\n')}

`
}).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 CONVERSATION SUMMARY
• Total exchanges: ${Math.ceil(currentSession.messages.length / 2)}
• User messages: ${currentSession.messages.filter(m => m.role === 'user').length}
• AI responses: ${currentSession.messages.filter(m => m.role === 'assistant').length}

This report was generated by PeakSuite.ai
For more information, visit: https://peaksuite.ai

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim()

    // Copy to clipboard
    navigator.clipboard.writeText(emailContent).then(() => {
      // Show success feedback
      const existingToast = document.querySelector('.copy-toast')
      if (existingToast) existingToast.remove()
      
      const toast = document.createElement('div')
      toast.className = 'copy-toast'
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1000;
        background: #3b82f6; color: white; padding: 12px 20px;
        border-radius: 8px; font-size: 14px; font-weight: 500;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
      `
      toast.textContent = '📧 Email format copied! Ready to paste'
      
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 3000)
    }).catch(() => {
      alert('Failed to copy to clipboard')
    })
  }

  const copyAsMarkdown = () => {
    const currentSession = chatSessions.find(s => s.id === currentSessionId)
    if (!currentSession) return

    // Create clean markdown content
    const markdownContent = `# 🧮 ${currentSession.title}

**Date:** ${currentSession.createdAt.toLocaleDateString()}  
**Time:** ${currentSession.createdAt.toLocaleTimeString()}  
**Messages:** ${currentSession.messages.length}  
**Exported:** ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

---

${currentSession.messages.map((message, index) => {
  const role = message.role === 'user' ? '👤 **You**' : '🤖 **Assistant**'
  const timestamp = message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  return `## ${role} *(${timestamp})*

${message.content}

---`
}).join('\n\n')}

## 📊 Conversation Summary

- **Total Exchanges:** ${Math.ceil(currentSession.messages.length / 2)}
- **Your Messages:** ${currentSession.messages.filter(m => m.role === 'user').length}
- **AI Responses:** ${currentSession.messages.filter(m => m.role === 'assistant').length}

*Generated by PeakSuite.ai*`

    // Copy to clipboard
    navigator.clipboard.writeText(markdownContent).then(() => {
      // Show success feedback
      const existingToast = document.querySelector('.copy-toast')
      if (existingToast) existingToast.remove()
      
      const toast = document.createElement('div')
      toast.className = 'copy-toast'
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1000;
        background: #6366f1; color: white; padding: 12px 20px;
        border-radius: 8px; font-size: 14px; font-weight: 500;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
      `
      toast.textContent = '📝 Markdown copied! Paste in any markdown editor'
      
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 3000)
    }).catch(() => {
      alert('Failed to copy to clipboard')
    })
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        {/* First line - Logo and User Menu */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 pb-2">
          {/* Left side - Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-2xl font-semibold text-foreground">PeakSuite.ai</h1>
              </Link>
              {userName && (
                <div className="flex flex-col">
                  <p className="text-sm text-muted-foreground">
                    {userName}
                  </p>
                  <div className="flex items-center gap-2">
                    <FastTooltip content={apiStatus?.hasApiKey ? "Piper is Available" : "AI Disconnected - Check connection"}>
                      <div className={`w-2 h-2 rounded-full ${apiStatus?.hasApiKey ? "bg-green-500" : "bg-orange-500"}`}></div>
                    </FastTooltip>
                    <p className="text-xs text-muted-foreground">
                      {assistantName} Peak - VA
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Main action buttons + User Menu + Theme */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Prompts Dropdown */}
            <div className="relative" ref={promptsMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPromptsMenu(!showPromptsMenu)}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Prompts</span>
                <ChevronDown className="w-3 h-3" />
              </Button>

              {showPromptsMenu && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-20">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setInput('Please provide a very brief summary of the following:')
                        setShowPromptsMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="text-lg">😀</span>
                      Brief Summary
                    </button>

                    <button
                      onClick={() => {
                        setInput(input ? 'Create a table from this data:\n' + input : 'Help me create a table from my data')
                        setShowPromptsMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="text-lg">📋</span>
                      Create Table
                    </button>

                    <button
                      onClick={() => {
                        setInput(input ? 'Summarize the key insights from:\n' + input : 'Help me summarize key insights from my data')
                        setShowPromptsMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="text-lg">📝</span>
                      Summarize Data
                    </button>

                    <button
                      onClick={() => {
                        setInput(input ? 'Convert to bullet points:\n' + input : 'Help me organize information into bullet points')
                        setShowPromptsMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="text-lg">•</span>
                      Bullet Points
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Workspace Dropdown */}
            <div className="relative" ref={workspaceMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                className="flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">Workspace</span>
                <ChevronDown className="w-3 h-3" />
              </Button>

              {showWorkspaceMenu && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-20">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowClientManagementModal(true)
                        setShowWorkspaceMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Building2 className="w-4 h-4" />
                      Clients
                    </button>

                    <button
                      onClick={() => {
                        setShowClientNotesModal(true)
                        setShowWorkspaceMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <StickyNote className="w-4 h-4" />
                      Client Notes
                    </button>

                    <button
                      onClick={() => {
                        setShowThreadManagementModal(true)
                        setShowWorkspaceMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Projects
                    </button>

                    <button
                      onClick={() => {
                        setShowActivityReportModal(true)
                        setShowWorkspaceMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Activity Report
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Client Comms Button - Keep standalone */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMyReportsModal(true)}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Client Comms</span>
            </Button>

            {/* Export Menu - only show when messages exist */}
            {messages.length > 0 && (
              <div className="relative" ref={exportMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>

                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-20">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          exportConversationAsText()
                          setShowExportMenu(false)
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export as Text
                      </button>

                      <button
                        onClick={() => {
                          exportConversationAsPDF()
                          setShowExportMenu(false)
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        Export as HTML
                      </button>

                      <button
                        onClick={() => {
                          copyAsRichText()
                          setShowExportMenu(false)
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Clipboard className="w-4 h-4" />
                        Copy Rich Text
                      </button>

                      <button
                        onClick={() => {
                          exportAsEmailFormat()
                          setShowExportMenu(false)
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Copy Email Format
                      </button>

                      <button
                        onClick={() => {
                          copyAsMarkdown()
                          setShowExportMenu(false)
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <FileDown className="w-4 h-4" />
                        Copy as Markdown
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Menu</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
              
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-20">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowHistory(true)
                        setShowUserMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <History className="w-4 h-4" />
                      History
                      {chatSessions.length > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {chatSessions.length}
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowBookmarks(true)
                        setShowUserMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Bookmark className="w-4 h-4" />
                      Bookmarks
                      {bookmarkedMessages.length > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {bookmarkedMessages.length}
                        </span>
                      )}
                    </button>

                    {/* Updates/Communications */}
                    <button
                      onClick={() => {
                        setShowCommunications(true)
                        setShowUserMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                      Updates
                      {communicationsCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {communicationsCount > 9 ? '9+' : communicationsCount}
                        </span>
                      )}
                    </button>

                    {/* Help Guide */}
                    <button
                      onClick={() => {
                        window.open('/help', '_blank')
                        setShowUserMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                      User Guide
                    </button>

                    {/* Share Feedback */}
                    <button
                      onClick={() => {
                        setShowFeedback(true)
                        setShowUserMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Share Feedback
                    </button>

                    {/* Custom Instructions */}
                    <button
                      onClick={() => {
                        setShowCustomInstructions(true)
                        setShowUserMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Custom Instructions
                    </button>

                    <div className="border-t border-border my-2"></div>

                    {/* Investing Dashboard - Admin Only */}
                    {userPermissions.includes('admin') && (
                      <button
                        onClick={() => {
                          window.open('/investing', '_blank')
                          setShowUserMenu(false)
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Investing
                      </button>
                    )}

                    <div className="border-t border-border my-2"></div>
                    
                    {/* Upload Files - only show if user has admin or upload permission */}
                    {(userPermissions.includes('admin') || userPermissions.includes('upload')) && (
                      <button
                        onClick={() => {
                          setShowFileUpload(true)
                          setShowUserMenu(false)
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Files
                      </button>
                    )}

                    {/* Admin Section */}
                    {userPermissions.includes('admin') && (
                      <>
                        <div className="border-t border-border my-2"></div>

                        {/* Admin Communications */}
                        <button
                          onClick={() => {
                            setShowAdminCommunications(true)
                            setShowUserMenu(false)
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <Bell className="w-4 h-4" />
                          Admin Comms
                          {adminFeedbackCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {adminFeedbackCount > 9 ? '9+' : adminFeedbackCount}
                            </span>
                          )}
                        </button>

                        {/* Admin Page */}
                        <button
                          onClick={() => {
                            window.open('/admin', '_blank')
                            setShowUserMenu(false)
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Admin Page
                        </button>

                        {/* Edit Welcome Message */}
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            setShowWelcomeMessageModal(true)
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Edit Welcome Message
                        </button>
                      </>
                    )}

                    <div className="border-t border-border my-2"></div>

                    <button
                      onClick={() => {
                        handleSignOut()
                        setShowUserMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ThemeToggle />

            {/* Admin Welcome Message Modal */}
            <AdminNavToggle
              userEmail={userEmail}
              isAdmin={userPermissions.includes('admin')}
              showModal={showWelcomeMessageModal}
              onCloseModal={() => setShowWelcomeMessageModal(false)}
            />
            
            {/* Recording Status Indicator */}
            {isListening && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-red-500 font-medium hidden sm:inline">
                  Recording
                  <span className="animate-pulse">...</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Second line - Search box (right-justified) */}
        {messages.length > 3 && (
          <div className="flex justify-end px-4 pb-3">
            <div className="max-w-md">
              {!showConversationSearch ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConversationSearch(true)}
                  className="bg-background/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-all"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search conversation
                </Button>
              ) : (
                <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg p-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search in this conversation..."
                      value={currentMessageSearch}
                      onChange={(e) => searchCurrentMessages(e.target.value)}
                      className="pl-10 pr-20 h-8 text-sm"
                      autoFocus
                    />
                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                      {currentMessageSearch && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => searchCurrentMessages('')}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowConversationSearch(false)
                          searchCurrentMessages('')
                        }}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>



      {/* Main Content Area */}
      <div className="flex-1 overflow-auto flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-6xl w-full mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-semibold text-foreground mb-3">{dynamicMessage}</h2>
                {userName && (
                  <p className="text-2xl text-muted-foreground mb-4">
                    {getGreeting()}, {userName.split(' ')[0].charAt(0).toUpperCase() + userName.split(' ')[0].slice(1).toLowerCase()}!
                  </p>
                )}
                <p className="text-2xl text-muted-foreground mb-8 text-balance">
                  Lets Get to Work!
                </p>

                {/* Input Area */}
                <div className="mb-8">
                  {/* Upload Error */}
                  {uploadError && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{uploadError}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadError(null)}
                        className="ml-auto h-auto p-1"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {/* Uploaded File Preview */}
                  {uploadedFile && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 border border-green-200 rounded">
                      <span className="text-lg">{getFileIcon(uploadedFile.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800 truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-green-600">{formatFileSize(uploadedFile.size)} • Ready for analysis</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeUploadedFile}
                        className="h-auto p-1 text-green-600 hover:text-green-800"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {/* Multiple Uploaded Files Preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-green-800">
                          {uploadedFiles.length} file(s) ready for analysis
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeUploadedFiles}
                          className="h-auto p-1 text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                            <span className="text-sm">{getFileIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-green-800 truncate">{file.name}</p>
                              <p className="text-xs text-green-600">{formatFileSize(file.size)}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeIndividualFile(index)}
                              className="h-auto p-1 text-green-600 hover:text-green-800"
                            >
                              <X className="w-2 h-2" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3">
                    
                    {/* Search History Toggle */}
                    <div className="flex justify-center mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <input 
                          type="checkbox" 
                          id="searchHistory" 
                          checked={searchMyHistory}
                          onChange={(e) => setSearchMyHistory(e.target.checked)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                        />
                        <label htmlFor="searchHistory" className="text-muted-foreground cursor-pointer">
                          Search my client history only
                        </label>
                      </div>
                    </div>

                    
                    <div className="flex justify-center">
                      <div className="flex-1 relative max-w-2xl">
                        <textarea
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          onFocus={() => setInputHasFocus(true)}
                          onBlur={() => setInputHasFocus(false)}
                          placeholder="What's on the Agenda today?"
                          className="pr-10 min-h-32 h-32 w-full rounded-md border border-input !bg-gray-200 dark:!bg-gray-700 px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-green-500 focus-visible:ring-green-500/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y text-center placeholder:text-center"
                          disabled={isLoading || !apiStatus?.hasApiKey}
                        />
                      </div>
                    </div>
                    
                  </form>
                  
                  {/* Control Panel - Simplified Single Row Layout */}
                  <div className="flex justify-center mt-4 px-2">
                    <div className="flex flex-wrap justify-center gap-2 max-w-full">
                      {/* File Upload Button */}
                      <FastTooltip content="Upload multiple files (up to 5)">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isLoading || !apiStatus?.hasApiKey || isUploading}
                          onClick={() => {
                            multiFileInputRef.current?.click()
                          }}
                          className="text-xs"
                        >
                          {isUploading ? (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Paperclip className="w-4 h-4" />
                          )}
                        </Button>
                      </FastTooltip>
                      
                      <FastTooltip content="Extract text from PDF">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isLoading || !apiStatus?.hasApiKey}
                          onClick={() => setShowPDFExtractor(true)}
                          className="text-xs"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </FastTooltip>
                      
                      {/* Speech-to-Text Button */}
                      <FastTooltip content={isListening ? 'Stop voice recording' : 'Start voice recording'}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isLoading || !apiStatus?.hasApiKey}
                          onClick={toggleSpeechRecognition}
                          className={`w-20 h-9 text-xs transition-all ${isListening ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50' : ''}`}
                        >
                          {isListening ? (
                            <MicOff className="w-4 h-4 animate-pulse" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </Button>
                      </FastTooltip>

                      {/* Clients Button */}
                      <FastTooltip content="Manage clients">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowClientManagementModal(true)}
                          className="h-9 text-xs flex items-center justify-center gap-1 px-3"
                        >
                          <Building2 className="w-3 h-3" />
                          Clients
                        </Button>
                      </FastTooltip>

                      {/* Client Notes Button */}
                      <FastTooltip content="Create a client note without using AI">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowClientNotesModal(true)}
                          className="h-9 text-xs flex items-center justify-center gap-1 px-3"
                        >
                          <StickyNote className="w-3 h-3" />
                          Client Notes
                        </Button>
                      </FastTooltip>

                      {/* Projects Button */}
                      <FastTooltip content="Manage projects">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowThreadManagementModal(true)}
                          className="h-9 text-xs flex items-center justify-center gap-1 px-3"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Projects
                        </Button>
                      </FastTooltip>

                      {/* Submit Button */}
                      <FastTooltip content="Send Message - Send your message to the AI">
                        <Button
                          type="submit"
                          variant="default"
                          size="sm"
                          disabled={(!input.trim() && !isListening) || isLoading || !apiStatus?.hasApiKey}
                          onClick={handleSubmit}
                          className={`w-20 h-9 text-xs text-primary-foreground transition-colors ${
                            (inputHasFocus && input.trim()) || isListening
                              ? 'bg-green-400 hover:bg-green-500'
                              : 'bg-primary hover:bg-primary/90'
                          }`}
                        >
                         Send ▲
                        </Button>
                      </FastTooltip>

                      {/* New Chat Button */}
                      <FastTooltip content="Start a new conversation">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={startNewChat}
                          className="w-20 h-9 text-xs flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          New
                        </Button>
                      </FastTooltip>
                    </div>
                  </div>
                  
                  <div className="text-center mt-2 text-xs text-muted-foreground">
                    <span>Upload: Excel, CSV, Word, TXT (max 10MB each, up to 5 files)</span>
                  </div>
                </div>

                <div className="border-t border-blue-800 pt-6 mt-4"></div>
                
                {/* Model Selection - Admin Only */}
                {userPermissions.includes('admin') && (
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground mb-2 text-center">
                      AI Model Selection (Admin)
                    </p>
                    <div className="flex justify-center">
                      <Select value={selectedModel} onValueChange={handleModelChange}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grok-4-fast-reasoning">⚡ Grok 4 Fast Reasoning</SelectItem>
                          <SelectItem value="grok-4-0709">🧠 Grok 4 Full (0709)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <p className="text-2xl text-muted-foreground mb-4">
                  What role are we playing today?
                </p>

                {/* Role Selection */}
                <div className="flex justify-center gap-6 mb-8">
                  {(['Business Owner', 'CPA', 'Bookkeeper'] as const).map((role) => (
                    <label key={role} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={selectedRole === role}
                        onChange={() => handleRoleChange(role)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 border-2 rounded mr-2 flex items-center justify-center transition-all ${
                        selectedRole === role 
                          ? 'bg-primary border-primary' 
                          : 'border-muted-foreground hover:border-primary'
                      }`}>
                        {selectedRole === role && (
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        )}
                      </div>
                      <span className={`text-sm font-medium transition-colors ${
                        selectedRole === role ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {role}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto transition-all duration-300">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left justify-start h-auto p-4 bg-transparent hover:bg-primary/5 border border-border hover:border-primary/20"
                      onClick={() => handleQuickAction(action.prompt)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-primary">
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium text-foreground text-sm mb-1">{action.title}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            ref={chatContainerRef} 
            className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full pb-80"
          >
            
            {messages.map((message, index) => (
              <div key={message.id} id={`message-${message.id}`} data-message-id={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === "user" ? "bg-blue-500 dark:bg-blue-600 text-white" : "bg-card"
                  }`}
                >
                  {message.role === "user" ? (
                    <div>
                      {message.file && (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-primary-foreground/10 rounded border">
                          <span className="text-lg">{getFileIcon(message.file.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{message.file.name}</p>
                            <p className="text-xs opacity-70">{formatFileSize(message.file.size)}</p>
                          </div>
                        </div>
                      )}
                      
                      {message.files && message.files.length > 0 && (
                        <div className="mb-2 p-2 bg-primary-foreground/10 rounded border">
                          <p className="text-sm font-medium mb-2">{message.files.length} files attached:</p>
                          <div className="space-y-1">
                            {message.files.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-1">
                                <span className="text-sm">{getFileIcon(file.type)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{file.name}</p>
                                  <p className="text-xs opacity-70">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {editingMessageId === message.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full min-h-20 p-2 text-sm bg-primary-foreground/10 text-primary-foreground rounded border border-primary-foreground/20 focus:outline-none focus:border-primary-foreground/40 resize-none"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveEditedMessage(message.id, false)}
                              className="h-7 px-2 text-xs text-primary-foreground hover:bg-primary-foreground/10"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveEditedMessage(message.id, true)}
                              className="h-7 px-2 text-xs text-primary-foreground hover:bg-primary-foreground/10"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Save & Regenerate
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditingMessage}
                              className="h-7 px-2 text-xs text-primary-foreground hover:bg-primary-foreground/10"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap font-bold italic">{message.content}</p>
                        </div>
                      )}
                      
                      {/* Action buttons for user messages */}
                      {editingMessageId !== message.id && (
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Primary actions */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="h-6 px-2 text-xs text-primary-foreground hover:bg-primary-foreground/10"
                            title="Copy message"
                          >
                            {copiedMessageId === message.id ? (
                              <CheckCheck className="w-3 h-3 mr-1" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {copiedMessageId === message.id ? "Copied" : "Copy"}
                          </Button>
                          <div className="relative">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowThreadSaveModal(true)}
                              className="h-6 px-2 text-xs text-primary-foreground hover:bg-primary-foreground/10"
                              title="Save conversation thread"
                            >
                              <MessageCircle className="w-3 h-3 mr-1" />
                              Save Project
                            </Button>

                            {/* New User Tooltip */}
                            {showProjectTooltip && index === 0 && (
                              <div className="absolute left-0 bottom-full mb-2 w-64 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
                                <button
                                  onClick={dismissProjectTooltip}
                                  className="absolute top-2 right-2 text-white/80 hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <div className="pr-6">
                                  <p className="text-sm font-medium mb-1">💡 Tip: Save Your Work!</p>
                                  <p className="text-xs leading-relaxed">
                                    Click "Save Project" anytime to save this conversation with AI-suggested titles and descriptions.
                                  </p>
                                </div>
                                <div className="absolute bottom-0 left-8 transform translate-y-1/2 rotate-45 w-3 h-3 bg-blue-600"></div>
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditingMessage(message.id, message.content)}
                            className="h-6 px-2 text-xs text-primary-foreground hover:bg-primary-foreground/10"
                            title="Edit message"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>

                          {/* More menu */}
                          <div className="relative">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setOpenMessageMoreMenu(openMessageMoreMenu === message.id ? null : message.id)}
                              className="h-6 px-2 text-xs text-primary-foreground hover:bg-primary-foreground/10"
                              title="More actions"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>

                            {openMessageMoreMenu === message.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setOpenMessageMoreMenu(null)}
                                />
                                <div className="absolute right-0 bottom-full mb-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50 py-1">
                                  <button
                                    onClick={() => {
                                      toggleBookmark(message)
                                      setOpenMessageMoreMenu(null)
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                  >
                                    {message.isBookmarked ? (
                                      <BookmarkCheck className="w-3 h-3" />
                                    ) : (
                                      <Bookmark className="w-3 h-3" />
                                    )}
                                    {message.isBookmarked ? "Remove Bookmark" : "Bookmark"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      printMessage(message.content, message.id)
                                      setOpenMessageMoreMenu(null)
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                  >
                                    <Printer className="w-3 h-3" />
                                    Print
                                  </button>
                                  <button
                                    onClick={() => {
                                      preparePrivateNote(message)
                                      setOpenMessageMoreMenu(null)
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                  >
                                    <FolderOpen className="w-3 h-3" />
                                    Client Note
                                  </button>
                                  <div className="border-t border-border my-1" />
                                  <button
                                    onClick={() => {
                                      deleteMessagePair(index)
                                      setOpenMessageMoreMenu(null)
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="group">
                      <MarkdownRenderer content={message.content} />
                      {/* Action buttons for assistant messages */}
                      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Primary actions */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="h-6 px-2 text-xs text-muted-foreground hover:bg-muted"
                          title="Copy message"
                        >
                          {copiedMessageId === message.id ? (
                            <CheckCheck className="w-3 h-3 mr-1" />
                          ) : (
                            <Copy className="w-3 h-3 mr-1" />
                          )}
                          {copiedMessageId === message.id ? "Copied" : "Copy"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowThreadSaveModal(true)}
                          className="h-6 px-2 text-xs text-muted-foreground hover:bg-muted"
                          title="Save conversation thread"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Save Project
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => shareReport(message)}
                          disabled={shareReportLoading === message.id}
                          className="h-6 px-2 text-xs text-muted-foreground hover:bg-muted"
                          title="Share as report link"
                        >
                          {shareReportLoading === message.id ? (
                            <div className="animate-spin w-3 h-3 mr-1 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Share2 className="w-3 h-3 mr-1" />
                          )}
                          {shareReportLoading === message.id ? "Sending..." : "Send to Client"}
                        </Button>

                        {/* More menu */}
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setOpenMessageMoreMenu(openMessageMoreMenu === message.id ? null : message.id)}
                            className="h-6 px-2 text-xs text-muted-foreground hover:bg-muted"
                            title="More actions"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </Button>

                          {openMessageMoreMenu === message.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenMessageMoreMenu(null)}
                              />
                              <div className="absolute left-0 bottom-full mb-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50 py-1">
                                <button
                                  onClick={() => {
                                    toggleBookmark(message)
                                    setOpenMessageMoreMenu(null)
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                >
                                  {message.isBookmarked ? (
                                    <BookmarkCheck className="w-3 h-3" />
                                  ) : (
                                    <Bookmark className="w-3 h-3" />
                                  )}
                                  {message.isBookmarked ? "Remove Bookmark" : "Bookmark"}
                                </button>
                                <button
                                  onClick={() => {
                                    printMessage(message.content, message.id)
                                    setOpenMessageMoreMenu(null)
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                >
                                  <Printer className="w-3 h-3" />
                                  Print
                                </button>
                                <button
                                  onClick={() => {
                                    preparePrivateNote(message)
                                    setOpenMessageMoreMenu(null)
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                >
                                  <FolderOpen className="w-3 h-3" />
                                  Client Note
                                </button>
                                <div className="border-t border-border my-1" />
                                <button
                                  onClick={() => {
                                    deleteMessagePair(index)
                                    setOpenMessageMoreMenu(null)
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <p
                    className={`text-xs mt-2 ${
                      message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {message.createdAt.toLocaleDateString()} at {message.createdAt.toLocaleTimeString()}
                  </p>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
                <Card className="p-7 bg-card/95 shadow-2xl border-4 border-green-500 backdrop-blur-sm">
                  <div className="flex flex-col gap-4 items-center">
                    <span className="text-lg font-medium text-white">Working on it...</span>
                    <div className="flex gap-2.5">
                      <div className="w-4 h-4 rounded-full animate-bounce" style={{ backgroundColor: '#6B7280', animationDelay: '0ms' }}></div>
                      <div className="w-4 h-4 rounded-full animate-bounce" style={{ backgroundColor: '#6B7280', animationDelay: '150ms' }}></div>
                      <div className="w-4 h-4 rounded-full animate-bounce" style={{ backgroundColor: '#6B7280', animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to bottom button - show when auto-scroll is paused */}
        {isAutoScrollPaused && messages.length > 0 && (
          <Button
            onClick={() => scrollToBottom(true, true)}
            className="fixed bottom-20 right-6 z-40 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground p-3 h-12 w-12"
            size="sm"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
        )}

        {/* Input Area - Only show when there are messages */}
        {messages.length > 0 && (
          <div 
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md shadow-2xl transition-all duration-300 ease-out"
          >
            <div className="max-w-6xl mx-auto p-6">
              {/* Upload Error */}
              {uploadError && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{uploadError}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadError(null)}
                    className="ml-auto h-auto p-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Uploaded File Preview */}
              {uploadedFile && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 border border-green-200 rounded">
                  <span className="text-lg">{getFileIcon(uploadedFile.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-green-600">{formatFileSize(uploadedFile.size)} • Ready for analysis</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeUploadedFile}
                    className="h-auto p-1 text-green-600 hover:text-green-800"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Multiple Uploaded Files Preview */}
              {uploadedFiles.length > 0 && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-800">
                      {uploadedFiles.length} file(s) ready for analysis
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeUploadedFiles}
                      className="h-auto p-1 text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <span className="text-sm">{getFileIcon(file.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-green-800 truncate">{file.name}</p>
                          <p className="text-xs text-green-600">{formatFileSize(file.size)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIndividualFile(index)}
                          className="h-auto p-1 text-green-600 hover:text-green-800"
                        >
                          <X className="w-2 h-2" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                
                {/* Search History Toggle */}
                <div className="flex justify-center mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      id="searchHistory2" 
                      checked={searchMyHistory}
                      onChange={(e) => setSearchMyHistory(e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <label htmlFor="searchHistory2" className="text-muted-foreground cursor-pointer">
                      Search my client history only
                    </label>
                  </div>
                </div>

                
                <div className="flex justify-center">
                  <div className="flex-1 relative max-w-2xl">
                    <textarea
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setInputHasFocus(true)}
                      onBlur={() => setInputHasFocus(false)}
                      placeholder="Want to dive deeper or explore something else?"
                      className="pr-10 min-h-32 h-32 w-full rounded-md border border-input !bg-gray-200 dark:!bg-gray-700 px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-green-500 focus-visible:ring-green-500/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y text-center placeholder:text-center"
                      disabled={isLoading || !apiStatus?.hasApiKey}
                    />
                  </div>
                </div>
                
              </form>
              
              {/* Control Panel - Simplified Single Row Layout */}
              <div className="flex justify-center mt-4 px-2">
                <div className="flex flex-wrap justify-center gap-2 max-w-full">
                  {/* File Upload Button */}
                  <div className="relative">
                    <FastTooltip content="Upload multiple files (up to 5)">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLoading || !apiStatus?.hasApiKey || isUploading}
                        onClick={() => {
                          multiFileInputRef.current?.click()
                        }}
                        className="text-xs"
                      >
                        {isUploading ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Paperclip className="w-4 h-4" />
                        )}
                      </Button>
                    </FastTooltip>
                  </div>
                  
                  <FastTooltip content="Extract text from PDF">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isLoading || !apiStatus?.hasApiKey}
                      onClick={() => setShowPDFExtractor(true)}
                      className="text-xs"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </FastTooltip>
                  
                  {/* Speech-to-Text Button */}
                  <FastTooltip content={isListening ? 'Stop voice recording' : 'Start voice recording'}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isLoading || !apiStatus?.hasApiKey}
                      onClick={toggleSpeechRecognition}
                      className={`w-20 h-9 text-xs transition-all ${isListening ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50' : ''}`}
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4 animate-pulse" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                  </FastTooltip>

                  {/* Clients Button */}
                  <FastTooltip content="Manage clients">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClientManagementModal(true)}
                      className="h-9 text-xs flex items-center justify-center gap-1 px-3"
                    >
                      <Building2 className="w-3 h-3" />
                      Clients
                    </Button>
                  </FastTooltip>

                  {/* Client Notes Button */}
                  <FastTooltip content="Create a client note without using AI">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClientNotesModal(true)}
                      className="h-9 text-xs flex items-center justify-center gap-1 px-3"
                    >
                      <StickyNote className="w-3 h-3" />
                      Client Notes
                    </Button>
                  </FastTooltip>

                  {/* Projects Button */}
                  <FastTooltip content="Manage projects">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowThreadManagementModal(true)}
                      className="h-9 text-xs flex items-center justify-center gap-1 px-3"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Projects
                    </Button>
                  </FastTooltip>

                  {/* Submit Button */}
                  <FastTooltip content="Send Message - Send your message to the AI">
                    <Button
                      type="submit"
                      variant="default"
                      size="sm"
                      disabled={(!input.trim() && !isListening) || isLoading || !apiStatus?.hasApiKey}
                      onClick={handleSubmit}
                      className={`w-20 h-9 text-xs text-primary-foreground transition-colors ${
                        (inputHasFocus && input.trim()) || isListening
                          ? 'bg-green-400 hover:bg-green-500'
                          : 'bg-primary hover:bg-primary/90'
                      }`}
                    >
                     Send ▲
                    </Button>
                  </FastTooltip>

                  {/* New Chat Button */}
                  <FastTooltip content="Start a new conversation">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startNewChat}
                      className="w-20 h-9 text-xs flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      New
                    </Button>
                  </FastTooltip>
                </div>
              </div>
              
              <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">
                  Upload: Excel, CSV, Word, TXT (max 10MB each, up to 5 files)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={multiFileInputRef}
          type="file"
          onChange={handleMultipleFileUpload}
          className="hidden"
          multiple
          accept=".xlsx,.xls,.csv,.docx,.doc,.txt"
        />
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onUploadSuccess={() => {
          console.log('File uploaded successfully')
        }}
        userEmail={userEmail || undefined}
      />

      {/* Chat History Modal */}
      <ChatHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        onLoadSession={loadChatSession}
        onDeleteSession={deleteChatSession}
        onStartNewChat={startNewChat}
        onClearAll={clearAllChatSessions}
      />

      {/* Bookmarks Modal */}
      <BookmarksModal
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        bookmarkedMessages={bookmarkedMessages}
        onRemoveBookmark={removeBookmark}
        onCopyMessage={copyToClipboard}
        onContinueConversation={jumpToBookmarkedMessage}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        userEmail={userEmail}
      />

      {/* Custom Instructions Modal */}
      <CustomInstructionsModal
        isOpen={showCustomInstructions}
        onClose={() => setShowCustomInstructions(false)}
        userEmail={userEmail || ''}
      />

      {/* Communications Modal */}
      <CommunicationsModal
        isOpen={showCommunications}
        onClose={() => {
          setShowCommunications(false)
          // Refresh communications count when modal closes
          setTimeout(() => {
            if (userEmail) {
              fetch(`/api/communications?userEmail=${encodeURIComponent(userEmail)}&type=all`)
                .then(res => res.json())
                .then(data => {
                  if (data.success) {
                    setCommunicationsCount(data.count || 0)
                  }
                })
                .catch(error => console.error('Error refreshing communications count:', error))
            }
          }, 500)
        }}
        userEmail={userEmail || ''}
        onReadUpdate={() => {
          // Refresh admin badge count when updates are marked as read
          fetchAdminFeedbackCount()
        }}
      />

      {/* Admin Communications Modal */}
      <AdminCommunicationsModal
        isOpen={showAdminCommunications}
        onClose={() => {
          setShowAdminCommunications(false)
          // Refresh counts when admin modal closes
          setTimeout(() => {
            const fetchCounts = async () => {
              if (userEmail) {
                try {
                  const [commsResponse, adminResponse] = await Promise.all([
                    fetch(`/api/communications?userEmail=${encodeURIComponent(userEmail)}&type=all`),
                    userPermissions.includes('admin') ? fetch(`/api/admin-feedback-count?userEmail=${encodeURIComponent(userEmail)}`) : null
                  ])
                  
                  const commsData = await commsResponse.json()
                  if (commsData.success) {
                    setCommunicationsCount(commsData.count || 0)
                  }
                  
                  if (adminResponse) {
                    const adminData = await adminResponse.json()
                    if (adminData.success) {
                      setAdminFeedbackCount(adminData.unrespondedCount || 0)
                    }
                  }
                } catch (error) {
                  console.error('Error refreshing counts:', error)
                }
              }
            }
            fetchCounts()
          }, 500)
        }}
        userEmail={userEmail || ''}
      />

      {/* PDF Text Extractor Modal */}
      <PDFTextExtractorModal
        isOpen={showPDFExtractor}
        onClose={() => setShowPDFExtractor(false)}
        onTextExtracted={(text) => {
          // Set the extracted text as the input
          setInput(text)
          // Close the modal
          setShowPDFExtractor(false)
        }}
      />

      {/* Share Report Modal */}
      <ShareReportModal
        isOpen={showShareReportModal}
        onClose={() => setShowShareReportModal(false)}
        shareableUrl={sharedReportUrl}
        reportTitle={currentSharedReportTitle}
      />

      {/* Client Comms Modal */}
      <MyReportsModal
        isOpen={showMyReportsModal}
        onClose={() => setShowMyReportsModal(false)}
        userEmail={userEmail}
        onEditContent={handleEditReportContent}
      />

      {/* Activity Report Modal */}
      <ActivityReportModal
        isOpen={showActivityReportModal}
        onClose={() => setShowActivityReportModal(false)}
        userEmail={userEmail}
        workspaceOwner={workspaceOwner}
      />

      {/* Report Details Modal */}
      <ReportDetailsModal
        isOpen={showReportDetailsModal}
        onClose={() => {
          setShowReportDetailsModal(false)
          setCurrentMessageToShare(null)
        }}
        onShare={handleShareWithDetails}
        isSharing={shareReportLoading === currentMessageToShare?.id}
        reportContent={currentMessageToShare?.content}
        userEmail={userEmail || undefined}
        workspaceOwner={workspaceOwner}
        onOpenClientModal={() => setShowClientManagementModal(true)}
      />

      {/* Private Notes Modal */}
      {showPrivateNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Save Private Note</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPrivateNoteModal(false)
                  setPrivateNoteContent('')
                  setPrivateNoteClient('')
                  setPrivateNoteTitle('')
                  setPrivateNoteModalKey(prev => prev + 1) // Reset autocomplete on close
                }}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium mb-1">
                  Client Name *
                </label>
                <ClientAutocomplete
                  key={`client-note-${privateNoteModalKey}`}
                  value={privateNoteClient}
                  onValueChange={setPrivateNoteClient}
                  userEmail={userEmail || ''}
                  workspaceOwner={workspaceOwner}
                  placeholder="Select existing client..."
                  className="w-full"
                  onOpenClientModal={() => setShowClientManagementModal(true)}
                  autoOpen={true}
                />
              </div>
              
              <div>
                <label htmlFor="noteTitle" className="block text-sm font-medium mb-1">
                  Title (optional)
                </label>
                <Input
                  id="noteTitle"
                  type="text"
                  value={privateNoteTitle}
                  onChange={(e) => setPrivateNoteTitle(e.target.value)}
                  placeholder="Optional note title..."
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="noteContent" className="block text-sm font-medium mb-1">
                  Content *
                </label>
                <textarea
                  id="noteContent"
                  value={privateNoteContent}
                  onChange={(e) => setPrivateNoteContent(e.target.value)}
                  placeholder="Note content..."
                  className="w-full min-h-[200px] p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={8}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPrivateNoteModal(false)
                  setPrivateNoteContent('')
                  setPrivateNoteClient('')
                  setPrivateNoteTitle('')
                  setPrivateNoteModalKey(prev => prev + 1) // Reset autocomplete on close
                }}
                disabled={savingPrivateNote}
              >
                Cancel
              </Button>
              <Button
                onClick={savePrivateNote}
                disabled={savingPrivateNote || !privateNoteClient.trim() || !privateNoteContent.trim()}
                className="min-w-[100px]"
              >
                {savingPrivateNote ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  'Save Note'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Client Notes Modal */}
      {showClientNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Client Note</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowClientNotesModal(false)
                  setPrivateNoteContent('')
                  setPrivateNoteClient('')
                  setPrivateNoteTitle('')
                }}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="clientNoteClientName" className="block text-sm font-medium mb-1">
                  Client Name *
                </label>
                <ClientAutocomplete
                  value={privateNoteClient}
                  onValueChange={setPrivateNoteClient}
                  userEmail={userEmail || ''}
                  workspaceOwner={workspaceOwner}
                  placeholder="Select existing client..."
                  className="w-full"
                  onOpenClientModal={() => setShowClientManagementModal(true)}
                />
              </div>

              <div>
                <label htmlFor="clientNoteTitle" className="block text-sm font-medium mb-1">
                  Title *
                </label>
                <Input
                  id="clientNoteTitle"
                  type="text"
                  value={privateNoteTitle}
                  onChange={(e) => setPrivateNoteTitle(e.target.value)}
                  placeholder="e.g., Advertising expense increase explanation..."
                  className="w-full bg-black dark:bg-black text-white placeholder:text-gray-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="clientNoteContent" className="block text-sm font-medium">
                    Note Content *
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleSpeechRecognition}
                    className={`h-8 px-3 text-xs transition-all ${isListening ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' : ''}`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3 h-3 mr-1 animate-pulse" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3 mr-1" />
                        Speak
                      </>
                    )}
                  </Button>
                </div>
                <textarea
                  id="clientNoteContent"
                  value={privateNoteContent}
                  onChange={(e) => setPrivateNoteContent(e.target.value)}
                  placeholder="Enter your note here or click 'Speak' to use voice input..."
                  className="w-full min-h-[200px] p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {isListening && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Listening... speak now
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowClientNotesModal(false)
                  setPrivateNoteContent('')
                  setPrivateNoteClient('')
                  setPrivateNoteTitle('')
                }}
                disabled={savingPrivateNote}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await savePrivateNote()
                  setShowClientNotesModal(false)
                }}
                disabled={savingPrivateNote || !privateNoteClient.trim() || !privateNoteTitle.trim() || !privateNoteContent.trim()}
                className="min-w-[100px]"
              >
                {savingPrivateNote ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  'Save Note'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Thread Save Modal */}
      <ThreadSaveModal
        isOpen={showThreadSaveModal}
        onClose={() => setShowThreadSaveModal(false)}
        messages={messages}
        userEmail={userEmail}
        workspaceOwner={workspaceOwner}
        loadedThread={loadedThread}
        onThreadSaved={(updatedMetadata, threadData) => {
          // If threadData is provided, this is a NEW project being saved - set loadedThread
          if (threadData) {
            setLoadedThread(threadData)
          }
          // If updatedMetadata is provided, this is an UPDATE to existing project - sync metadata
          else if (updatedMetadata && loadedThread) {
            setLoadedThread({
              ...loadedThread,
              metadata: {
                ...loadedThread.metadata,
                ...updatedMetadata
              }
            })
          }
        }}
        onOpenClientModal={() => setShowClientManagementModal(true)}
      />

      {/* Thread Management Modal */}
      <ThreadManagementModal
        isOpen={showThreadManagementModal}
        onClose={() => setShowThreadManagementModal(false)}
        userEmail={userEmail}
        workspaceOwner={workspaceOwner}
        onLoadThread={handleLoadThread}
      />

      {/* Client Management Modal */}
      <ClientManagementModal
        isOpen={showClientManagementModal}
        onClose={() => setShowClientManagementModal(false)}
        userEmail={userEmail}
        workspaceOwner={workspaceOwner}
        onLoadThread={handleLoadThread}
        onEditContent={handleEditReportContent}
      />

    </div>
  )
}