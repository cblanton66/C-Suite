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
  Eye
} from "lucide-react"

interface LandingPageProps {
  onNavigateToChat: () => void
}

export function LandingPage({ onNavigateToChat }: LandingPageProps) {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [trainingRoomVisible, setTrainingRoomVisible] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const [assistantName, setAssistantName] = useState("Piper")

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

    const checkTrainingRoomVisibility = async () => {
      try {
        const response = await fetch('/api/admin-settings')
        const data = await response.json()
        if (data.success) {
          setTrainingRoomVisible(data.settings.trainingRoomVisible)
        }
      } catch (error) {
        console.error('Error checking training room visibility:', error)
        // Default to false if there's an error
        setTrainingRoomVisible(false)
      }
    }

    checkSession()
    checkTrainingRoomVisibility()
  }, [])
  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Strategic Planning & Forecasting",
      description: "Model growth scenarios, analyze what-if situations, and make data-driven strategic decisions"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Cash Flow Management",
      description: "13-week cash flow forecasting, working capital optimization, and liquidity planning"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "KPI Dashboard & Analytics",
      description: "Track performance metrics, benchmark against industry standards, identify trends"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Tax Strategy & Compliance",
      description: "Year-round tax planning, compliance monitoring, and deduction optimization"
    },
    {
      icon: <Handshake className="w-6 h-6" />,
      title: "M&A & Investment Readiness",
      description: "Prepare for acquisitions, investor presentations, and valuation analysis"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Risk & Compliance Guardian",
      description: "Monitor regulatory requirements, loan covenants, and flag potential issues early"
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

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Artificial Intelligence for Your Business
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From financial analysis to daily operations, PeakSuite.ai empowers every employee with expert-level business insights. Built by a CPA with 30+ years of real-world business experience—because your business deserves more than generic AI.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {/* Performance */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">
                <span className="text-2xl font-bold text-primary">P</span>erformance
              </h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
              Boost productivity across all departments with AI tools that streamline operations, optimize decision-making, and drive measurable results for your entire team.              </p>
            </Card>

            {/* Empower */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">
                <span className="text-2xl font-bold text-primary">E</span>mpower
              </h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
              Transform every employee into a strategic contributor with business intelligence that turns data into actionable insights, regardless of their role or experience level.
              </p>
            </Card>

            {/* Analysis */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">
                <span className="text-2xl font-bold text-primary">A</span>nalysis
              </h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
              Get comprehensive business insights—from financial KPIs to operational metrics—that help you compete with larger companies while maintaining your small business agility.
              </p>
            </Card>

            {/* Knowledge */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">
                <span className="text-2xl font-bold text-primary">K</span>nowledge
              </h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
              Access three decades of proven business expertise combined with cutting-edge AI. It's like having a seasoned business advisor available 24/7 for your entire team.
              </p>
            </Card>
          </div>

        </div>
      </section>

      {/* Target Personas Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
            Built for Growing Small Businesses and Their Teams
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're wearing multiple hats or leading a finance team, PeakSuite.ai adapts to your role
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* The Multi-Hat Owner */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">The Multi-Hat Owner</h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
              You wear every hat in your business. Get executive-level insights for financial decisions, strategic planning, and daily operations—without hiring expensive consultants or full-time specialists.              </p>
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>13-week cash flow forecasting</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Strategic planning scenarios</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Investment & exit preparation</span>
                </div>
              </div>
            </Card>

            {/* The Growing Team */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">The Growing Team</h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
              Your employees want to contribute more strategically. Give them access to business intelligence tools that elevate their impact and help them think like business owners.              </p>
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Management reporting automation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>KPI dashboards & benchmarking</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Strategic recommendations</span>
                </div>
              </div>
            </Card>

            {/* The Accounting Professional */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">The Accounting Professional</h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
              Whether you're serving clients or managing internal operations, deliver advisory-level insights that position you as a strategic partner, not just a number-cruncher.              </p>
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Advanced financial modeling</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Board presentation support</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>M&A due diligence prep</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>


      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
Your Complete Business Intelligence Platform            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional-grade business tools designed for companies from Start-up to $50M in revenue            </p>
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

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">
          Every Small Business Deserves Enterprise-Level Intelligence          </h3>
          <p className="text-xl mb-8 opacity-90">
          Join growing companies that are making smarter decisions faster with AI-powered business insights built by someone who understands your challenges.          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" onClick={() => setShowWaitlistModal(true)}>
              Request Access
            </Button>
            <Link href="/features">
              <Button size="lg" variant="ghost" className="text-lg px-8 py-6 text-primary-foreground hover:bg-primary-foreground/10">
                <Eye className="w-5 h-5 mr-2" />
                View Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

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

