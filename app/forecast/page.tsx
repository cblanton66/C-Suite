"use client"

import { FinancialForecast } from "@/components/financial-forecast"
import { usePageAnalytics } from "@/hooks/use-analytics"

export default function ForecastPage() {
  usePageAnalytics('forecast')
  return (
    <main className="min-h-screen bg-background">
      <FinancialForecast />
    </main>
  )
}
