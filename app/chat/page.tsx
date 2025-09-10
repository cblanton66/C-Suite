"use client"
import { ChatInterface } from "@/components/chat-interface"
import { usePageAnalytics } from "@/hooks/use-analytics"

export default function ChatPage() {
  usePageAnalytics('chat')
  return (
    <main className="min-h-screen bg-background">
      <ChatInterface />
    </main>
  )
}
