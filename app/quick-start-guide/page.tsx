"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Building2,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  ExternalLink,
  ArrowLeft,
  BookOpen,
  Loader2
} from "lucide-react"
import { ExclusiveWaitlistModal } from "@/components/exclusive-waitlist-modal"

interface QAItem {
  question: string
  answer: string
}

interface TrainingFile {
  fileName: string
  title: string
  description: string
  url: string
  uploadedAt: string
}

interface PDFCategory {
  name: string
  description: string
  pdfs: TrainingFile[]
}

interface CategoryFiles {
  tax: TrainingFile[]
  business: TrainingFile[]
  retirement: TrainingFile[]
  accounting: TrainingFile[]
}

export default function QuickStartGuide() {
  const [expandedQA, setExpandedQA] = useState<number | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [categoryFiles, setCategoryFiles] = useState<CategoryFiles | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)

  // Load PDF files on component mount
  useEffect(() => {
    const fetchTrainingFiles = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/training-room-files')
        const data = await response.json()
        
        if (data.success) {
          setCategoryFiles(data.categories)
        } else {
          setError('Failed to load training files')
        }
      } catch (err) {
        setError('Error loading training files')
        console.error('Error fetching training files:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrainingFiles()
  }, [])

  const qaItems: QAItem[] = [
    {
      question: "How do I ask effective questions to PeakSuite.ai?",
      answer: "Be specific and provide context. Instead of asking 'How's my cash flow?', try 'Based on my current monthly expenses of $50K and seasonal revenue patterns, what should I expect for cash flow in Q4?' Include relevant numbers, timeframes, and business context."
    },
    {
      question: "What kind of context should I provide?",
      answer: "Share your business size, industry, current situation, and specific goals. For example: 'I'm a $5M manufacturing company looking to evaluate a new product line that requires $200K upfront investment.' The more relevant details you provide, the better the guidance."
    },
    {
      question: "How specific should my questions be?",
      answer: "Very specific! Think of PeakSuite.ai as your expert advisor sitting across from you. Ask detailed questions like you would in a real consultation: 'Should I take this SBA loan at 8.5% to fund expansion, or wait and self-fund over 18 months?'"
    },
    {
      question: "What if I don't know the right business terms?",
      answer: "That's perfectly fine! Describe your situation in plain language. Say 'I need to figure out if I have enough money to get through the slow season' instead of worrying about terms like 'working capital' or 'cash flow forecasting.'"
    },
    {
      question: "Can I ask follow-up questions?",
      answer: "Absolutely! PeakSuite.ai excels at back-and-forth conversations. Ask for clarification, request examples, or dive deeper into recommendations. It's designed to work like a real advisory conversation."
    },
    {
      question: "What topics can PeakSuite.ai help with?",
      answer: "Financial planning, tax strategy, business operations, M&A preparation, investment decisions, compliance, HR considerations, marketing ROI, and strategic planning. If it impacts your business, PeakSuite.ai can provide guidance."
    }
  ]

  // Create dynamic PDF categories from loaded data
  const pdfCategories: PDFCategory[] = [
    {
      name: "Tax Planning",
      description: "Real conversations about tax strategy, planning, and optimization",
      pdfs: categoryFiles?.tax || []
    },
    {
      name: "Business Strategy",
      description: "Strategic planning, growth decisions, and business development conversations",
      pdfs: categoryFiles?.business || []
    },
    {
      name: "Retirement Planning",
      description: "Retirement strategies, succession planning, and exit planning discussions",
      pdfs: categoryFiles?.retirement || []
    },
    {
      name: "Accounting & Finance",
      description: "Financial management, reporting, and operational finance conversations",
      pdfs: categoryFiles?.accounting || []
    }
  ]

  const toggleQA = (index: number) => {
    setExpandedQA(expandedQA === index ? null : index)
  }

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.close()}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Quick-Start Guide</h1>
                <p className="text-sm text-muted-foreground">Your complete guide to using PeakSuite.ai</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-8">
            The PeakSuite Quickstart Guide
          </h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-muted-foreground mb-8">
              Master PeakSuite.ai in 3 simple steps:
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-background/50 rounded-xl p-6 border border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Read Common Questions</h3>
                </div>
                <p className="text-muted-foreground">
                  Start with the most frequently asked questions below to understand how to ask effective questions.
                </p>
              </div>
              
              <div className="bg-background/50 rounded-xl p-6 border border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Review Real Conversations</h3>
                </div>
                <p className="text-muted-foreground">
                  Explore actual user conversations to see the question-and-answer flow in action.
                </p>
              </div>
              
              <div className="bg-background/50 rounded-xl p-6 border border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Join the Platform & Explore</h3>
                </div>
                <p className="text-muted-foreground">
                  Start your platform journey and explore - your business potential is limitless!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Q&A Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Common questions and anwers about using PeakSuite.ai
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            </p>
          </div>
          <div className="space-y-3">
            {qaItems.map((item, index) => (
              <Card key={index} className="overflow-hidden border-2 hover:border-primary/30 transition-all duration-200">
                <Button
                  variant="ghost"
                  onClick={() => toggleQA(index)}
                  className="w-full p-6 text-left justify-between hover:bg-primary/5"
                >
                  <span className="text-lg font-semibold text-foreground pr-4">
                    {item.question}
                  </span>
                  {expandedQA === index ? (
                    <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </Button>
                {expandedQA === index && (
                  <div className="px-6 pb-6 border-t border-primary/20 bg-primary/5">
                    <p className="text-foreground leading-relaxed pt-4 text-base">
                      {item.answer}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Real Conversations Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
          
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Real Business Conversations Submitted by PeakSuite Users
            </h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Explore actual conversations between user's and PeakSuite. In most cases, the user's questions are indicated by Bold Italic Text
            </p>
          </div>

          <div className="space-y-4">
            {pdfCategories.map((category) => (
              <Card key={category.name} className="overflow-hidden border-2 hover:border-primary/30 transition-all duration-200 shadow-sm">
                <Button
                  variant="ghost"
                  onClick={() => toggleCategory(category.name)}
                  className="w-full p-6 text-left justify-between hover:bg-primary/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-lg p-2">
                      <FolderOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-foreground mb-1">
                        {category.name}
                      </h4>
                      <p className="text-base text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  {expandedCategory === category.name ? (
                    <ChevronDown className="w-6 h-6 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-primary flex-shrink-0" />
                  )}
                </Button>
                
                {expandedCategory === category.name && (
                  <div className="border-t border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                    <div className="p-6 space-y-3">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <span className="ml-2 text-muted-foreground">Loading conversations...</span>
                        </div>
                      ) : error ? (
                        <div className="text-center py-4">
                          <p className="text-red-500 mb-2">{error}</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.reload()}
                          >
                            Retry
                          </Button>
                        </div>
                      ) : category.pdfs.length > 0 ? (
                        category.pdfs.map((pdf, index) => (
                          <div key={pdf.fileName} className="flex items-center gap-4 p-5 bg-background rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200">
                            <div className="bg-primary/10 rounded-lg p-2">
                              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-foreground text-lg mb-1">
                                {pdf.title}
                              </h5>
                              <p className="text-base text-muted-foreground mb-2">
                                {pdf.description}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Uploaded: {new Date(pdf.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => window.open(pdf.url, '_blank')}
                              className="border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View PDF
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground text-lg">
                            No conversations available yet. Check back soon!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-card/20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-muted-foreground mb-4">
            Join the Platform - Built for Business Leaders!   
          </p>
         
          <Button 
            variant="default" 
            size="lg"
            onClick={() => setShowWaitlistModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Join the Team Today
          </Button>
        </div>
      </footer>

      {/* Exclusive Waitlist Modal */}
      <ExclusiveWaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
      />
    </div>
  )
}