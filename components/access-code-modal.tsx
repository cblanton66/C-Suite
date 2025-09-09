"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Lock, AlertCircle } from "lucide-react"

interface AccessCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const ACCESS_CODE = "goldstar"
const SESSION_KEY = "csuiteai_access_granted"

export function AccessCodeModal({ isOpen, onClose, onSuccess }: AccessCodeModalProps) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Only check if user already has access when the modal is actually opened
    if (isOpen && typeof window !== 'undefined') {
      const hasAccess = sessionStorage.getItem(SESSION_KEY) === 'true'
      if (hasAccess) {
        onSuccess()
        return
      }
    }
  }, [isOpen, onSuccess])

  useEffect(() => {
    if (!isOpen) {
      setCode("")
      setError("")
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    // Simulate a brief loading state for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    if (code.toLowerCase().trim() === ACCESS_CODE.toLowerCase()) {
      // Store access in session storage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, 'true')
      }
      onSuccess()
      onClose()
    } else {
      setError("Invalid access code. Please try again.")
      setCode("")
    }
    
    setIsSubmitting(false)
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
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
      <Card className="relative w-full max-w-md mx-4 p-6 shadow-2xl border-2 border-primary/20">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute right-2 top-2 h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Early Access</h2>
          <p className="text-muted-foreground">
            Enter your access code to continue
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Enter access code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isSubmitting}
              className="text-center text-lg tracking-wider"
              autoFocus
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </form>

        {/* Beta Note */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            This is a beta version of C-Suite AI. Access codes are provided to early testers.
          </p>
        </div>
      </Card>
    </div>
  )
}