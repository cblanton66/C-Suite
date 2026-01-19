"use client"

import { TaxCalculator } from "@/components/tax-calculator"
import { usePageAnalytics } from "@/hooks/use-analytics"

export default function TaxCalcPage() {
  usePageAnalytics('tax-calc')
  return (
    <main className="min-h-screen bg-background">
      <TaxCalculator />
    </main>
  )
}
