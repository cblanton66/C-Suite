import { useState, useEffect } from 'react'

interface SampleReports {
  q3Financial: string
  q3FinancialTitle: string
  cashFlow: string
  cashFlowTitle: string
  taxStrategy: string
  taxStrategyTitle: string
  kpiDashboard: string
  kpiDashboardTitle: string
}

export function useSampleReports() {
  const [sampleReports, setSampleReports] = useState<SampleReports>({
    q3Financial: '#',
    q3FinancialTitle: 'Q3 Financial Analysis',
    cashFlow: '#',
    cashFlowTitle: 'Cash Flow Forecast',
    taxStrategy: '#',
    taxStrategyTitle: 'Tax Strategy Report',
    kpiDashboard: '#',
    kpiDashboardTitle: 'KPI Dashboard Review'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSampleReports = async () => {
      try {
        const response = await fetch('/api/sample-reports')
        const data = await response.json()
        
        if (data.success && data.reports) {
          setSampleReports({
            q3Financial: data.reports.q3Financial || '#',
            q3FinancialTitle: data.reports.q3FinancialTitle || 'Q3 Financial Analysis',
            cashFlow: data.reports.cashFlow || '#',
            cashFlowTitle: data.reports.cashFlowTitle || 'Cash Flow Forecast',
            taxStrategy: data.reports.taxStrategy || '#',
            taxStrategyTitle: data.reports.taxStrategyTitle || 'Tax Strategy Report',
            kpiDashboard: data.reports.kpiDashboard || '#',
            kpiDashboardTitle: data.reports.kpiDashboardTitle || 'KPI Dashboard Review'
          })
        }
      } catch (err) {
        console.error('Error fetching sample reports:', err)
        setError('Failed to load sample reports')
      } finally {
        setLoading(false)
      }
    }

    fetchSampleReports()
  }, [])

  return { sampleReports, loading, error }
}