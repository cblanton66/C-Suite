"use client"

import { useState } from "react"
import { useSampleReports } from "@/hooks/use-sample-reports"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  Users, 
  Settings, 
  MessageCircle,
  FileText,
  Share2,
  Zap,
  Shield,
  HelpCircle,
  ArrowLeft,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

interface Section {
  id: string
  title: string
  content: React.ReactNode
  icon: React.ReactNode
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSections, setExpandedSections] = useState<string[]>(["getting-started"])
  const { sampleReports } = useSampleReports()

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const isCurrentlyExpanded = prev.includes(sectionId)
      
      if (isCurrentlyExpanded) {
        // Close the section
        return prev.filter(id => id !== sectionId)
      } else {
        // Close all other sections and open this one
        setTimeout(() => {
          const element = document.getElementById(sectionId)
          if (element) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            })
          }
        }, 100) // Small delay to allow UI to update first
        
        return [sectionId]
      }
    })
  }

  const sections: Section[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <BookOpen className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">What is PeakSuite.ai?</h3>
            <p className="text-muted-foreground mb-4">
              PeakSuite.ai is your virtual CFO - an AI-powered business intelligence platform that provides executive-level financial guidance and analysis. Think of it as having a CPA with 31 years of experience available 24/7 to help with:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Tax strategy and compliance</li>
              <li>Cash flow management and forecasting</li>
              <li>Business performance analysis</li>
              <li>Strategic planning and growth scenarios</li>
              <li>Risk management and compliance monitoring</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">The P.E.A.K. Framework</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <h4 className="font-semibold">Performance</h4>
                </div>
                <p className="text-sm text-muted-foreground">Real-time KPI tracking and benchmarking</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💡</span>
                  <h4 className="font-semibold">Empower</h4>
                </div>
                <p className="text-sm text-muted-foreground">Data-driven insights for confident decision making</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📊</span>
                  <h4 className="font-semibold">Analysis</h4>
                </div>
                <p className="text-sm text-muted-foreground">Deep dive into your financial and operational data</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🧠</span>
                  <h4 className="font-semibold">Knowledge</h4>
                </div>
                <p className="text-sm text-muted-foreground">31 years of CPA expertise at your fingertips</p>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Sample Questions to Get Started</h3>
            <div className="space-y-3">
              <Card className="p-3">
                <h4 className="font-medium text-green-600 mb-1">Tax Strategy</h4>
                <p className="text-sm text-muted-foreground">"What quarterly tax strategies should I consider for my service business?"</p>
              </Card>
              <Card className="p-3">
                <h4 className="font-medium text-blue-600 mb-1">Cash Flow</h4>
                <p className="text-sm text-muted-foreground">"Help me create a 13-week cash flow forecast"</p>
              </Card>
              <Card className="p-3">
                <h4 className="font-medium text-purple-600 mb-1">Business Analysis</h4>
                <p className="text-sm text-muted-foreground">"Analyze my P&L statement and identify improvement opportunities"</p>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "chat-interface",
      title: "Chat Interface Guide",
      icon: <MessageCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Your AI Assistant</h3>
            <p className="text-muted-foreground mb-4">
              When you log in, you'll be greeted by your personal AI assistant (customizable name in your profile). This isn't just a chatbot - it's a sophisticated business advisor that:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Remembers context</strong> from your entire conversation history</li>
              <li><strong>Analyzes your files</strong> automatically when you upload them</li>
              <li><strong>Generates professional charts</strong> and visualizations</li>
              <li><strong>Creates shareable reports</strong> for clients and stakeholders</li>
              <li><strong>Provides industry-specific guidance</strong> based on your business type</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Chat Features</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🎤</span>
                  <h4 className="font-semibold">Voice Input</h4>
                </div>
                <p className="text-sm text-muted-foreground">Click the microphone icon to speak your question - perfect for complex queries</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📌</span>
                  <h4 className="font-semibold">Bookmarks</h4>
                </div>
                <p className="text-sm text-muted-foreground">Save important conversations for easy reference and future planning</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📊</span>
                  <h4 className="font-semibold">Chart Generation</h4>
                </div>
                <p className="text-sm text-muted-foreground">Automatically creates bar, line, and pie charts from your data discussions</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📁</span>
                  <h4 className="font-semibold">File Integration</h4>
                </div>
                <p className="text-sm text-muted-foreground">Upload PDFs and documents for automatic analysis and context</p>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Message Actions</h3>
            <p className="text-muted-foreground mb-3">Each AI response includes several helpful options:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                <span className="text-xl">📌</span>
                <div>
                  <strong>Bookmark</strong>
                  <p className="text-sm text-muted-foreground">Save important conversations for easy reference</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                <span className="text-xl">📊</span>
                <div>
                  <strong>Share as Report</strong>
                  <p className="text-sm text-muted-foreground">Convert responses into professional, shareable reports</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                <span className="text-xl">📋</span>
                <div>
                  <strong>Copy</strong>
                  <p className="text-sm text-muted-foreground">Copy message text to clipboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "file-management",
      title: "File Management",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Supported File Types</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">📄 PDF Documents</h4>
                <p className="text-sm text-muted-foreground">Primary format for financial statements, contracts, and business documents</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">📊 Excel Files</h4>
                <p className="text-sm text-muted-foreground">Spreadsheets (.xlsx, .xls) for data analysis</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">📈 CSV Files</h4>
                <p className="text-sm text-muted-foreground">Data exports and structured datasets</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">📝 Word Documents</h4>
                <p className="text-sm text-muted-foreground">Business plans and reports (.docx, .doc)</p>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Upload Process</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">1</div>
                <div>
                  <h4 className="font-medium">Click Upload Files Button</h4>
                  <p className="text-sm text-muted-foreground">Find the 📎 button in the chat interface</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">2</div>
                <div>
                  <h4 className="font-medium">Select Files</h4>
                  <p className="text-sm text-muted-foreground">Drag and drop or click to browse (5 files max, 10MB each)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">3</div>
                <div>
                  <h4 className="font-medium">Automatic Processing</h4>
                  <p className="text-sm text-muted-foreground">Files are analyzed and become available in your conversations</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Best Practices</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Upload financial statements in PDF format for best results</li>
              <li>Ensure documents are text-based (not scanned images)</li>
              <li>Name files descriptively for easier reference</li>
              <li>Use clear, professional document formatting</li>
              <li>Upload related documents together for better context</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "report-sharing",
      title: "Report Creation & Sharing",
      icon: <Share2 className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Creating Professional Reports</h3>
            <p className="text-muted-foreground mb-4">
              Transform your AI conversations into professional, shareable business reports perfect for clients and stakeholders.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                <div>
                  <h4 className="font-medium">Generate AI Response</h4>
                  <p className="text-sm text-muted-foreground">Have a comprehensive conversation to create valuable business insights</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                <div>
                  <h4 className="font-medium">Click "Share as Report"</h4>
                  <p className="text-sm text-muted-foreground">Find this option on any AI response you want to share</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                <div>
                  <h4 className="font-medium">AI Suggests Details</h4>
                  <p className="text-sm text-muted-foreground">Our AI automatically suggests professional titles and descriptions ⭐</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
                <div>
                  <h4 className="font-medium">Customize & Share</h4>
                  <p className="text-sm text-muted-foreground">Edit details and generate your professional shareable link</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-600">AI-Powered Suggestions ⭐</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              PeakSuite.ai automatically analyzes your report content and suggests professional titles and descriptions. 
              This unique feature saves time and ensures executive-appropriate language that sets us apart from generic tools!
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Report Details Form</h3>
            <div className="space-y-3">
              <Card className="p-3">
                <h4 className="font-medium text-green-600 mb-1">📝 Report Title (Required)</h4>
                <p className="text-sm text-muted-foreground">AI suggests professional titles like "Q3 Financial Analysis & Recommendations"</p>
              </Card>
              <Card className="p-3">
                <h4 className="font-medium text-green-600 mb-1">📄 Report Description</h4>
                <p className="text-sm text-muted-foreground">AI provides brief content summaries for recipient understanding</p>
              </Card>
              <Card className="p-3">
                <h4 className="font-medium text-green-600 mb-1">📅 Expiration Date</h4>
                <p className="text-sm text-muted-foreground">Default: 2 days from creation (customizable for security)</p>
              </Card>
              <Card className="p-3">
                <h4 className="font-medium text-green-600 mb-1">👤 Client Name</h4>
                <p className="text-sm text-muted-foreground">Optional field for organization and relationship management</p>
              </Card>
              <Card className="p-3">
                <h4 className="font-medium text-green-600 mb-1">📧 Client Email</h4>
                <p className="text-sm text-muted-foreground">Optional but recommended for tracking and notifications</p>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Professional Report Features</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Clean, print-ready formatting suitable for executive presentations</li>
              <li>Professional branding with PeakSuite.ai header</li>
              <li>Blue print button for easy client printing</li>
              <li>Mobile-responsive design for viewing on any device</li>
              <li>No login required for recipients to view</li>
              <li>View tracking for engagement analytics</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "report-management",
      title: "Managing Your Reports",
      icon: <Settings className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">My Reports Dashboard</h3>
            <p className="text-muted-foreground mb-4">
              Access your complete report library via the user menu (top right) → "My Reports"
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">📊 Report Overview</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View all your shared reports</li>
                  <li>• Sort by newest first automatically</li>
                  <li>• Search by title, client, or project</li>
                  <li>• Track engagement analytics</li>
                </ul>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">📈 Analytics Display</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Creation date and timestamps</li>
                  <li>• View count and engagement</li>
                  <li>• Client information tracking</li>
                  <li>• Project type organization</li>
                </ul>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Report Actions</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded bg-muted/50">
                <span className="text-xl">📋</span>
                <div>
                  <h4 className="font-medium">Copy Link</h4>
                  <p className="text-sm text-muted-foreground">Instantly copy shareable URL to clipboard with confirmation</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded bg-muted/50">
                <span className="text-xl">🔗</span>
                <div>
                  <h4 className="font-medium">Open Report</h4>
                  <p className="text-sm text-muted-foreground">Preview exactly what clients see before sharing</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded bg-muted/50">
                <span className="text-xl">✏️</span>
                <div>
                  <h4 className="font-medium">Edit Info</h4>
                  <p className="text-sm text-muted-foreground">Modify title, description, and client information</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded bg-blue-50 dark:bg-blue-950/20">
                <span className="text-xl">📝</span>
                <div>
                  <h4 className="font-medium text-blue-600">Edit Content ⭐</h4>
                  <p className="text-sm text-muted-foreground">Unique feature: Reopen reports in chat to edit content and create new versions</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded bg-muted/50">
                <span className="text-xl">🗑️</span>
                <div>
                  <h4 className="font-medium">Delete Report</h4>
                  <p className="text-sm text-muted-foreground">Safe deletion with confirmation (soft delete preserves data)</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Search and Organization</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">🔍 Smart Search</h4>
                <p className="text-sm text-muted-foreground mb-2">Search across:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Report titles</li>
                  <li>• Client names</li>
                  <li>• Project types</li>
                  <li>• Content descriptions</li>
                </ul>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">📊 Usage Analytics</h4>
                <p className="text-sm text-muted-foreground mb-2">Track engagement:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Total view count per report</li>
                  <li>• Last viewed timestamps</li>
                  <li>• Client interaction patterns</li>
                  <li>• Report performance insights</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "advanced-features",
      title: "Advanced Features",
      icon: <Zap className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Chart Visualization</h3>
            <p className="text-muted-foreground mb-4">
              PeakSuite.ai automatically creates professional charts when discussing data and trends.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">📊 Bar Charts</h4>
                <p className="text-sm text-muted-foreground">Perfect for comparisons, rankings, and categorical data analysis</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">📈 Line Charts</h4>
                <p className="text-sm text-muted-foreground">Trends over time with automatic trend line calculation</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">🥧 Pie Charts</h4>
                <p className="text-sm text-muted-foreground">Proportional breakdowns and percentage distributions</p>
              </Card>
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Available Themes:</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Default (Blue)</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Business (Gray)</span>
                <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">Ocean</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Forest</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Sunset</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Purple</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Session Management</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">🔒 Automatic Security</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 5-minute timeout for data protection</li>
                  <li>• Activity automatically extends sessions</li>
                  <li>• Warning before automatic logout</li>
                  <li>• Local data preservation</li>
                </ul>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">📚 Chat History</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatic conversation saving</li>
                  <li>• Access via chat history modal</li>
                  <li>• Search through past conversations</li>
                  <li>• Reference previous advice</li>
                </ul>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Voice Input & Accessibility</h3>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🎤</span>
                <h4 className="font-semibold">Speech-to-Text</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 mb-3">
                <li>• Click microphone icon to speak questions</li>
                <li>• Automatic transcription using Web Speech API</li>
                <li>• Perfect for complex questions or multitasking</li>
                <li>• Works in Chrome, Safari, and modern browsers</li>
              </ul>
              <p className="text-sm text-blue-600 font-medium">Best Practices: Speak clearly in quiet environments for optimal accuracy</p>
            </Card>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Bookmarks System</h3>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📌</span>
                <h4 className="font-semibold">Save Important Insights</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Click bookmark icon on any valuable message</li>
                <li>• Access via bookmarks modal in chat interface</li>
                <li>• Perfect for tax strategies and business advice</li>
                <li>• Organize your most valuable insights</li>
                <li>• Reference key recommendations anytime</li>
              </ul>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: "security",
      title: "Security & Privacy",
      icon: <Shield className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Data Protection</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2 text-green-600">🔒 Session Security</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 5-minute automatic timeout</li>
                  <li>• Activity-based session extension</li>
                  <li>• Secure logout procedures</li>
                  <li>• Login attempt tracking</li>
                </ul>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2 text-blue-600">🏢 Enterprise-Grade Storage</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Google Cloud infrastructure</li>
                  <li>• Encrypted file storage</li>
                  <li>• Access-controlled environments</li>
                  <li>• Regular security audits</li>
                </ul>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Privacy Considerations</h3>
            <div className="space-y-3">
              <Card className="p-4 border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-600 mb-2">✅ What We Protect</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your business data is never used to train AI models</li>
                  <li>• Chat history stored locally in your browser</li>
                  <li>• Files isolated in user-specific folders</li>
                  <li>• Minimal data retention on servers</li>
                  <li>• You control report sharing and deletion</li>
                </ul>
              </Card>
              <Card className="p-4 border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-600 mb-2">🔍 Audit Trail</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View tracking for shared reports</li>
                  <li>• Access logging for accountability</li>
                  <li>• User activity monitoring</li>
                  <li>• Secure deletion with soft delete protection</li>
                </ul>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Permission System</h3>
            <p className="text-muted-foreground mb-4">
              PeakSuite.ai uses role-based permissions to ensure appropriate access levels:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded bg-muted/50">
                <span className="text-xl">💬</span>
                <div>
                  <h4 className="font-medium">Chat Permission</h4>
                  <p className="text-sm text-muted-foreground">Basic conversation access with AI assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded bg-muted/50">
                <span className="text-xl">📁</span>
                <div>
                  <h4 className="font-medium">Upload Permission</h4>
                  <p className="text-sm text-muted-foreground">File upload and document analysis capabilities</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded bg-muted/50">
                <span className="text-xl">⚙️</span>
                <div>
                  <h4 className="font-medium">Admin Permission</h4>
                  <p className="text-sm text-muted-foreground">Platform administration and user management</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <h4 className="font-semibold text-amber-600">Security Best Practices</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Always log out when finished, especially on shared computers</li>
              <li>• Use descriptive but not sensitive file names</li>
              <li>• Set appropriate expiration dates for sensitive reports</li>
              <li>• Regularly review your shared reports and delete outdated ones</li>
              <li>• Contact support immediately if you suspect unauthorized access</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting & FAQs",
      icon: <HelpCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Common Issues & Solutions</h3>
            
            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-semibold text-red-600 mb-2">🚫 Login Problems</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Issue: "User not found or access denied"</p>
                    <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                      <li>• Verify email address matches exactly</li>
                      <li>• Check that your account status is "Active"</li>
                      <li>• Confirm password is correct</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Issue: Session expires quickly</p>
                    <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                      <li>• This is normal security behavior (5-minute timeout)</li>
                      <li>• Stay active in chat to extend session automatically</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold text-orange-600 mb-2">📁 File Upload Issues</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Issue: "File too large" error</p>
                    <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                      <li>• Files must be under 10MB each</li>
                      <li>• Compress PDFs or split large documents</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Issue: PDF text extraction fails</p>
                    <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                      <li>• Ensure PDF contains selectable text (not scanned images)</li>
                      <li>• Documents must be 30 pages or fewer</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Issue: Upload button not visible</p>
                    <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                      <li>• Check that you have "upload" permission</li>
                      <li>• Contact admin to update your permissions</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold text-blue-600 mb-2">💬 Chat Interface Problems</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Issue: AI not responding</p>
                    <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                      <li>• Check internet connection and refresh page</li>
                      <li>• Clear browser cache and reload</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Issue: Charts not displaying</p>
                    <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                      <li>• Ensure JavaScript is enabled</li>
                      <li>• Try different browser or disable ad blockers</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Frequently Asked Questions</h3>
            
            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">❓ How is PeakSuite.ai different from ChatGPT?</h4>
                <p className="text-sm text-muted-foreground">
                  PeakSuite.ai is specifically designed for business and financial guidance with 31 years of CPA expertise built in. 
                  It integrates file analysis, professional report generation, chart creation, and business-specific knowledge that generic AI tools don't provide.
                </p>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2">🔒 Is my business data secure?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes. We use enterprise-grade Google Cloud infrastructure, implement session timeouts, permission-based access, 
                  and store files in secure, isolated environments. Your data is never used to train AI models.
                </p>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2">👥 Can multiple people use the same account?</h4>
                <p className="text-sm text-muted-foreground">
                  Each person needs their own account for security and personalization. However, you can share reports 
                  and collaborate through the sharing features.
                </p>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2">📱 Can I use this on my phone?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! The platform is fully responsive and works on mobile devices. Some features like file upload work best on desktop, 
                  but chat and report viewing are optimized for mobile.
                </p>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2">📊 How accurate is the AI advice?</h4>
                <p className="text-sm text-muted-foreground">
                  The AI is trained on 31 years of CPA experience and provides highly accurate guidance. However, 
                  always consult with your professional advisors for final decisions on complex matters.
                </p>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Browser Compatibility</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2 text-green-600">✅ Fully Supported</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Chrome 90+ (recommended)</li>
                  <li>• Safari 14+</li>
                  <li>• Firefox 88+</li>
                  <li>• Edge 90+</li>
                </ul>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2 text-orange-600">⚠️ Limited Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Speech-to-text requires modern browser</li>
                  <li>• File drag-and-drop needs recent version</li>
                  <li>• Some mobile features vary by device</li>
                </ul>
              </Card>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-600">Need More Help?</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Contact our support team for personalized assistance:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>General Support</strong>: support@peaksuite.ai</li>
              <li>• <strong>Technical Issues</strong>: tech@peaksuite.ai</li>
              <li>• <strong>Business Inquiries</strong>: sales@peaksuite.ai</li>
            </ul>
          </div>
        </div>
      )
    }
  ]

  const filteredSections = sections.filter(section =>
    searchQuery === "" ||
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toString().toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </Link>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">User Guide</h1>
                <p className="text-sm text-muted-foreground">Complete guide to PeakSuite.ai features</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search help topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Navigation */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Topics</h3>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => toggleSection(section.id)}
                      className={`w-full flex items-center justify-between p-2 text-left rounded-lg transition-colors ${
                        expandedSections.includes(section.id)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {section.icon}
                        <span className="text-sm font-medium">{section.title}</span>
                      </div>
                      {expandedSections.includes(section.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </nav>
              </Card>

              {/* Sample Reports */}
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Sample Reports</h3>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                  See real examples of professional reports generated by PeakSuite.ai
                </p>
                <div className="space-y-2">
                  <a
                    href={sampleReports.q3Financial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm group"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-blue-800 dark:text-blue-200 group-hover:text-blue-900 dark:group-hover:text-blue-100">{sampleReports.q3FinancialTitle}</span>
                    <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <a
                    href={sampleReports.cashFlow}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm group"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-blue-800 dark:text-blue-200 group-hover:text-blue-900 dark:group-hover:text-blue-100">{sampleReports.cashFlowTitle}</span>
                    <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <a
                    href={sampleReports.taxStrategy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm group"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-blue-800 dark:text-blue-200 group-hover:text-blue-900 dark:group-hover:text-blue-100">{sampleReports.taxStrategyTitle}</span>
                    <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <a
                    href={sampleReports.kpiDashboard}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm group"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-blue-800 dark:text-blue-200 group-hover:text-blue-900 dark:group-hover:text-blue-100">{sampleReports.kpiDashboardTitle}</span>
                    <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    ✨ Experience the quality firsthand
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {filteredSections.map((section) => (
                <Card
                  key={section.id}
                  id={section.id}
                  className={`transition-all duration-200 ${
                    expandedSections.includes(section.id) ? "border-primary/50" : ""
                  }`}
                >
                  <div
                    className="flex items-center justify-between p-6 cursor-pointer"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        expandedSections.includes(section.id) 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}>
                        {section.icon}
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                    </div>
                    {expandedSections.includes(section.id) ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  {expandedSections.includes(section.id) && (
                    <div className="px-6 pb-6">
                      <div className="h-px bg-border mb-6" />
                      {section.content}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {filteredSections.length === 0 && searchQuery && (
              <Card className="p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or browse the topics above.
                </p>
                <Button onClick={() => setSearchQuery("")} variant="outline">
                  Clear Search
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/30 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">
              <strong>PeakSuite.ai</strong> - Your AI-Powered Virtual CFO
            </p>
            <p className="text-sm">
              Last Updated: September 2025 | Platform Version: 1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}