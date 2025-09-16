"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Building2, Mail, CheckCircle, X } from "lucide-react"

interface ExclusiveWaitlistModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ExclusiveWaitlistModal({ isOpen, onClose }: ExclusiveWaitlistModalProps) {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setEmail("")
        onClose()
      }, 2000)
    }
  }

  const handleClose = () => {
    setSubmitted(false)
    setEmail("")
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
      <Card className="relative w-full max-w-lg mx-4 p-6 shadow-2xl border-2 border-primary/20">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute right-2 top-2 h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">PeakSuite.ai</h2>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">You're on the list!</h3>
            <p className="text-muted-foreground">
              We'll notify you when spots become available.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-3">
                Beta Program at Capacity
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                We're currently in a limited beta testing phase with select business partners. 
                Our beta cohort is working closely with our development team to refine the platform 
                and ensure enterprise-grade reliability before our full launch.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                <strong className="text-foreground">Beta Access:</strong> We're managing beta participation 
                carefully to maintain platform performance and provide dedicated support to our testing partners.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Join Our Beta Waitlist
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your business email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Request Beta Access
              </Button>
            </form>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Beta spots released on a rolling basis • We'll notify you when enrollment opens
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}