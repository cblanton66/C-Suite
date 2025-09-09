"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Send, Calculator, FileText, TrendingUp, Home, Paperclip, X, Upload, File, AlertCircle } from "lucide-react"

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then(setApiStatus)
      .catch(console.error)
  }, [])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const suggestedQuestions = [
    "What are the 2024 tax brackets?",
    "How do I calculate quarterly estimated taxes?",
    "What business expenses are deductible?",
    "Help me project my tax liability",
  ]

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">C-Suite AI</h1>
              <p className="text-sm text-muted-foreground">Your Virtual CFO</p>
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
            <ThemeToggle />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${apiStatus?.hasApiKey ? "bg-green-500" : "bg-orange-500"}`}></div>
              <span>{apiStatus?.hasApiKey ? "Connected" : "API Key Required"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-2xl">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">Your CFO Assistant</h2>
              <p className="text-muted-foreground mb-8 text-balance">
                Your AI-powered tax research and projection assistant. Get expert guidance on tax planning, deductions,
                compliance, and financial projections.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left justify-start h-auto p-4 text-wrap bg-transparent"
                    onClick={() => setInput(question)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index === 0 && <FileText className="w-3 h-3 text-primary" />}
                        {index === 1 && <Calculator className="w-3 h-3 text-primary" />}
                        {index === 2 && <TrendingUp className="w-3 h-3 text-primary" />}
                        {index === 3 && <FileText className="w-3 h-3 text-primary" />}
                      </div>
                      <span className="text-sm">{question}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

        {/* Input Area */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
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
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about financial analysis, tax strategies, or upload documents..."
                className="pr-10"
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
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {apiStatus?.hasApiKey
                ? "C-Suite AI is ready to help with financial analysis and document review"
                : "Add your XAI API key in environment variables to enable AI responses"}
            </p>
            <p className="text-xs text-muted-foreground">
              Upload: PDF, Excel, CSV, Word, TXT (max 10MB)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
