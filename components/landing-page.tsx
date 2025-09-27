"use client"
import { useState, useEffect } from "react"
import { SessionManager } from "@/lib/session-manager"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { EmailLoginModal } from "@/components/email-login-modal"
import { ExclusiveWaitlistModal } from "@/components/exclusive-waitlist-modal"
import { 
  Calculator, 
  FileText, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Briefcase, 
  DollarSign,
  CheckCircle,
  ArrowRight,
  Building2,
  Target,
  Zap,
  PieChart,
  Shield,
  Handshake,
  Quote,
  Eye,
  MessageCircle
} from "lucide-react"

interface LandingPageProps {
  onNavigateToChat: () => void
}

export function LandingPage({ onNavigateToChat }: LandingPageProps) {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [videoDemoVisible, setVideoDemoVisible] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const [assistantName, setAssistantName] = useState("Piper")
  // Landing page section visibility settings
  const [showTargetPersonas, setShowTargetPersonas] = useState(true)
  const [showPowerfulFramework, setShowPowerfulFramework] = useState(true)
  const [showBenefitsSection, setShowBenefitsSection] = useState(true)

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    // Update login state
    const session = SessionManager.getSession()
    if (session) {
      setIsLoggedIn(true)
      setUserName(session.userName)
      setAssistantName(session.assistantName || 'Piper')
    }
    onNavigateToChat()
  }

  const handleTryNowClick = () => {
    if (isLoggedIn) {
      // User is already logged in, go directly to chat
      onNavigateToChat()
    } else {
      // User needs to log in first
      setShowLoginModal(true)
    }
  }

  // Check session and Training Room visibility on component mount
  useEffect(() => {
    // Check if user is already logged in
    const checkSession = () => {
      try {
        console.log('LandingPage - checking session...')
        
        // Migrate old session if exists
        const migrated = SessionManager.migrateOldSession()
        console.log('LandingPage - migration result:', migrated)
        
        // Check current session
        const session = SessionManager.getSession()
        console.log('LandingPage - session result:', session)
        
        if (session) {
          console.log('LandingPage - valid session found, setting logged in state')
          setIsLoggedIn(true)
          setUserName(session.userName)
          setAssistantName(session.assistantName || 'Piper')
          setUserName(session.userName)
        } else {
          console.log('LandingPage - no valid session, setting logged out state')
          setIsLoggedIn(false)
          setUserName("")
        }
      } catch (error) {
        console.error('LandingPage - Error checking session:', error)
        setIsLoggedIn(false)
        setUserName("")
      }
    }

    const checkVideoDemoVisibility = async () => {
      try {
        const response = await fetch('/api/admin-settings')
        const data = await response.json()
        if (data.success) {
          setVideoDemoVisible(data.settings.videoDemoVisible)
          // Update landing page section visibility
          setShowTargetPersonas(data.settings.showTargetPersonas ?? true)
          setShowPowerfulFramework(data.settings.showPowerfulFramework ?? true)
          setShowBenefitsSection(data.settings.showBenefitsSection ?? true)
        }
      } catch (error) {
        console.error('Error checking admin settings:', error)
        // Default to showing all sections if there's an error
        setVideoDemoVisible(false)
        setShowTargetPersonas(true)
        setShowPowerfulFramework(true)
        setShowBenefitsSection(true)
      }
    }

    checkSession()
    checkVideoDemoVisibility()
  }, [])

  const benefits = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Conversational AI Analysis",
      description: "Chat with your AI advisor powered by 31 years of CPA expertise. Upload documents, ask questions, and get instant strategic insights through natural conversation."
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Professional Client Reporting",
      description: "Transform AI conversations into polished, executive-ready reports with secure client portals, expiring links, and engagement tracking."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI-Powered Suggestions",
      description: "Automatically generate professional titles and descriptions for your reports. Save time while maintaining executive-level presentation quality."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Document Exchange",
      description: "Bidirectional file sharing with clients. Send forms for signature, receive completed documents, and maintain complete audit trails with enterprise-grade security."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Strategic Financial Intelligence",
      description: "13-week cash flow forecasting, scenario modeling, M&A readiness, and executive-level business insights for confident decision-making."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Complete Workflow Management",
      description: "Manage the entire client engagement lifecycle from initial analysis to final deliverable with integrated file management and response tracking."
    }
  ]

  const features = [
    "Full CFO toolkit - from cash flow to compliance",
    "24/7 access to strategic financial guidance",
    "Built on 31 years of CPA and PE experience",
    "Industry-specific insights and benchmarks",
    "M&A readiness and valuation tools",
    "Secure, confidential, and SOC 2 compliant"
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          {/* Mobile: Stack logo and buttons vertically */}
          <div className="block sm:hidden">
            {/* Logo row */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">PeakSuite.ai</h1>
              </div>
            </div>
            {/* Buttons row */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleTryNowClick} variant="ghost" size="sm" className={`text-xs whitespace-nowrap ${isLoggedIn ? 'text-green-600 hover:text-green-700' : ''}`}>
                {isLoggedIn ? `${assistantName} is Available` : 'Login'}
              </Button>
              <div className="flex justify-end">
                <ThemeToggle />
              </div>
            </div>
            {/* Mobile Features button */}
            <div className="mt-2 flex justify-center">
              <Link href="/features">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Features
                </Button>
              </Link>
            </div>
          </div>

          {/* Desktop: Keep original horizontal layout */}
          <div className="hidden sm:flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">PeakSuite.ai</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">AI-Powered Intelligence Built for Small Business</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
              <Link href="/features">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Features
                </Button>
              </Link>
              <Button onClick={handleTryNowClick} variant="ghost" size="sm" className={`text-xs sm:text-sm whitespace-nowrap ${isLoggedIn ? 'text-green-600 hover:text-green-700' : ''}`}>
                {isLoggedIn ? `${assistantName} is Available` : 'Login'}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>


      {/* Target Personas Section */}
      {showTargetPersonas && (
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-6">
            AI-driven efficiency for every business, every professional, every day.
            </h3>
            <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
            Every business professional—from bookkeepers to CEOs—deserves an AI-powered platform that transforms how they work, streamlining client communications to save time while delivering exceptional results.            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* CPA Firms & Tax Professionals */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calculator className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">CPA Firms & Tax Professionals</h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Streamline client workflows with AI-powered analysis and professional document exchange. Send forms for signature, provide strategic tax planning, and deliver advisory-level insights that differentiate your practice.
              </p>
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Secure client document exchange</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Professional report generation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Year-round tax strategy planning</span>
                </div>
              </div>
            </Card>

            {/* CFOs, Controllers & Finance Teams */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">CFOs & Finance Teams</h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                From executive leadership to bookkeeping services, enhance your financial expertise with AI-powered forecasting, strategic analysis, and professional reporting. Elevate your role from data entry to strategic advisor with insights that drive business growth.
              </p>
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>13-week cash flow forecasting</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Board-ready presentations & KPI reporting</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Client advisory & business insights</span>
                </div>
              </div>
            </Card>

            {/* CEOs & Business Owners */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">CEOs & Business Owners</h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Get the executive-level financial insights you need without hiring expensive consultants. Make confident strategic decisions with AI-powered analysis, scenario modeling, and professional reporting that scales with your business growth.
              </p>
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Strategic planning & scenario modeling</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Investment & exit preparation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Executive dashboards & insights</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Horizontal Summary Box */}
          <div className="mt-12">
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <h4 className="text-xl font-bold text-foreground mb-4">What Every Professional Gets</h4>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Whether you're a CPA streamlining client workflows, a CFO preparing board presentations, or a CEO making strategic decisions, 
                  PeakSuite.ai provides the AI-powered insights, professional reporting capabilities, and secure collaboration tools 
                  that transform how you work—saving time while delivering exceptional results that set you apart from the competition.
                </p>
                <Link href="/features">
                  <Button size="lg" className="text-lg px-8 py-3">
                    <Eye className="w-5 h-5 mr-2" />
                    See Reports and Workflows in Action
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
      )}

      {/* Benefits Section */}
      {showBenefitsSection && (
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Platform Capabilities at a Glance
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See why financial professionals choose PeakSuite.ai for client engagement, strategic analysis, and professional reporting
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">
                      {benefit.title}
                    </h4>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* POWERFUL Framework Section */}
      {showPowerfulFramework && (
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              What Makes PeakSuite.ai POWERFUL
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform how you research, communicate, organize, and make business decisions with AI-powered capabilities
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {/* Powerful Research */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">
                Powerful Research
              </h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                AI-powered analysis of business documents, financial data, and market trends. Upload PDFs, Excel files, and get instant expert-level insights with conversational AI.
              </p>
            </Card>

            {/* Powerful Client Communications */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">
                Powerful Client Communications
              </h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Transform conversations into professional reports with secure client portals. Bidirectional document exchange for forms, signatures, and collaborative workflows.
              </p>
            </Card>

            {/* Powerful Organization */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">
                Powerful Organization
              </h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Complete report lifecycle management with AI-generated titles and descriptions. Track engagement, manage client responses, and maintain professional documentation.
              </p>
            </Card>

            {/* Powerful Business Decisions */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">
                Powerful Business Decisions
              </h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Strategic insights backed by decades of CPA experience. Cash flow forecasting, scenario modeling, and executive-level recommendations for confident decision-making.
              </p>
            </Card>
          </div>

        </div>
      </section>
      )}



      {/* Pricing Section - Hidden during selective access period */}
      <section className="py-20 px-4 bg-muted/30 hidden">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h3>
          <p className="text-lg text-muted-foreground mb-12">
            Choose the plan that works best for your business
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Monthly Plan */}
            <Card className="p-8 border-2 border-border hover:border-primary/50 transition-colors">
              <div className="text-center">
                <h4 className="text-2xl font-bold text-foreground mb-2">Monthly</h4>
                <div className="text-4xl font-bold text-primary mb-2">$99</div>
                <p className="text-muted-foreground mb-6">per month</p>
                <ul className="text-left space-y-3 mb-8">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="w-full" onClick={() => setShowWaitlistModal(true)}>
                  Start Monthly Plan
                </Button>
              </div>
            </Card>

            {/* Annual Plan */}
            <Card className="p-8 border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Best Value
                </span>
              </div>
              <div className="text-center">
                <h4 className="text-2xl font-bold text-foreground mb-2">Annual</h4>
                <div className="text-4xl font-bold text-primary mb-2">$999</div>
                <p className="text-muted-foreground mb-1">per year</p>
                <p className="text-sm text-green-600 font-medium mb-6">Save $189 (almost 2 months free!)</p>
                <ul className="text-left space-y-3 mb-8">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="w-full" onClick={() => setShowWaitlistModal(true)}>
                  Start Annual Plan
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

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
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">PeakSuite.ai</span>
          </div>
          <p className="text-muted-foreground mb-4">
            Empowering businesses with AI-driven CFO intelligence
          </p>
          <p className="text-sm text-muted-foreground">
            © 2024 PeakSuite.ai. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Email Login Modal */}
      <EmailLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        onOpenWaitlist={() => setShowWaitlistModal(true)}
      />

      {/* Exclusive Waitlist Modal */}
      <ExclusiveWaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
      />
    </div>
  )
}

