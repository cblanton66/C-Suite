"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Send, Calculator, FileText, TrendingUp, Home, Paperclip, X, Upload, File, AlertCircle, Plus, History, DollarSign, BarChart3, PieChart, Target, Download, Share2 } from "lucide-react"

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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
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
              <h1 className="text-2xl font-semibold text-foreground">PeakSuite.ai</h1>
            </div>
            <Link 
              href="/" 
              className="ml-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-6xl w-full mx-auto">
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Calculator className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">Your CFO Assistant</h2>
                <p className="text-muted-foreground mb-8 text-balance">
                  AI-powered executive intelligence for Performance, Efficiency, Analytics & Knowledge. Get expert CFO guidance on demand.
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

                  <form onSubmit={handleSubmit} className="flex gap-3 justify-center">
                    <div className="flex-1 relative max-w-lg">
                      <textarea
                        value={input}
                        onChange={handleInputChange}
                        placeholder="How can I help you today?"
                        className="pr-10 h-20 w-full rounded-md border border-input bg-gray-100 dark:bg-gray-800 px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-green-500 focus-visible:ring-green-500/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
                        disabled={isLoading || !apiStatus?.hasApiKey}
                      />
                    </div>
                    
                    {/* Upload Button */}
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
                      >
                        {isUploading ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Paperclip className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <Button type="submit" disabled={isLoading || !input.trim() || !apiStatus?.hasApiKey}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  
                  <div className="text-center mt-2 text-xs text-muted-foreground">
                    <span>Upload: PDF, Excel, CSV, Word, TXT (max 10MB)</span>
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
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"
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
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ) : (
                    <MarkdownRenderer content={message.content} />
                  )}
                  <p
                    className={`text-xs mt-2 ${
                      message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {message.createdAt.toLocaleTimeString()}
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
                    <span className="text-sm text-muted-foreground ml-2">Thinking...</span>
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

              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="How can I help you today?"
                    className="pr-10 h-20 w-full rounded-md border border-input bg-gray-100 dark:bg-gray-800 px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-green-500 focus-visible:ring-green-500/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
                    disabled={isLoading || !apiStatus?.hasApiKey}
                  />
                </div>
                
                {/* Upload Button */}
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
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <Button type="submit" disabled={isLoading || !input.trim() || !apiStatus?.hasApiKey}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              
              <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">
                  Upload: PDF, Excel, CSV, Word, TXT (max 10MB)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}