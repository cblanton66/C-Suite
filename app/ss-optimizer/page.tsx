"use client"

import { SSOptimizer } from "@/components/ss-optimizer"
import { usePageAnalytics } from "@/hooks/use-analytics"

export default function SSOptimizerPage() {
  usePageAnalytics('ss-optimizer')
  return (
    <main className="min-h-screen bg-background">
      <SSOptimizer />
    </main>
  )
}
