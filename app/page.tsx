"use client"
import { LandingPage } from "@/components/landing-page"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  const handleNavigateToChat = () => {
    router.push("/chat")
  }

  return (
    <main className="min-h-screen bg-background">
      <LandingPage onNavigateToChat={handleNavigateToChat} />
    </main>
  )
}
