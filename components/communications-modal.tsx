"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Bell, X, MessageSquare, Megaphone, Clock, Star, ArrowLeft } from "lucide-react"

interface Communication {
  id: string
  type: 'update' | 'feedback_response' | 'feedback_submitted'
  date: string
  title: string
  message: string
  targetAudience?: string
  createdBy: string
  originalFeedback?: {
    type: string
    subject: string
    message: string
    rating: string
    date: string
  }
}

interface CommunicationsModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
  onReadUpdate?: () => void
}

export function CommunicationsModal({ isOpen, onClose, userEmail, onReadUpdate }: CommunicationsModalProps) {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'updates' | 'feedback'>('all')
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null)

  const fetchCommunications = async () => {
    if (!userEmail) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/communications?userEmail=${encodeURIComponent(userEmail)}&type=all`)
      const data = await response.json()
      
      if (data.success) {
        setCommunications(data.communications || [])
      }
    } catch (error) {
      console.error('Error fetching communications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && userEmail) {
      fetchCommunications()
      // Mark updates as read when modal is opened
      markUpdatesAsRead()
    }
  }, [isOpen, userEmail])

  const markUpdatesAsRead = () => {
    if (!userEmail) return
    
    const readUpdatesKey = `read_updates_${userEmail}`
    const now = new Date().toISOString()
    localStorage.setItem(readUpdatesKey, now)
    
    // Notify parent component to refresh badge counts
    if (onReadUpdate) {
      onReadUpdate()
    }
  }

  const filteredCommunications = communications.filter(comm => {
    if (activeTab === 'all') return true
    if (activeTab === 'updates') return comm.type === 'update'
    if (activeTab === 'feedback') return comm.type === 'feedback_response' || comm.type === 'feedback_submitted'
    return true
  })

  const updatesCount = communications.filter(c => c.type === 'update').length
  const feedbackCount = communications.filter(c => c.type === 'feedback_response' || c.type === 'feedback_submitted').length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-4xl mx-4 max-h-[85vh] shadow-2xl border-2 border-primary/20">
        {selectedCommunication ? (
          // Detailed view
          <div className="flex flex-col h-full max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCommunication(null)}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    {selectedCommunication.type === 'update' ? (
                      <Megaphone className="w-6 h-6 text-primary-foreground" />
                    ) : (
                      <MessageSquare className="w-6 h-6 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedCommunication.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedCommunication.date).toLocaleString()} • {selectedCommunication.createdBy}
                    </p>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {selectedCommunication.originalFeedback && selectedCommunication.type === 'feedback_response' && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Your Original Feedback</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">{selectedCommunication.originalFeedback.type}</span>
                      {selectedCommunication.originalFeedback.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{selectedCommunication.originalFeedback.rating}</span>
                        </div>
                      )}
                      <span className="text-muted-foreground">
                        {new Date(selectedCommunication.originalFeedback.date).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-medium">{selectedCommunication.originalFeedback.subject}</h4>
                    <p className="text-sm text-muted-foreground">{selectedCommunication.originalFeedback.message}</p>
                  </div>
                </div>
              )}

              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer content={selectedCommunication.message} />
              </div>
            </div>
          </div>
        ) : (
          // List view
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Communications</h2>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({communications.length})
              </button>
              <button
                onClick={() => setActiveTab('updates')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'updates'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                System Updates ({updatesCount})
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'feedback'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                My Feedback ({feedbackCount})
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading communications...</p>
                </div>
              ) : filteredCommunications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {activeTab === 'all' ? 'No communications yet' : 
                     activeTab === 'updates' ? 'No updates yet' : 
                     'No feedback responses yet'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {activeTab === 'updates' ? 'Admin announcements will appear here' :
                     activeTab === 'feedback' ? 'Responses to your feedback will appear here' :
                     'Updates and feedback responses will appear here'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCommunications.map((communication) => (
                    <div
                      key={communication.id}
                      className="border border-border rounded-lg p-4 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedCommunication(communication)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            communication.type === 'update' 
                              ? 'bg-blue-100 text-blue-700' 
                              : communication.type === 'feedback_response'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {communication.type === 'update' ? (
                              <Megaphone className="w-4 h-4" />
                            ) : (
                              <MessageSquare className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{communication.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(communication.date).toLocaleString()}</span>
                              <span>•</span>
                              <span>{communication.createdBy}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {communication.type === 'update' ? 'View' : 
                           communication.type === 'feedback_response' ? 'Response' : 
                           'Submitted'}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {communication.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}