"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Bookmark, X, Search, Copy, BookmarkCheck, MessageCircle } from "lucide-react"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  isBookmarked?: boolean
}

interface BookmarksModalProps {
  isOpen: boolean
  onClose: () => void
  bookmarkedMessages: Message[]
  onRemoveBookmark: (messageId: string) => void
  onCopyMessage: (content: string) => void
  onContinueConversation?: (message: Message & { sessionId?: string }) => void
}

export function BookmarksModal({ 
  isOpen, 
  onClose, 
  bookmarkedMessages, 
  onRemoveBookmark,
  onCopyMessage,
  onContinueConversation 
}: BookmarksModalProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredBookmarks = bookmarkedMessages.filter(message =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
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
      <Card className="relative w-full max-w-4xl mx-4 max-h-[85vh] shadow-2xl border-2 border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Bookmarked Messages</h2>
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

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search bookmarked messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <BookmarkCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No bookmarks found matching your search" : "No bookmarked messages yet"}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Click the bookmark icon on any message to save it here
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookmarks.map((message) => (
                <div
                  key={message.id}
                  className="border border-border rounded-lg p-4 bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        message.role === 'user' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {message.role === 'user' ? 'U' : 'AI'}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleDateString()} at{' '}
                        {new Date(message.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {onContinueConversation && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onContinueConversation(message as Message & { sessionId?: string })}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          title="Continue conversation"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopyMessage(message.content)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Copy message"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveBookmark(message.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Remove bookmark"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    {message.role === 'assistant' ? (
                      <MarkdownRenderer content={message.content} />
                    ) : (
                      <p className="text-foreground whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}