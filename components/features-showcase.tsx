"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  MessageCircle, 
  FileText, 
  Share2, 
  BarChart3,
  Zap,
  Bot,
  Upload,
  Mic,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Brain,
  Shield,
  Clock,
  Target,
  TrendingUp,
  Users,
  CheckCircle2
} from "lucide-react"

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  details: string[]
  highlight?: boolean
}

export function FeaturesShowcase() {
  const [expandedFeature, setExpandedFeature] = useState<string>("all")

  const features: Feature[] = [
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
  ]

  const businessCapabilities = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Strategic Planning",
      description: "Growth scenarios, market analysis, and competitive positioning"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Performance Analytics",
      description: "KPI tracking, industry benchmarking, and operational insights"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Risk Management",
      description: "Compliance monitoring, early issue detection, and mitigation strategies"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Financial Forecasting",
      description: "Cash flow projections, budget planning, and scenario modeling"
    }
  ]

  const toggleFeature = (featureId: string) => {
    setExpandedFeature(expandedFeature === featureId ? "" : featureId)
  }

  return (
    <div className="py-24 bg-gradient-to-b from-background to-muted/20">
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
          {features.map((feature) => (
            <Card 
              key={feature.id} 
              className={`transition-all duration-200 cursor-pointer hover:shadow-lg ${
                feature.highlight ? 'border-primary/50 bg-primary/5' : ''
              } ${(expandedFeature === feature.id || expandedFeature === "all") ? 'ring-2 ring-primary/20' : ''}`}
              onClick={() => toggleFeature(feature.id)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
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
                  {(expandedFeature === feature.id || expandedFeature === "all") ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                
                {(expandedFeature === feature.id || expandedFeature === "all") && (
                  <div className="space-y-2">
                    {feature.details.map((detail, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Business Capabilities Grid */}
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
            {businessCapabilities.map((capability, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                  {capability.icon}
                </div>
                <h4 className="font-semibold mb-2">{capability.title}</h4>
                <p className="text-sm text-muted-foreground">{capability.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Workflow Showcase */}
        <Card className="p-8 mb-16 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Simple Yet Powerful Workflow
            </h3>
            <p className="text-muted-foreground">
              From conversation to professional report in minutes
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full font-bold mb-4">
                1
              </div>
              <h4 className="font-semibold mb-2">Chat & Upload</h4>
              <p className="text-sm text-muted-foreground">
                Ask questions and upload business documents for analysis
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full font-bold mb-4">
                2
              </div>
              <h4 className="font-semibold mb-2">AI Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Get expert insights with 31 years of CPA knowledge
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full font-bold mb-4">
                3
              </div>
              <h4 className="font-semibold mb-2">Smart Suggestions</h4>
              <p className="text-sm text-muted-foreground">
                AI suggests professional titles and descriptions automatically
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full font-bold mb-4">
                4
              </div>
              <h4 className="font-semibold mb-2">Share & Track</h4>
              <p className="text-sm text-muted-foreground">
                Generate professional reports with engagement analytics
              </p>
            </div>
          </div>
        </Card>

        {/* Security & Trust */}
        <Card className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Enterprise-Grade Security</h3>
              <p className="text-muted-foreground">Your business data is protected with industry-leading security</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Data Privacy</h4>
                <p className="text-sm text-muted-foreground">Your data never trains AI models and stays completely private</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Secure Storage</h4>
                <p className="text-sm text-muted-foreground">Google Cloud infrastructure with encrypted file storage</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Access Control</h4>
                <p className="text-sm text-muted-foreground">Permission-based access with automatic session timeouts</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}