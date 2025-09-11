"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Calculator, FileText, TrendingUp, Home, Paperclip, X, Upload, File, AlertCircle, Plus, History, DollarSign, BarChart3, PieChart, Target, Download, Share2, Edit3, Check, RotateCcw, Copy, CheckCheck, Bookmark, BookmarkCheck } from "lucide-react"

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
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<string>('')
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Message[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const multiFileInputRef = useRef<HTMLInputElement>(null)

  // Load chat history and current session on mount
  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then(setApiStatus)
      .catch(console.error)

    // Load chat sessions from localStorage
    if (typeof window !== 'undefined') {
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
      
      if (savedCurrentSession && savedSessions) {
        const sessions: ChatSession[] = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          lastUpdated: new Date(session.lastUpdated),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt)
          }))
        }))
        const currentSession = sessions.find(s => s.id === savedCurrentSession)
        if (currentSession) {
          setCurrentSessionId(savedCurrentSession)
          setMessages(currentSession.messages)
        } else {
          startNewChat()
        }
      } else if (!savedSessions) {
        startNewChat()
      }
    }
  }, [])

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

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && bookmarkedMessages.length >= 0) {
      localStorage.setItem('peaksuiteai_bookmarks', JSON.stringify(bookmarkedMessages))
    }
  }, [bookmarkedMessages])

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

  const startNewChat = () => {
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
      if (chatSessions.length > 1) {
        const remainingSessions = chatSessions.filter(s => s.id !== sessionId)
        loadChatSession(remainingSessions[0].id)
      } else {
        startNewChat()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !apiStatus?.hasApiKey) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const chatPayload = {
        messages: [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
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
      setUploadError('Unsupported file type. Please upload PDF, Excel, CSV, Word, or text files.')
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
        setUploadError(`File "${file.name}" has an unsupported type. Please upload PDF, Excel, CSV, Word, or text files.`)
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

  const quickActions = [
    {
      icon: <DollarSign className="w-4 h-4" />,
      title: "Cash Flow Forecast",
      description: "13-week cash flow projection",
      prompt: "Help me create a 13-week cash flow forecast. What information do you need from me to get started?"
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      title: "KPI Analysis", 
      description: "Key performance indicators",
      prompt: "I'd like to analyze my business KPIs. Can you help me identify the most important metrics for my industry and set up a tracking system?"
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: "Tax Planning",
      description: "Strategic tax optimization",
      prompt: "I need help with tax planning strategies for my business. What are the key considerations and deadlines I should be aware of?"
    },
    {
      icon: <PieChart className="w-4 h-4" />,
      title: "Financial Health Check",
      description: "Complete business assessment",
      prompt: "Can you perform a comprehensive financial health check of my business? What financial statements and data should I provide?"
    },
    {
      icon: <Target className="w-4 h-4" />,
      title: "Budget Planning",
      description: "Annual budget creation",
      prompt: "I need to create an annual budget for my business. Can you guide me through the process and help identify key budget categories?"
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Growth Modeling",
      description: "Scenario planning & projections",
      prompt: "Help me model different growth scenarios for my business. What variables should I consider and how do I build realistic projections?"
    }
  ]

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
  }

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
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedMessageId(messageId)
        setTimeout(() => setCopiedMessageId(null), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
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

  const exportConversationAsText = () => {
    const currentSession = chatSessions.find(s => s.id === currentSessionId)
    if (!currentSession) return

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

    // Create a simple HTML version for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${currentSession.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .message { margin-bottom: 25px; padding: 15px; border-radius: 8px; }
          .user { background-color: #e3f2fd; margin-left: 20%; }
          .assistant { background-color: #f5f5f5; margin-right: 20%; }
          .role { font-weight: bold; margin-bottom: 5px; text-transform: uppercase; font-size: 12px; }
          .timestamp { font-size: 11px; color: #666; margin-top: 10px; }
          .file { background-color: #fff3cd; padding: 8px; border-radius: 4px; margin-bottom: 10px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PeakSuite.ai Conversation</h1>
          <p><strong>Title:</strong> ${currentSession.title}</p>
          <p><strong>Date:</strong> ${currentSession.createdAt.toLocaleDateString()}</p>
          <p><strong>Messages:</strong> ${currentSession.messages.length}</p>
        </div>
    `

    currentSession.messages.forEach(message => {
      htmlContent += `
        <div class="message ${message.role}">
          <div class="role">${message.role}</div>
          ${message.file ? `<div class="file">📎 File: ${message.file.name} (${formatFileSize(message.file.size)})</div>` : ''}
          <div>${message.content.replace(/\\n/g, '<br>')}</div>
          <div class="timestamp">${message.createdAt.toLocaleString()}</div>
        </div>
      `
    })

    htmlContent += '</body></html>'

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

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-2xl font-semibold text-foreground">PeakSuite.ai</h1>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={startNewChat}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 relative"
            >
              <History className="w-4 h-4" />
              History
              {chatSessions.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {chatSessions.length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookmarks(!showBookmarks)}
              className="flex items-center gap-2 relative"
            >
              <Bookmark className="w-4 h-4" />
              Bookmarks
              {bookmarkedMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {bookmarkedMessages.length}
                </span>
              )}
            </Button>
            {messages.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportConversationAsText}
                  className="flex items-center gap-2"
                  title="Export as Text"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportConversationAsPDF}
                  className="flex items-center gap-2"
                  title="Export as HTML"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">HTML</span>
                </Button>
              </>
            )}
            <ThemeToggle />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${apiStatus?.hasApiKey ? "bg-green-500" : "bg-orange-500"}`}></div>
              <span>{apiStatus?.hasApiKey ? "Connected" : "API Key Required"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat History Dropdown */}
      {showHistory && (
        <div className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="max-h-60 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Recent Conversations</h3>
            {chatSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      session.id === currentSessionId ? 'bg-primary/10 border border-primary/20' : ''
                    }`}
                    onClick={() => loadChatSession(session.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.lastUpdated.toLocaleDateString()} • {session.messages.length} messages
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => deleteChatSession(session.id, e)}
                      className="h-auto p-1 ml-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bookmarks Dropdown */}
      {showBookmarks && (
        <div className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="max-h-60 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Bookmarked Messages</h3>
            {bookmarkedMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookmarked messages yet</p>
            ) : (
              <div className="space-y-3">
                {bookmarkedMessages.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => jumpToBookmarkedMessage(bookmark)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          bookmark.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {bookmark.role === 'user' ? 'You' : 'Assistant'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(bookmark as any).sessionTitle || 'Unknown Session'}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {bookmark.content.slice(0, 150)}{bookmark.content.length > 150 ? '...' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {bookmark.createdAt.toLocaleDateString()} at {bookmark.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeBookmark(bookmark.id)
                      }}
                      className="h-auto p-1 ml-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-6xl w-full mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-semibold text-foreground mb-3">The advantage is yours now.</h2>
                <p className="text-2xl text-muted-foreground mb-8 text-balance">
                  Let's get to work.
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
                    <div className="flex justify-center">
                      <div className="flex-1 relative max-w-lg">
                        <textarea
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="How can I help you today?"
                          className="pr-10 h-20 w-full rounded-md border border-input !bg-gray-200 dark:!bg-gray-700 px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-green-500 focus-visible:ring-green-500/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
                          disabled={isLoading || !apiStatus?.hasApiKey}
                        />
                      </div>
                    </div>
                    
                    {/* Centered Upload Buttons */}
                    <div className="flex justify-center">
                      <div className="flex gap-2">
                        {/* Single File Upload */}
                        <div className="relative">
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                            accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.txt"
                            disabled={isLoading || !apiStatus?.hasApiKey || isUploading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isLoading || !apiStatus?.hasApiKey || isUploading}
                            onClick={() => {
                              fileInputRef.current?.click()
                            }}
                            title="Upload single file"
                          >
                            {isUploading ? (
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Paperclip className="w-4 h-4" />
                            )}
                          </Button>
                        </div>

                        {/* Multiple Files Upload */}
                        <div className="relative">
                          <input
                            type="file"
                            ref={multiFileInputRef}
                            className="hidden"
                            onChange={handleMultipleFileUpload}
                            accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.txt"
                            multiple
                            disabled={isLoading || !apiStatus?.hasApiKey || isUploading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isLoading || !apiStatus?.hasApiKey || isUploading}
                            onClick={() => {
                              multiFileInputRef.current?.click()
                            }}
                            title="Upload multiple files (up to 5)"
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                  
                  <div className="text-center mt-2 text-xs text-muted-foreground">
                    <span>Upload: PDF, Excel, CSV, Word, TXT (max 10MB each, up to 5 files)</span>
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-6 mt-4"></div>
                <p className="text-base text-muted-foreground mb-8">
                  Use the Quick Actions to get started
                </p>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
            {messages.map((message) => (
              <div key={message.id} id={`message-${message.id}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === "user" ? "bg-gray-400 dark:bg-gray-500 text-foreground" : "bg-card"
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
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                      )}
                      
                      {/* Action buttons for user messages */}
                      {editingMessageId !== message.id && (
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleBookmark(message)}
                            className="h-6 px-2 text-xs text-primary-foreground hover:bg-primary-foreground/10"
                            title={message.isBookmarked ? "Remove bookmark" : "Bookmark message"}
                          >
                            {message.isBookmarked ? (
                              <BookmarkCheck className="w-3 h-3 mr-1" />
                            ) : (
                              <Bookmark className="w-3 h-3 mr-1" />
                            )}
                            {message.isBookmarked ? "Bookmarked" : "Bookmark"}
                          </Button>
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
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="group">
                      <MarkdownRenderer content={message.content} />
                      {/* Action buttons for assistant messages */}
                      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleBookmark(message)}
                          className="h-6 px-2 text-xs text-muted-foreground hover:bg-muted"
                          title={message.isBookmarked ? "Remove bookmark" : "Bookmark message"}
                        >
                          {message.isBookmarked ? (
                            <BookmarkCheck className="w-3 h-3 mr-1" />
                          ) : (
                            <Bookmark className="w-3 h-3 mr-1" />
                          )}
                          {message.isBookmarked ? "Bookmarked" : "Bookmark"}
                        </Button>
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
              <div className="flex justify-start">
                <Card className="max-w-[80%] p-4 bg-card">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200"></div>
                    <span className="text-sm text-muted-foreground ml-2">Working on it...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Input Area - Only show when there are messages */}
        {messages.length > 0 && (
          <div className="border-t border-border bg-card/50 backdrop-blur-sm p-6">
            <div className="max-w-6xl mx-auto">
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
                <div className="flex justify-center">
                  <div className="flex-1 relative max-w-lg">
                    <textarea
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="How can I help you today?"
                      className="pr-10 h-20 w-full rounded-md border border-input !bg-gray-200 dark:!bg-gray-700 px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-green-500 focus-visible:ring-green-500/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
                      disabled={isLoading || !apiStatus?.hasApiKey}
                    />
                  </div>
                </div>
                
                {/* Centered Upload Buttons */}
                <div className="flex justify-center">
                  <div className="flex gap-2">
                    {/* Single File Upload */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading || !apiStatus?.hasApiKey || isUploading}
                        onClick={() => {
                          fileInputRef.current?.click()
                        }}
                        title="Upload single file"
                      >
                        {isUploading ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Paperclip className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Multiple Files Upload */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading || !apiStatus?.hasApiKey || isUploading}
                        onClick={() => {
                          multiFileInputRef.current?.click()
                        }}
                        title="Upload multiple files (up to 5)"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
              
              <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">
                  Upload: PDF, Excel, CSV, Word, TXT (max 10MB each, up to 5 files)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}