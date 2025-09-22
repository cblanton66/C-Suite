"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send, Mic, MicOff, X, Maximize2, Minimize2 } from "lucide-react"

interface FloatingChatCompanionProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  isListening: boolean
  onToggleListening: () => void
  apiStatus?: { hasApiKey: boolean }
  className?: string
}

export function FloatingChatCompanion({
  input,
  setInput,
  onSubmit,
  isLoading,
  isListening,
  onToggleListening,
  apiStatus,
  className = ""
}: FloatingChatCompanionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 }) // bottom-right offset
  const [isMobile, setIsMobile] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isExpanded) {
      const textarea = textareaRef.current
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 200)
      textarea.style.height = `${newHeight}px`
    }
  }, [input, isExpanded])

  // Detect mobile device and adjust position
  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 768 || 'ontouchstart' in window
      setIsMobile(newIsMobile)
      
      // Auto-position for mobile thumb zone (bottom-right for right-handed users)
      if (newIsMobile && position.x === 20 && position.y === 20) {
        setPosition({ 
          x: Math.max(20, window.innerWidth - 100), // Right side
          y: Math.max(100, window.innerHeight - 150) // Bottom thumb zone
        })
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [position.x, position.y])

  // Focus textarea when expanded (except on mobile to avoid keyboard issues)
  useEffect(() => {
    if (isExpanded && textareaRef.current && !isMobile) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isExpanded, isMobile])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) return // Don't drag when expanded
    
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isExpanded || e.touches.length !== 1) return // Don't drag when expanded or multi-touch
    
    const touch = e.touches[0]
    setIsDragging(true)
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startPosX: position.x,
      startPosY: position.y
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragRef.current || isExpanded) return
    
    const deltaX = e.clientX - dragRef.current.startX
    const deltaY = e.clientY - dragRef.current.startY
    
    const newX = Math.max(20, Math.min(window.innerWidth - 80, dragRef.current.startPosX + deltaX))
    const newY = Math.max(20, Math.min(window.innerHeight - 80, dragRef.current.startPosY + deltaY))
    
    setPosition({ x: newX, y: newY })
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !dragRef.current || isExpanded || e.touches.length !== 1) return
    
    e.preventDefault() // Prevent scrolling
    const touch = e.touches[0]
    const deltaX = touch.clientX - dragRef.current.startX
    const deltaY = touch.clientY - dragRef.current.startY
    
    const newX = Math.max(20, Math.min(window.innerWidth - 80, dragRef.current.startPosX + deltaX))
    const newY = Math.max(20, Math.min(window.innerHeight - 80, dragRef.current.startPosY + deltaY))
    
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    dragRef.current = null
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    dragRef.current = null
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging])

  const handleExpand = () => {
    setIsExpanded(true)
    setIsMinimized(false)
  }

  const handleCollapse = () => {
    setIsExpanded(false)
  }

  const handleSubmitWithCollapse = (e: React.FormEvent) => {
    onSubmit(e)
    setIsExpanded(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmitWithCollapse(e)
    }
    if (e.key === 'Escape') {
      setIsExpanded(false)
    }
  }

  if (isMinimized) {
    return (
      <div 
        className={`fixed z-50 ${className}`}
        style={{ 
          right: `${position.x}px`, 
          bottom: `${position.y}px`,
        }}
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg border-2 border-white"
          size="sm"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop for expanded mode */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={handleCollapse}
        />
      )}
      
      <div 
        className={`fixed z-50 transition-all duration-300 ${className}`}
        style={
          isExpanded 
            ? { 
                left: '50%', 
                top: '50%', 
                transform: 'translate(-50%, -50%)',
              }
            : { 
                right: `${position.x}px`, 
                bottom: `${position.y}px`,
              }
        }
      >
        {!isExpanded ? (
          // Collapsed floating bubble
          <div className="relative group">
            <Button
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onClick={handleExpand}
              disabled={isLoading || !apiStatus?.hasApiKey}
              className={`
                ${isMobile ? 'w-16 h-16' : 'w-14 h-14'} rounded-full bg-primary hover:bg-primary/90 shadow-lg border-2 border-white
                transition-all duration-200 cursor-move hover:cursor-pointer hover:scale-105
                ${isDragging ? 'scale-95 cursor-grabbing' : ''}
                ${isLoading ? 'animate-pulse' : ''}
                ${isMobile ? 'active:scale-95' : ''}
              `}
              size="sm"
            >
              <MessageCircle className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
            </Button>
            
            {/* Tooltip - Only show on desktop */}
            {!isMobile && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Click to ask follow-up • Drag to move
              </div>
            )}
          </div>
        ) : (
          // Expanded input modal
          <div className={`bg-card border border-border rounded-2xl shadow-2xl overflow-hidden ${
            isMobile 
              ? 'w-[95vw] max-w-none h-[70vh]' 
              : 'w-[90vw] max-w-2xl max-h-[80vh]'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Continue Conversation</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="w-8 h-8 p-0"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCollapse}
                  className="w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmitWithCollapse} className="p-4">
              <div className="space-y-4">
                <textarea
                  ref={textareaRef}
                  placeholder="Ask a follow-up question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                    isMobile 
                      ? 'min-h-[120px] max-h-[180px] text-base' 
                      : 'min-h-[100px] max-h-[200px]'
                  }`}
                  disabled={isLoading || !apiStatus?.hasApiKey}
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onToggleListening}
                      disabled={isLoading || !apiStatus?.hasApiKey}
                      className={isListening ? "bg-red-100 text-red-700 border-red-300" : ""}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-4 h-4 mr-2" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Voice
                        </>
                      )}
                    </Button>
                    
                    <span className="text-xs text-muted-foreground">
                      {isLoading ? "Thinking..." : isMobile ? "Tap Send" : "⌘+Enter to send"}
                    </span>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading || !apiStatus?.hasApiKey}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  )
}