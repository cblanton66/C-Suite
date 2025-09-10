"use client"
import { LandingPage } from "@/components/landing-page"
import { useRouter } from "next/navigation"
import { usePageAnalytics } from "@/hooks/use-analytics"

export default function Home() {
  const router = useRouter()
  usePageAnalytics('home')

  const handleNavigateToChat = () => {
    router.push("/chat")
  }

  return (
    <main className="min-h-screen bg-background">
      <LandingPage onNavigateToChat={handleNavigateToChat} />
    </main>
  )
}
