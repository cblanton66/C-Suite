"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
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
  Zap
} from "lucide-react"

interface LandingPageProps {
  onNavigateToChat: () => void
}

export function LandingPage({ onNavigateToChat }: LandingPageProps) {
  const benefits = [
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "Tax Estimate & FinancialProjections",
      description: "Generate accurate tax estimates and financial projections for better planning"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Tax Law Research",
      description: "Instant access to current tax regulations and compliance requirements"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Deduction Optimization",
      description: "Identify all eligible deductions and credits to maximize tax savings"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Tax Planning Strategies",
      description: "Develop comprehensive tax planning strategies for individuals and businesses"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Client Communications",
      description: "Generate professional client letters, presentations, and tax reports"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Compliance Monitoring",
      description: "Stay updated on tax law changes and compliance requirements"
    }
  ]

  const features = [
    "30+ years of CPA expertise built-in",
    "24/7 availability for urgent tax questions",
    "Individual and business tax focused",
    "Secure and confidential data handling",
    "Regular updates with latest tax law changes",
    "Integration with popular tax software"
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
                <h1 className="text-2xl font-bold text-foreground">TaxGPT</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Tax Research & Projections</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button onClick={onNavigateToChat} variant="outline">
                Try Demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Powered by 30+ Years of CPA Expertise
          </div>
          <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Your AI Tax Assistant
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Get expert tax guidance powered by 30+ years of CPA expertise. From tax planning to compliance, 
            get instant answers to your most complex tax questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={onNavigateToChat} className="text-lg px-8 py-6">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need for Tax Success
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tax tools designed specifically for CPAs, tax professionals, and small business owners
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

          {/* Login Box */}
          <Card className="max-w-md mx-auto p-8">
            <div className="text-center mb-6">
              <h4 className="text-xl font-semibold text-foreground mb-2">Ready to Get Started?</h4>
              <p className="text-muted-foreground">Sign in to access your TaxGPT Assistant</p>
            </div>
            <div className="space-y-4">
              <Input placeholder="Email address" type="email" />
              <Input placeholder="Password" type="password" />
              <Button className="w-full" size="lg">
                Sign In
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Don't have an account? <a href="#" className="text-primary hover:underline">Sign up here</a>
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
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

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your Tax Practice?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join forward-thinking tax professionals who are already using AI to work smarter, not harder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={onNavigateToChat}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" onClick={onNavigateToChat}>
              Try Demo
            </Button>
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
            <span className="text-lg font-semibold text-foreground">TaxGPT</span>
          </div>
          <p className="text-muted-foreground mb-4">
            Empowering tax professionals with AI-driven tax intelligence
          </p>
          <p className="text-sm text-muted-foreground">
            © 2024 TaxGPT. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

