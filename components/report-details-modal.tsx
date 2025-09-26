"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Share2, Calendar, User, Mail, FileText, Loader2, MessageCircle, Upload, Paperclip, CheckCircle } from "lucide-react"

interface ReportDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  onShare: (details: ReportDetails) => void
  isSharing: boolean
  reportContent?: string
}

interface ReportDetails {
  title: string
  clientName: string
  clientEmail: string
  description: string
  expiresAt: string
  allowResponses: boolean
  reportAttachments?: Array<{
    fileId: string
    name: string
    originalName: string
    size: number
    type: string
    uploadedAt: string
  }>
}

export function ReportDetailsModal({ isOpen, onClose, onShare, isSharing, reportContent }: ReportDetailsModalProps) {
  const [title, setTitle] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [description, setDescription] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [allowResponses, setAllowResponses] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    fileId: string
    name: string
    originalName: string
    size: number
    type: string
    uploadedAt: string
  }>>([])
  const [uploading, setUploading] = useState(false)
  const [reportId] = useState(() => `rpt_temp_${Date.now()}`) // Temporary ID for uploads
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Function to fetch AI suggestions
  const fetchAISuggestions = async (content: string) => {
    console.log('🎯 [CLIENT] Starting AI suggestions fetch for content length:', content.length)
    setIsGeneratingSuggestions(true)
    
    try {
      console.log('📤 [CLIENT] Making fetch request to /api/suggest-report-details')
      const response = await fetch('/api/suggest-report-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      console.log('📥 [CLIENT] Response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      const data = await response.json()
      console.log('📊 [CLIENT] Response data:', data)

      if (data.success && data.suggestions) {
        console.log('✅ [CLIENT] Successfully applying AI suggestions:', data.suggestions)
        setTitle(data.suggestions.title)
        setDescription(data.suggestions.description)
      } else {
        console.log('❌ [CLIENT] Invalid response format or no success flag:', data)
      }
    } catch (error) {
      console.error('💥 [CLIENT] Error fetching AI suggestions:', error)
      console.error('💥 [CLIENT] Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      })
      // Keep default values if AI fails
    } finally {
      console.log('🏁 [CLIENT] AI suggestions fetch complete')
      setIsGeneratingSuggestions(false)
    }
  }

  // File upload functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Validate file sizes (10MB max each)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const invalidFiles = Array.from(files).filter(file => file.size > maxSize)
    
    if (invalidFiles.length > 0) {
      alert(`The following files exceed the 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}`)
      return
    }

    setUploading(true)
    const uploadedFilesList: typeof uploadedFiles = []
    
    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('reportId', reportId)

        const response = await fetch('/api/upload-report-file', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`)
        }

        uploadedFilesList.push(data.file)
      }

      setUploadedFiles(prev => [...prev, ...uploadedFilesList])
      
      // Show modern success notification
      const message = `Successfully uploaded ${uploadedFilesList.length} file${uploadedFilesList.length > 1 ? 's' : ''}!`
      setSuccessMessage(message)
      setShowSuccessNotification(true)
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setShowSuccessNotification(false)
      }, 3000)
    } catch (err) {
      console.error('Error uploading files:', err)
      alert(err instanceof Error ? err.message : 'Failed to upload files')
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.fileId !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Set default expiration to 2 days from now (using local time)
      const expiration = new Date()
      expiration.setDate(expiration.getDate() + 2)
      const year = expiration.getFullYear()
      const month = String(expiration.getMonth() + 1).padStart(2, '0')
      const day = String(expiration.getDate()).padStart(2, '0')
      setExpiresAt(`${year}-${month}-${day}`)
      
      // Clear any errors
      setErrors({})

      // Try to get AI suggestions if content is available
      if (reportContent && reportContent.trim()) {
        fetchAISuggestions(reportContent)
      } else {
        // Fallback to default values
        const today = new Date().toLocaleDateString()
        setTitle(`Business Report - ${today}`)
        setDescription("AI-generated business intelligence report")
      }
    }
  }, [isOpen, reportContent])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!title.trim()) {
      newErrors.title = "Title is required"
    }

    if (clientEmail.trim() && !isValidEmail(clientEmail)) {
      newErrors.clientEmail = "Please enter a valid email address"
    }

    if (expiresAt) {
      const expirationDate = new Date(expiresAt)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day for comparison
      
      if (expirationDate <= today) {
        newErrors.expiresAt = "Expiration date must be in the future"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const details: ReportDetails = {
      title: title.trim(),
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      description: description.trim(),
      expiresAt: expiresAt || "",
      allowResponses: allowResponses,
      reportAttachments: uploadedFiles
    }

    onShare(details)
  }

  const handleClose = () => {
    if (isSharing) return // Don't allow closing while sharing
    
    setTitle("")
    setClientName("")
    setClientEmail("")
    setDescription("")
    setExpiresAt("")
    setAllowResponses(false)
    setUploadedFiles([])
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-lg mx-4 shadow-2xl border-2 border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Share Report</h2>
              <p className="text-sm text-muted-foreground">Customize report details before sharing</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSharing}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Report Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-green-600 mb-2">
              <FileText className="w-4 h-4" />
              Report Title *
              {isGeneratingSuggestions && (
                <span className="text-xs text-blue-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  AI suggesting...
                </span>
              )}
            </label>
            <Input
              type="text"
              placeholder={isGeneratingSuggestions ? "AI is generating a title..." : "Enter report title"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? "border-red-500" : ""}
              disabled={isSharing || isGeneratingSuggestions}
              required
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Report Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-green-600 mb-2">
              <FileText className="w-4 h-4" />
              Report Description
              {isGeneratingSuggestions && (
                <span className="text-xs text-blue-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  AI suggesting...
                </span>
              )}
            </label>
            <Input
              type="text"
              placeholder={isGeneratingSuggestions ? "AI is generating a description..." : "Brief description of the report"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSharing || isGeneratingSuggestions}
            />
          </div>

          {/* Expiration Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-green-600 mb-2">
              <Calendar className="w-4 h-4" />
              Expiration Date
            </label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={errors.expiresAt ? "border-red-500" : ""}
              disabled={isSharing}
              min={new Date().toISOString().split('T')[0]} // Today as minimum
            />
            {errors.expiresAt && (
              <p className="text-sm text-red-500 mt-1">{errors.expiresAt}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for no expiration
            </p>
          </div>

          {/* Client Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-green-600 mb-2">
              <User className="w-4 h-4" />
              Client Name
            </label>
            <Input
              type="text"
              placeholder="Enter client or company name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={isSharing}
            />
          </div>

          {/* Client Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-green-600 mb-2">
              <Mail className="w-4 h-4" />
              Client Email
            </label>
            <Input
              type="email"
              placeholder="client@company.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className={errors.clientEmail ? "border-red-500" : ""}
              disabled={isSharing}
            />
            {errors.clientEmail && (
              <p className="text-sm text-red-500 mt-1">{errors.clientEmail}</p>
            )}
          </div>

          {/* Allow Responses */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <input
              type="checkbox"
              id="allowResponses"
              checked={allowResponses}
              onChange={(e) => setAllowResponses(e.target.checked)}
              disabled={isSharing}
              className="mt-0.5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <div className="flex-1">
              <label htmlFor="allowResponses" className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-300 cursor-pointer">
                <MessageCircle className="w-4 h-4" />
                Allow recipient to respond to this report
              </label>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Recipients can leave feedback and comments directly on the shared report
              </p>
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-green-600 mb-2">
              <Paperclip className="w-4 h-4" />
              Attach Files
            </label>
            
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:border-primary/50 transition-colors">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Click to upload files or drag and drop
                  </span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isSharing || uploading}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xls,.xlsx"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, TXT, Images, Excel files up to 10MB each
                </p>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading files...
              </div>
            )}

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Attached Files ({uploadedFiles.length})
                </p>
                {uploadedFiles.map((file) => (
                  <div key={file.fileId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Paperclip className="w-4 h-4 text-gray-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.fileId)}
                      disabled={isSharing}
                      className="text-red-500 hover:text-red-700 p-1 h-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSharing}
              className="flex-1"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isSharing}
              className="flex-1"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Report
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Modern Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-2 duration-300">
          <div className="bg-green-50 dark:bg-green-950/90 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Files Uploaded Successfully!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {successMessage}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuccessNotification(false)}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}