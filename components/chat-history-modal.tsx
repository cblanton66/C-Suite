"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { History, X, Search, Plus, Trash2 } from "lucide-react"

interface ChatSession {
  id: string
  title: string
  lastMessage: string
  timestamp: string
  messages: any[]
}

interface ChatHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  chatSessions: ChatSession[]
  currentSessionId: string
  onLoadSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
  onStartNewChat: () => void
  onClearAll: () => void
}

export function ChatHistoryModal({
  isOpen,
  onClose,
  chatSessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onStartNewChat,
  onClearAll
}: ChatHistoryModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && isSearching && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, isSearching])

  const handleSearchToggle = () => {
    setIsSearching(!isSearching)
    if (!isSearching) {
      setSearchQuery("")
    }
  }

  const filteredSessions = chatSessions.filter(session =>
    (session.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-2xl mx-4 max-h-[80vh] shadow-2xl border-2 border-primary/20">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Chat History</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearchToggle}
              className="h-8 w-8 p-0"
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Interface */}
        {isSearching && (
          <div className="p-4 border-b border-border">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* New Chat Button */}
          <Button
            onClick={() => {
              onStartNewChat()
              onClose()
            }}
            className="w-full mb-2 justify-start"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New Chat
          </Button>

          {/* Clear All History Button */}
          {chatSessions.length > 0 && (
            <Button
              onClick={onClearAll}
              className="w-full mb-4 justify-start"
              variant="outline"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All History
            </Button>
          )}

          {/* Chat Sessions */}
          <div className="space-y-2">
            {filteredSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {searchQuery ? "No chats found matching your search" : "No chat history yet"}
              </p>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    session.id === currentSessionId
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    onLoadSession(session.id)
                    onClose()
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {session.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {session.lastMessage}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="h-auto p-1 ml-2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}