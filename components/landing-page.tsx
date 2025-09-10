"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { AccessCodeModal } from "@/components/access-code-modal"
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
  Quote
} from "lucide-react"

interface LandingPageProps {
  onNavigateToChat: () => void
}

export function LandingPage({ onNavigateToChat }: LandingPageProps) {
  const [showAccessModal, setShowAccessModal] = useState(false)

  const handleAccessSuccess = () => {
    setShowAccessModal(false)
    onNavigateToChat()
  }

  const handleTryNowClick = () => {
    // Check if user already has access
    if (typeof window !== 'undefined') {
      const hasAccess = sessionStorage.getItem('peaksuiteai_access_granted') === 'true'
      if (hasAccess) {
        onNavigateToChat()
      } else {
        setShowAccessModal(true)
      }
    } else {
      setShowAccessModal(true)
    }
  }
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
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">PeakSuite.ai</h1>
                <p className="text-sm text-muted-foreground">Financial Knowledge at Your Fingertips</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button onClick={handleTryNowClick} variant="outline">
                Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
AI that is easy to use and makes sense.
          </div>
          <h2 className="text-4xl font-bold text-white/80 mb-6 leading-tight">
            Artificial Intelligence for Your Business
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            Every business deserves CFO-level financial intelligence. PEAK delivers Performance, Efficiency, Analytics & Knowledge - from cash flow to compliance, from tax strategy to M&A prep. Make confident financial decisions 24/7.
          </p>
          <div className="flex justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={handleTryNowClick}>
            See it in action
            </Button>
          </div>
        </div>
      </section>

      {/* Target Personas Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Built for Three Types of Financial Leaders
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're wearing multiple hats or leading a finance team, PeakSuite.ai adapts to your role
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* The Owner-CFO */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">The Owner-CFO</h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                You built the business but need CFO-level financial intelligence without the CFO salary. Get strategic insights, cash flow forecasting, and M&A readiness.
              </p>
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

            {/* The Accounting Head */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">The Accounting Head</h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                You manage the books but want to provide strategic value. Transform from number-cruncher to business advisor with executive-level analysis tools.
              </p>
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

            {/* The Strategic CFO */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4">The Strategic CFO</h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                You're already strategic but need deeper insights and faster analysis. Enhance your capabilities with AI-powered modeling and industry benchmarking.
              </p>
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
              Your Complete Financial Command Center
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Strategic CFO capabilities designed for businesses from $500K to $50M in revenue
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

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">
            Every Business Deserves a CFO
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join growing companies that are making smarter financial decisions with AI-powered CFO intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={handleTryNowClick}>
              Start Your Free Trial
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" onClick={handleTryNowClick}>
              See It In Action
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-muted/30">
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
                <Button size="lg" className="w-full">
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
                <p className="text-sm text-green-600 font-medium mb-6">Save $189 (2 months free!)</p>
                <ul className="text-left space-y-3 mb-8">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="w-full">
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

      {/* Access Code Modal */}
      <AccessCodeModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        onSuccess={handleAccessSuccess}
      />
    </div>
  )
}

