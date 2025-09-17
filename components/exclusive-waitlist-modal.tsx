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
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [industry, setIndustry] = useState("")
  const [otherIndustry, setOtherIndustry] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

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

  const validatePhone = (phone: string) => {
    // Remove all non-digits to check if we have 10 digits
    const digitsOnly = phone.replace(/\D/g, '')
    return digitsOnly.length === 10
  }

  const handlePhoneBlur = () => {
    if (phoneNumber && !validatePhone(phoneNumber)) {
      setPhoneError("Please enter a valid phone number")
    } else {
      setPhoneError("")
    }
  }

  const industries = [
    "Accounting/CPA Firm",
    "Construction & Contracting",
    "Healthcare & Medical",
    "Professional Services (Legal, Consulting, etc.)",
    "Manufacturing",
    "Retail & E-commerce",
    "Technology & Software",
    "Real Estate",
    "Restaurants & Food Service",
    "Financial Services",
    "Transportation & Logistics",
    "Non-Profit",
    "Other"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields including "Other" industry specification
    const finalIndustry = industry === "Other" ? otherIndustry : industry
    
    if (firstName && lastName && industry && email && phoneNumber && finalIndustry && agreedToTerms) {
      setIsSubmitting(true)
      
      try {
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            firstName, 
            lastName, 
            industry: finalIndustry, 
            companyName, 
            email, 
            phoneNumber 
          }),
        })

        if (response.ok) {
          setSubmitted(true)
          setTimeout(() => {
            setSubmitted(false)
            setFirstName("")
            setLastName("")
            setIndustry("")
            setOtherIndustry("")
            setCompanyName("")
            setEmail("")
            setPhoneNumber("")
            onClose()
          }, 2000)
        } else {
          console.error('Failed to submit to waitlist')
        }
      } catch (error) {
        console.error('Error submitting to waitlist:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleClose = () => {
    setSubmitted(false)
    setFirstName("")
    setLastName("")
    setIndustry("")
    setOtherIndustry("")
    setCompanyName("")
    setEmail("")
    setPhoneNumber("")
    setEmailError("")
    setPhoneError("")
    setAgreedToTerms(false)
    setShowTermsModal(false)
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
                Join Our Beta Testing Program
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                You are signing up for beta testing of PeakSuite.ai. As a beta tester, you agree to 
                use the system for testing purposes, provide feedback on functionality, and understand 
                that features may change during development.
              </p>
            </div>


            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border-2 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-primary focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border-2 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-primary focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-foreground mb-2">
                  Industry *
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">Select your industry</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              {industry === "Other" && (
                <div>
                  <label htmlFor="otherIndustry" className="block text-sm font-medium text-foreground mb-2">
                    Please specify industry *
                  </label>
                  <Input
                    id="otherIndustry"
                    type="text"
                    placeholder="Enter your industry"
                    value={otherIndustry}
                    onChange={(e) => setOtherIndustry(e.target.value)}
                    className="border-2 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-primary focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-2">
                  Company Name
                </label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Enter your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="border-2 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Business Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your business email"
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
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Phone Number *
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onBlur={handlePhoneBlur}
                  className="border-2 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-primary focus:ring-2 focus:ring-primary"
                  required
                />
                {phoneError && (
                  <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                )}
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                <input
                  type="checkbox"
                  id="terms-agreement"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="terms-agreement" className="text-sm text-foreground leading-relaxed">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-primary underline hover:text-primary/80 transition-colors"
                  >
                    Beta Testing Terms
                  </button>
                  {" "}and understand this is a testing environment.
                </label>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !agreedToTerms}>
                {isSubmitting ? "Adding to Waitlist..." : "Request Beta Access"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Beta testing positions are limited • We'll contact you within 48 hours if selected
              </p>
            </div>
          </div>
        )}
      </Card>
      
      {/* Beta Testing Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowTermsModal(false)}
          />
          
          {/* Terms Modal */}
          <Card className="relative w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTermsModal(false)}
              className="absolute right-2 top-2 h-8 w-8 p-0 z-10"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground mb-4">Beta Testing Agreement for PeakSuite.ai</h2>
              
              <div className="space-y-4 text-sm text-foreground leading-relaxed">
                <p>
                  By proceeding with registration, you acknowledge and agree to participate as a beta tester for PeakSuite.ai under the following terms:
                </p>

                <div>
                  <h4 className="font-semibold mb-2">Testing Participation:</h4>
                  <p>You agree to use the PeakSuite.ai system solely for beta testing and evaluation purposes during the designated testing period.</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Feedback Obligation:</h4>
                  <p>You agree to provide constructive feedback regarding system functionality, performance, and user experience as reasonably requested by PeakSuite.ai.</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Development Acknowledgment:</h4>
                  <p>You understand and acknowledge that:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>The software is in beta/pre-release form and may contain bugs, errors, or incomplete features</li>
                    <li>Features, functionality, and system specifications are subject to modification or removal without prior notice</li>
                    <li>The system may experience downtime, data loss, or performance issues during the testing phase</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Use Limitations:</h4>
                  <p>The beta software is provided for evaluation purposes only and is not intended for production or commercial use.</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">No Warranty:</h4>
                  <p>The beta software is provided "as is" without warranties of any kind, either express or implied.</p>
                </div>

                <p className="pt-4 border-t border-border">
                  <strong>By continuing with registration, you confirm that you have read, understood, and agree to be bound by these beta testing terms.</strong>
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowTermsModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}