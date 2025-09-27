"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Megaphone, X, Plus, MessageSquare, Send, Clock, User, Star, Reply, Settings, ToggleLeft, ToggleRight } from "lucide-react"

interface FeedbackItem {
  rowIndex: number
  timestamp: string
  email: string
  feedbackType: string
  subject: string
  message: string
  rating: string
  adminResponse?: string
  responseDate?: string
}

interface AdminCommunicationsModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export function AdminCommunicationsModal({ isOpen, onClose, userEmail }: AdminCommunicationsModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'feedback' | 'settings'>('create')
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(false)

  // Create Update State
  const [updateTitle, setUpdateTitle] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')
  const [targetAudience, setTargetAudience] = useState('All Users')
  const [creating, setCreating] = useState(false)

  // Feedback Response State
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [responseText, setResponseText] = useState('')
  const [responding, setResponding] = useState(false)

  // Landing Page Settings State
  const [videoDemoVisible, setVideoDemoVisible] = useState(false)
  const [showTargetPersonas, setShowTargetPersonas] = useState(true)
  const [showPowerfulFramework, setShowPowerfulFramework] = useState(true)
  const [showBenefitsSection, setShowBenefitsSection] = useState(true)
  const [dynamicMessage, setDynamicMessage] = useState('You Have the Advantage Today!')
  const [updatingSettings, setUpdatingSettings] = useState(false)

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/submit-feedback?action=list')
      const data = await response.json()
      
      if (data.success) {
        console.log('Admin feedback data:', data.feedback)
        setFeedbackItems(data.feedback || [])
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminSettings = async () => {
    try {
      const response = await fetch('/api/admin-settings')
      const data = await response.json()
      
      if (data.success) {
        setVideoDemoVisible(data.settings.videoDemoVisible ?? false)
        setShowTargetPersonas(data.settings.showTargetPersonas ?? true)
        setShowPowerfulFramework(data.settings.showPowerfulFramework ?? true)
        setShowBenefitsSection(data.settings.showBenefitsSection ?? true)
        setDynamicMessage(data.settings.dynamicMessage ?? 'You Have the Advantage Today!')
      }
    } catch (error) {
      console.error('Error fetching admin settings:', error)
    }
  }

  const updateAdminSettings = async () => {
    setUpdatingSettings(true)
    try {
      const response = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          videoDemoVisible,
          showTargetPersonas,
          showPowerfulFramework,
          showBenefitsSection,
          dynamicMessage
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Settings updated successfully!')
      } else {
        alert(data.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Failed to update settings')
    } finally {
      setUpdatingSettings(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'feedback') {
        fetchFeedback()
      } else if (activeTab === 'settings') {
        fetchAdminSettings()
      }
    }
  }, [isOpen, activeTab])

  const createUpdate = async () => {
    if (!updateTitle.trim() || !updateMessage.trim()) {
      alert('Please fill in both title and message')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_update',
          userEmail,
          title: updateTitle.trim(),
          message: updateMessage.trim(),
          targetAudience
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Update posted successfully!')
        setUpdateTitle('')
        setUpdateMessage('')
        setTargetAudience('All Users')
      } else {
        alert(data.error || 'Failed to create update')
      }
    } catch (error) {
      console.error('Error creating update:', error)
      alert('Failed to create update')
    } finally {
      setCreating(false)
    }
  }

  const respondToFeedback = async () => {
    if (!selectedFeedback || !responseText.trim()) {
      alert('Please enter a response')
      return
    }

    setResponding(true)
    try {
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_to_feedback',
          userEmail,
          feedbackRowIndex: selectedFeedback.rowIndex,
          response: responseText.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Response sent successfully!')
        setSelectedFeedback(null)
        setResponseText('')
        fetchFeedback() // Refresh the list
      } else {
        alert(data.error || 'Failed to send response')
      }
    } catch (error) {
      console.error('Error responding to feedback:', error)
      alert('Failed to send response')
    } finally {
      setResponding(false)
    }
  }

  const unrespondedFeedback = feedbackItems.filter(item => !item.adminResponse)
  const respondedFeedback = feedbackItems.filter(item => item.adminResponse)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-5xl mx-4 max-h-[90vh] shadow-2xl border-2 border-primary/20">
        {selectedFeedback ? (
          // Feedback Response View
          <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFeedback(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Reply className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Respond to Feedback</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedFeedback.email} • {new Date(selectedFeedback.timestamp).toLocaleString()}
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

            {/* Original Feedback */}
            <div className="p-6 border-b border-border">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Original Feedback</span>
                  {selectedFeedback.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{selectedFeedback.rating}/5</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">{selectedFeedback.feedbackType}</span>
                    <span className="text-muted-foreground">
                      {new Date(selectedFeedback.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-medium">{selectedFeedback.subject}</h4>
                  <p className="text-sm text-muted-foreground">{selectedFeedback.message}</p>
                </div>
              </div>
            </div>

            {/* Response Form */}
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="response" className="block text-sm font-medium text-foreground mb-2">
                    Your Response
                  </label>
                  <textarea
                    id="response"
                    placeholder="Type your response to this feedback..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="w-full h-40 p-3 border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This response will be visible to the user in their communications.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={respondToFeedback}
                    disabled={responding || !responseText.trim()}
                    className="flex-1"
                  >
                    {responding ? 'Sending...' : 'Send Response'}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedFeedback(null)}
                    disabled={responding}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Main View
          <>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-purple-700" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Admin Communications</h2>
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
                onClick={() => setActiveTab('create')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'create'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Create Update
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'feedback'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Respond to Feedback
                {unrespondedFeedback.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {unrespondedFeedback.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Settings className="w-4 h-4 mr-2 inline" />
                Landing Page Settings
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {activeTab === 'create' ? (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                      Update Title
                    </label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Enter update title..."
                      value={updateTitle}
                      onChange={(e) => setUpdateTitle(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      placeholder="Enter your message... (Markdown supported)"
                      value={updateMessage}
                      onChange={(e) => setUpdateMessage(e.target.value)}
                      className="w-full h-32 p-3 border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="audience" className="block text-sm font-medium text-foreground mb-2">
                      Target Audience
                    </label>
                    <select
                      id="audience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full p-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="All Users">All Users</option>
                      <option value="Beta Users">Platform Members</option>
                    </select>
                  </div>

                  <Button 
                    onClick={createUpdate}
                    disabled={creating || !updateTitle.trim() || !updateMessage.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {creating ? 'Posting...' : 'Post Update'}
                    <Plus className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : activeTab === 'feedback' ? (
                <div className="space-y-6">
                  {/* Unresponded Feedback */}
                  {unrespondedFeedback.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Needs Response ({unrespondedFeedback.length})
                      </h3>
                      <div className="space-y-3">
                        {unrespondedFeedback.map((feedback, index) => (
                          <div
                            key={index}
                            className="border border-input rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setSelectedFeedback(feedback)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-foreground">{feedback.subject}</h4>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>{feedback.email}</span>
                                  <span>•</span>
                                  <span>{feedback.feedbackType}</span>
                                  <span>•</span>
                                  <span>{new Date(feedback.timestamp).toLocaleString()}</span>
                                  {feedback.rating && (
                                    <>
                                      <span>•</span>
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span>{feedback.rating}/5</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                <Reply className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{feedback.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Responded Feedback */}
                  {respondedFeedback.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Recently Responded ({respondedFeedback.length})
                      </h3>
                      <div className="space-y-3">
                        {respondedFeedback.slice(0, 5).map((feedback, index) => (
                          <div
                            key={index}
                            className="border border-input rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-foreground">{feedback.subject}</h4>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>{feedback.email}</span>
                                  <span>•</span>
                                  <span>{feedback.feedbackType}</span>
                                  <span>•</span>
                                  <span>Responded {new Date(feedback.responseDate!).toLocaleString()}</span>
                                  {feedback.rating && (
                                    <>
                                      <span>•</span>
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span>{feedback.rating}/5</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Original Feedback */}
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                                <MessageSquare className="w-4 h-4 inline mr-2 text-green-700 dark:text-green-400" />
                                Original Feedback
                              </label>
                              <div className="p-3 border border-input rounded-lg space-y-2">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{feedback.feedbackType}</span>
                                  <span>•</span>
                                  <span>{new Date(feedback.timestamp).toLocaleString()}</span>
                                  {feedback.rating && (
                                    <>
                                      <span>•</span>
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span>{feedback.rating}/5</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <h4 className="font-medium text-green-700 dark:text-green-400">{feedback.subject}</h4>
                                <p className="text-sm text-green-600 dark:text-green-300">{feedback.message}</p>
                              </div>
                            </div>
                            
                            {/* Your Response */}
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">
                                <Reply className="w-4 h-4 inline mr-2 text-purple-600 dark:text-purple-400" />
                                Your Response
                              </label>
                              <div className="p-3 border border-input rounded-lg">
                                <p className="text-sm text-purple-600 dark:text-purple-400">{feedback.adminResponse}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading feedback...</p>
                    </div>
                  )}

                  {!loading && feedbackItems.length === 0 && (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No feedback submissions yet</p>
                    </div>
                  )}
                </div>
              ) : activeTab === 'settings' ? (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Landing Page Settings
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Control which sections are visible on the landing page to customize the user experience.
                    </p>
                  </div>

                  {/* Dynamic Message */}
                  <div>
                    <label htmlFor="dynamicMessage" className="block text-sm font-medium text-foreground mb-2">
                      Dynamic Message
                    </label>
                    <Input
                      id="dynamicMessage"
                      type="text"
                      placeholder="Enter dynamic message..."
                      value={dynamicMessage}
                      onChange={(e) => setDynamicMessage(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This message appears prominently on the landing page
                    </p>
                  </div>

                  {/* Toggle Controls */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Section Visibility</h4>
                    
                    {/* Video Demo Toggle */}
                    <div className="flex items-center justify-between p-3 border border-input rounded-lg">
                      <div>
                        <div className="font-medium text-foreground">Video Demo</div>
                        <div className="text-sm text-muted-foreground">Show the video demonstration section</div>
                      </div>
                      <button
                        onClick={() => setVideoDemoVisible(!videoDemoVisible)}
                        className="flex items-center"
                      >
                        {videoDemoVisible ? (
                          <ToggleRight className="w-8 h-8 text-primary" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    {/* Target Personas Toggle */}
                    <div className="flex items-center justify-between p-3 border border-input rounded-lg">
                      <div>
                        <div className="font-medium text-foreground">Target Personas Section</div>
                        <div className="text-sm text-muted-foreground">Show the "Designed for Financial Professionals" section</div>
                      </div>
                      <button
                        onClick={() => setShowTargetPersonas(!showTargetPersonas)}
                        className="flex items-center"
                      >
                        {showTargetPersonas ? (
                          <ToggleRight className="w-8 h-8 text-primary" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    {/* POWERFUL Framework Toggle */}
                    <div className="flex items-center justify-between p-3 border border-input rounded-lg">
                      <div>
                        <div className="font-medium text-foreground">POWERFUL Framework Section</div>
                        <div className="text-sm text-muted-foreground">Show the "What Makes PeakSuite.ai POWERFUL" section</div>
                      </div>
                      <button
                        onClick={() => setShowPowerfulFramework(!showPowerfulFramework)}
                        className="flex items-center"
                      >
                        {showPowerfulFramework ? (
                          <ToggleRight className="w-8 h-8 text-primary" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    {/* Benefits Section Toggle */}
                    <div className="flex items-center justify-between p-3 border border-input rounded-lg">
                      <div>
                        <div className="font-medium text-foreground">Benefits Section</div>
                        <div className="text-sm text-muted-foreground">Show the "Platform Capabilities at a Glance" section</div>
                      </div>
                      <button
                        onClick={() => setShowBenefitsSection(!showBenefitsSection)}
                        className="flex items-center"
                      >
                        {showBenefitsSection ? (
                          <ToggleRight className="w-8 h-8 text-primary" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button 
                    onClick={updateAdminSettings}
                    disabled={updatingSettings}
                    className="w-full"
                    size="lg"
                  >
                    {updatingSettings ? 'Updating...' : 'Update Landing Page Settings'}
                    <Settings className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Select a tab to get started</p>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}