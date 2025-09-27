"use client"

import { useState } from "react"
import { useSampleReports } from "@/hooks/use-sample-reports"
import { useAdminSettings } from "@/hooks/use-admin-settings"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FeaturesShowcase } from "@/components/features-showcase"
import { ExclusiveWaitlistModal } from "@/components/exclusive-waitlist-modal"
import { ArrowLeft, Zap, FileText, ExternalLink, MessageCircle, Upload, Share2, Sparkles, Brain, CheckCircle2, ChevronRight, ChevronDown } from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [expandedFeature, setExpandedFeature] = useState<string>("all")
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
                Get Started Today
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 1. Simple Yet Powerful Workflow */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">
            Streamline Every Client Interaction
            </h3>
            <p className="text-muted-foreground">
            Elevate your communication strategy with seamless, professional workflows.
            </p>
          </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full font-bold mb-4">
                  1
                </div>
                <h4 className="font-semibold mb-2">Receive Client Question</h4>
                <p className="text-sm text-muted-foreground">
                  Client asks business question or submits documents for analysis
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full font-bold mb-4">
                  2
                </div>
                <h4 className="font-semibold mb-2">Research & Analyze</h4>
                <p className="text-sm text-muted-foreground">
                  AI analyzes data and provides comprehensive business insights and recommendations
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full font-bold mb-4">
                  3
                </div>
                <h4 className="font-semibold mb-2">Refine & Customize</h4>
                <p className="text-sm text-muted-foreground">
                  Review AI response, add personal insights, and tailor for client
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full font-bold mb-4">
                  4
                </div>
                <h4 className="font-semibold mb-2">Share Professional Report</h4>
                <p className="text-sm text-muted-foreground">
                  Deliver polished report to client with tracking and engagement analytics
                </p>
              </div>
            </div>
            
            <p className="text-sm text-green-600 dark:text-green-400 mt-6 font-medium text-center">
              🚀 From client question to professional response in minutes not hours
            </p>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border mx-4"></div>

      {/* 2. Live Examples - Client-Ready Reports You Control */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              Click the Reports below for Real World Questions
            </div>
            
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Client-Ready Reports You Control
            </h3>
            <p className="text-muted-foreground">
            Every report contains the original question and PeakSuite's initial answer. From there, users can ask follow-up 
            questions to refine the response or share it with a client or colleague. Each shared report has an expiration 
            date that you control, and all activity is tracked on your PeakSuite dashboard.
            </p>
          </div>
          
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
          
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-6 font-medium text-center">
            ✨ Click any report to experience what your clients will see
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border mx-4"></div>

      {/* 3. CFO-Level Business Intelligence */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                CFO-Level Business Intelligence
              </h3>
              <p className="text-muted-foreground">
                Get executive insights across all areas of your business
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 text-center hover:shadow-lg transition-all bg-card rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Strategic Planning</h4>
                <p className="text-sm text-muted-foreground">Growth scenarios, market analysis, and competitive positioning</p>
              </div>
              
              <div className="p-6 text-center hover:shadow-lg transition-all bg-card rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Performance Analytics</h4>
                <p className="text-sm text-muted-foreground">KPI tracking, industry benchmarking, and operational insights</p>
              </div>
              
              <div className="p-6 text-center hover:shadow-lg transition-all bg-card rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Risk Management</h4>
                <p className="text-sm text-muted-foreground">Compliance monitoring, early issue detection, and mitigation strategies</p>
              </div>
              
              <div className="p-6 text-center hover:shadow-lg transition-all bg-card rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Financial Forecasting</h4>
                <p className="text-sm text-muted-foreground">Cash flow projections, budget planning, and scenario modeling</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Watch Demo - See PeakSuite.ai in Action */}
      {settings?.videoDemoVisible && (
        <>
          <section className="py-24 bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-6xl mx-auto px-4">
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
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-border mx-4"></div>
        </>
      )}

      {/* Detailed Features Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Powered by Advanced AI
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need for Smart Business Decisions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              PeakSuite.ai combines conversational AI with powerful business tools to deliver 
              CFO-level insights and professional reporting capabilities.
            </p>
          </div>

          {/* Main Features */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {[
              {
                id: "ai-chat",
                title: "AI-Powered Business Conversations",
                description: "Chat with your virtual CFO powered by 31 years of CPA expertise",
                icon: <MessageCircle className="w-6 h-6" />,
                details: [
                  "Natural conversation interface with business-focused AI",
                  "Remembers context from your entire conversation history",
                  "Voice input support for hands-free interaction",
                  "Automatic chart generation from data discussions",
                  "Industry-specific guidance tailored to your business"
                ]
              },
              {
                id: "ai-suggestions",
                title: "AI-Powered Report Suggestions",
                description: "Automatically generates professional titles and descriptions for your reports",
                icon: <Sparkles className="w-6 h-6" />,
                highlight: true,
                details: [
                  "AI analyzes your report content automatically",
                  "Suggests executive-appropriate titles and descriptions",
                  "Uses professional business terminology",
                  "Saves time while ensuring quality presentation",
                  "Unique feature that sets PeakSuite.ai apart"
                ]
              },
              {
                id: "file-analysis",
                title: "Smart Document Analysis",
                description: "Upload and analyze PDFs, Excel files, and business documents instantly",
                icon: <Upload className="w-6 h-6" />,
                details: [
                  "Professional-grade PDF text extraction",
                  "Supports Excel, CSV, Word, and text files",
                  "Automatic integration into conversation context",
                  "Analyze financial statements, contracts, and reports",
                  "Secure file storage with user-specific access"
                ]
              },
              {
                id: "professional-reports",
                title: "Professional Report Sharing",
                description: "Transform conversations into client-ready business reports",
                icon: <Share2 className="w-6 h-6" />,
                details: [
                  "One-click conversion from chat to professional report",
                  "Clean, print-ready formatting for executives",
                  "Shareable URLs with expiration controls",
                  "View tracking and engagement analytics",
                  "Mobile-responsive design for any device"
                ]
              },
              {
                id: "report-management",
                title: "Complete Report Lifecycle",
                description: "Manage, edit, and track all your shared reports in one place",
                icon: <FileText className="w-6 h-6" />,
                highlight: true,
                details: [
                  "Comprehensive report library with search",
                  "Edit titles, descriptions, and client information",
                  "Unique content editing - reopen reports in chat",
                  "Usage analytics and engagement tracking",
                  "Safe deletion with data preservation"
                ]
              },
              {
                id: "business-intelligence",
                title: "Executive-Level Business Intelligence",
                description: "Get CFO-quality insights and strategic recommendations",
                icon: <Brain className="w-6 h-6" />,
                details: [
                  "13-week cash flow forecasting",
                  "Year-round tax planning and optimization",
                  "KPI tracking and industry benchmarking",
                  "Risk management and compliance monitoring",
                  "Growth scenario modeling and analysis"
                ]
              }
            ].map((feature) => (
              <Card 
                key={feature.id} 
                className={`transition-all duration-200 hover:shadow-lg ${
                  feature.highlight ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      feature.highlight ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {feature.title}
                        {feature.highlight && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                            ⭐ UNIQUE
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  
                  <div className="space-y-2">
                    {feature.details.map((detail, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border mx-4"></div>

      {/* 5. Enterprise-Grade Security */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="p-8 bg-card rounded-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Enterprise-Grade Security</h3>
                <p className="text-muted-foreground">Your business data is protected with industry-leading security</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold mb-1">Data Privacy</h4>
                  <p className="text-sm text-muted-foreground">Your data never trains AI models and stays completely private</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold mb-1">Secure Storage</h4>
                  <p className="text-sm text-muted-foreground">Google Cloud infrastructure with encrypted file storage</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold mb-1">Access Control</h4>
                  <p className="text-sm text-muted-foreground">Permission-based access with automatic session timeouts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border mx-4"></div>

      {/* Getting Started Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-foreground mb-6">
            Getting Started is Simple
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            No downloads, no installations, no complex setup. Access your AI-powered virtual CFO 
            instantly through your web browser and start making smarter business decisions today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              onClick={() => setShowWaitlistModal(true)}
              className="bg-primary hover:bg-primary/90 px-8 py-3"
            >
              Get Started Now
            </Button>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• No files to download or software to install</p>
              <p>• Immediate access via web browser</p>
              <p>• No IT setup required</p>
              <p>• Start analyzing within 5 minutes</p>
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