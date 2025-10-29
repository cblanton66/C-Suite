"use client"

import { InvestingDashboard } from "@/components/investing-dashboard"
import { usePageAnalytics } from "@/hooks/use-analytics"

export default function InvestingPage() {
  usePageAnalytics('investing')
  return (
    <main className="min-h-screen bg-background">
      <InvestingDashboard />
    </main>
  )
}
