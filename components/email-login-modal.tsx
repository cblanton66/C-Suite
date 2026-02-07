"use client"

import { useState } from "react"
import { SessionManager } from "@/lib/session-manager"
import { VercelAnalytics } from "@/lib/vercel-analytics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Building2, Mail, Lock, CheckCircle, X, AlertCircle } from "lucide-react"

interface EmailLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onOpenWaitlist?: () => void
}

export function EmailLoginModal({ isOpen, onClose, onSuccess, onOpenWaitlist }: EmailLoginModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState("")

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email")
    } else {
      setEmailError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password) {
      setIsSubmitting(true)
      setError("")
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (response.ok) {
          // Create persistent session with 60-minute timeout
          if (typeof window !== 'undefined') {
            SessionManager.createSession(
              data.userName || data.userEmail,
              data.userEmail,
              data.permissions || [],
              data.assistantName || 'Piper',
              data.workspaceOwner // Pass workspace owner from login response
            )
            
            // Track successful login
            VercelAnalytics.trackLogin('email', data.permissions || [])
          }
          
          setSuccess(true)
          setTimeout(() => {
            setSuccess(false)
            setEmail("")
            setPassword("")
            setError("")
            onSuccess() // This will navigate to chat
          }, 1500)
        } else {
          setError(data.error || 'Login failed')
        }
      } catch (error) {
        console.error('Error during login:', error)
        setError('Login failed. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleClose = () => {
    setEmail("")
    setPassword("")
    setError("")
    setSuccess(false)
    setEmailError("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal - slides up from bottom on mobile */}
      <Card className="relative w-full sm:max-w-md shadow-2xl border-2 border-primary/20 rounded-t-2xl sm:rounded-2xl overflow-y-auto" style={{ maxHeight: 'min(90vh, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 20px))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="p-4 sm:p-6">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute right-2 top-2 h-8 w-8 p-0 shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">PeakSuite</h2>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Welcome!</h3>
            <p className="text-muted-foreground">
              Login successful. Redirecting to assistant...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-3">
                PeakSuite Login
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Enter your email and the password provided by the PeakSuite team.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    className="pl-10 border-2 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-primary focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-600 mt-1">{emailError}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-2 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-primary focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Sign In"}
              </Button>
              
              <Button 
                type="button" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                size="lg"
                onClick={() => {
                  onClose()
                  onOpenWaitlist?.()
                }}
              >
                Request Access
              </Button>
            </form>
          </div>
        )}
        </div>
      </Card>
    </div>
  )
}