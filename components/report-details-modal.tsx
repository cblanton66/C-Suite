"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Share2, Calendar, User, Mail, FileText, Loader2 } from "lucide-react"

interface ReportDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  onShare: (details: ReportDetails) => void
  isSharing: boolean
}

interface ReportDetails {
  title: string
  clientName: string
  clientEmail: string
  description: string
  expiresAt: string
}

export function ReportDetailsModal({ isOpen, onClose, onShare, isSharing }: ReportDetailsModalProps) {
  const [title, setTitle] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [description, setDescription] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Set default title with today's date
      const today = new Date().toLocaleDateString()
      setTitle(`PeakSuite Reporting - ${today}`)
      
      // Set default description
      setDescription("AI-generated business intelligence report")
      
      // Set default expiration to 30 days from now
      const expiration = new Date()
      expiration.setDate(expiration.getDate() + 30)
      setExpiresAt(expiration.toISOString().split('T')[0])
      
      // Clear any errors
      setErrors({})
    }
  }, [isOpen])

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
      expiresAt: expiresAt || ""
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
          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <FileText className="w-4 h-4" />
              Report Title *
            </label>
            <Input
              type="text"
              placeholder="Enter report title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? "border-red-500" : ""}
              disabled={isSharing}
              required
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Client Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
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
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
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

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <Input
              type="text"
              placeholder="Brief description of the report"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSharing}
            />
          </div>

          {/* Expiration Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
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
    </div>
  )
}