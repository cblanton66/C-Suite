"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, MessageSquare, AlertCircle, CheckCircle } from "lucide-react"

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
}

export function FeedbackModal({ isOpen, onClose, userEmail }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState("General Feedback")
  const [subject, setSubject] = useState("")
  const [details, setDetails] = useState("")
  const [rating, setRating] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const feedbackTypes = [
    "Bug Report",
    "Feature Request", 
    "General Feedback",
    "UI/UX Suggestion",
    "Performance Issue"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subject.trim() || !details.trim()) {
      setSubmitError("Please fill in both subject and details")
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userEmail || 'anonymous',
          feedbackType,
          subject: subject.trim(),
          details: details.trim(),
          rating: rating || null,
          pageFeature: 'Chat Interface'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitSuccess(true)
        // Reset form
        setSubject("")
        setDetails("")
        setRating(0)
        setFeedbackType("General Feedback")
        
        // Success - user will close manually
      } else {
        setSubmitError(data.error || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setSubmitError('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSubject("")
    setDetails("")
    setRating(0)
    setFeedbackType("General Feedback")
    setSubmitError("")
    setSubmitSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-lg p-6 shadow-2xl border-2 border-primary/20 max-h-[85vh] md:max-h-[90vh] overflow-y-auto my-auto">
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
            <MessageSquare className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Share Feedback</h2>
        </div>

        {submitSuccess ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Thank You!</h3>
            <p className="text-muted-foreground mb-6">
              Your feedback has been submitted successfully. We appreciate your input!
            </p>
            <Button
              onClick={() => {
                setSubmitSuccess(false)
                onClose()
              }}
              className="w-full"
              size="lg"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Feedback Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Feedback Type
              </label>
              <select 
                value={feedbackType} 
                onChange={(e) => setFeedbackType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {feedbackTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subject
              </label>
              <Input
                type="text"
                placeholder="Brief summary of your feedback"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="border-2 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600"
                required
              />
            </div>

            {/* Details */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Details
              </label>
              <textarea
                placeholder="Please provide detailed feedback, suggestions, or describe any issues you encountered..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-y"
                required
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Overall Experience (Optional)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-300`}
                  >
                    ★
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-sm text-muted-foreground ml-2 self-center">
                    {rating}/5
                  </span>
                )}
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}