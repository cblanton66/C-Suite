"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, FileText, Upload, Copy, CheckCircle, AlertCircle } from "lucide-react"

interface PDFTextExtractorModalProps {
  isOpen: boolean
  onClose: () => void
  onTextExtracted: (text: string) => void
}

export function PDFTextExtractorModal({ isOpen, onClose, onTextExtracted }: PDFTextExtractorModalProps) {
  const [extractedText, setExtractedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const extractTextFromPDF = async (file: File) => {
    setIsProcessing(true)
    setError('')
    setExtractedText('')

    try {
      // Create FormData to send file to server
      const formData = new FormData()
      formData.append('file', file)
      
      // Send to server-side API for processing
      const response = await fetch('/api/extract-pdf-text', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract text from PDF')
      }
      
      if (data.success && data.text) {
        setExtractedText(data.text)
      } else {
        throw new Error('No text could be extracted from the PDF')
      }
      
    } catch (err) {
      console.error('PDF extraction error:', err)
      setError(err.message || 'Failed to extract text from PDF')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file.')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File is too large. Please select a PDF under 10MB.')
      return
    }
    
    extractTextFromPDF(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const copyToChat = async () => {
    if (!extractedText) return
    
    try {
      await navigator.clipboard.writeText(extractedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      
      // Also call the callback to paste into chat
      onTextExtracted(extractedText)
      
      // Close modal after successful copy
      setTimeout(() => {
        onClose()
        setExtractedText('')
        setError('')
      }, 1000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const reset = () => {
    setExtractedText('')
    setError('')
    setCopied(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-4xl mx-4 max-h-[90vh] shadow-2xl border-2 border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-700" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">PDF Text Extractor</h2>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!extractedText && !isProcessing && (
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-input rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Upload PDF File
                </h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop your PDF here, or click to browse
                </p>
                <Button variant="outline">
                  Select PDF File
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum file size: 10MB
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Extracting text from PDF...</p>
              <p className="text-xs text-muted-foreground mt-2">This may take a few seconds</p>
            </div>
          )}

          {extractedText && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">Extracted Text</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={reset}>
                    Extract Another PDF
                  </Button>
                  <Button 
                    onClick={copyToChat}
                    disabled={copied}
                    className="min-w-[120px]"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy to Chat
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted/50 border border-input rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                  {extractedText}
                </pre>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Text has been formatted for optimal AI processing. Click "Copy to Chat" to paste into your conversation.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}