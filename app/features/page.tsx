"use client"

import { useState } from "react"
import { useSampleReports } from "@/hooks/use-sample-reports"
import { useAdminSettings } from "@/hooks/use-admin-settings"
import { Button } from "@/components/ui/button"
import { FeaturesShowcase } from "@/components/features-showcase"
import { ExclusiveWaitlistModal } from "@/components/exclusive-waitlist-modal"
import { ArrowLeft, Zap, FileText, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const { sampleReports } = useSampleReports()
  const { settings } = useAdminSettings()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Platform Features</h1>
                <p className="text-sm text-muted-foreground">Discover what makes PeakSuite.ai unique</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setShowWaitlistModal(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Zap className="w-4 h-4 mr-2" />
                Request Access
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Showcase */}
      <FeaturesShowcase />

      {/* Sample Reports Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FileText className="w-4 h-4" />
            Live Examples
          </div>
          
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Client-Ready Reports You Control
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            See exactly what your clients will see. These are real client-facing reports with secure web links 
            that you control - set custom expiration dates and track engagement.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <a
              href={sampleReports.q3Financial}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all border border-blue-200 dark:border-blue-800 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{sampleReports.q3FinancialTitle}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            
            <a
              href={sampleReports.cashFlow}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all border border-blue-200 dark:border-blue-800 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{sampleReports.cashFlowTitle}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            
            <a
              href={sampleReports.taxStrategy}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all border border-blue-200 dark:border-blue-800 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{sampleReports.taxStrategyTitle}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            
            <a
              href={sampleReports.kpiDashboard}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all border border-blue-200 dark:border-blue-800 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{sampleReports.kpiDashboardTitle}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
          
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-6 font-medium">
            ✨ Click any report to experience what your clients will see
          </p>
        </div>
      </section>

      {/* Video Demo Section - Conditionally shown based on admin settings */}
      {settings?.videoDemoVisible && (
        <section className="py-16 px-4 bg-background">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
              </svg>
              Watch Demo
            </div>
            
            <h3 className="text-3xl font-bold text-foreground mb-4">
              See PeakSuite.ai in Action
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Watch how easy it is to get professional business insights and generate reports with our AI-powered platform.
            </p>
            
            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gray-900">
                <div style={{padding:"68.44% 0 0 0", position:"relative"}}>
                  <iframe 
                    src="https://player.vimeo.com/video/1122075768?badge=0&autopause=0&player_id=0&app_id=58479" 
                    frameBorder="0" 
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin" 
                    style={{position:"absolute", top:0, left:0, width:"100%", height:"100%"}} 
                    title="PeakSuite.ai Demo"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Professional CTA Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-foreground mb-6">
            Experience Professional Business Intelligence
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            PeakSuite.ai is currently in selective beta. We're working with a limited number of 
            businesses to refine the platform before broader availability.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              onClick={() => setShowWaitlistModal(true)}
              className="bg-primary hover:bg-primary/90 px-8 py-3"
            >
              Request Access
            </Button>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Professional business guidance</p>
              <p>• Dedicated onboarding support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/30 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-foreground">PeakSuite.ai</span>
            </div>
            <p className="mb-2">
              <strong>Your AI-Powered Virtual CFO</strong>
            </p>
            <p className="text-sm">
              Transforming how small businesses access executive-level intelligence
            </p>
            
            <div className="flex items-center justify-center gap-6 mt-8 text-sm">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/help" className="hover:text-foreground transition-colors">
                User Guide
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      <ExclusiveWaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
      />
    </div>
  )
}