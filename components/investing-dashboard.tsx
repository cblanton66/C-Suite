"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Save,
  Download,
  MessageCircle,
  RefreshCw,
  Home,
  ArrowLeft,
  DollarSign,
  Percent,
  PieChart,
  BarChart3,
  Calendar,
  Search
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { SessionManager } from "@/lib/session-manager"

interface TickerData {
  symbol: string
  name: string
  type: string
  description?: string
  marketCap?: number
  currentPrice?: number | null
  allocation: number // percentage
  rsi14?: number | null
  sma14?: number | null
  performance?: {
    oneMonth: number | null
    threeMonth: number | null
    sixMonth: number | null
    oneYear: number | null
  }
}

interface Portfolio {
  name: string
  tickers: TickerData[]
  cashAllocation: number
  lastUpdated?: string
}

export function InvestingDashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [portfolio, setPortfolio] = useState<Portfolio>({
    name: "My Portfolio",
    tickers: [],
    cashAllocation: 0
  })
  const [tickerInput, setTickerInput] = useState("")
  const [allocationInput, setAllocationInput] = useState("")
  const [isLoadingTicker, setIsLoadingTicker] = useState(false)
  const [savedPortfolios, setSavedPortfolios] = useState<string[]>([])
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null)
  const [portfolioName, setPortfolioName] = useState("My Portfolio")
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // Load user session on mount
  useEffect(() => {
    const session = SessionManager.getSession()
    if (session) {
      setUserEmail(session.userEmail)
    }
  }, [])

  // Calculate total allocation
  const totalAllocation = portfolio.tickers.reduce((sum, t) => sum + t.allocation, 0) + portfolio.cashAllocation

  // Calculate weighted averages
  const calculateWeightedAverage = (field: 'oneMonth' | 'threeMonth' | 'sixMonth' | 'oneYear') => {
    const total = portfolio.tickers.reduce((sum, ticker) => {
      const value = ticker.performance?.[field]
      if (value !== null && value !== undefined) {
        return sum + (value * ticker.allocation / 100)
      }
      return sum
    }, 0)
    return total
  }

  // Fetch ticker data from Alpha Vantage API
  const fetchTickerData = async (symbol: string) => {
    setIsLoadingTicker(true)
    try {
      const response = await fetch(`/api/portfolio-data?symbol=${symbol.toUpperCase()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch ticker data')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching ticker:', error)
      toast.error(`Failed to fetch data for ${symbol}`)
      return null
    } finally {
      setIsLoadingTicker(false)
    }
  }

  // Add ticker to portfolio
  const handleAddTicker = async () => {
    const symbol = tickerInput.trim().toUpperCase()
    const allocation = parseFloat(allocationInput)

    if (!symbol) {
      toast.error("Please enter a ticker symbol")
      return
    }

    if (isNaN(allocation) || allocation <= 0 || allocation > 100) {
      toast.error("Please enter a valid allocation between 0 and 100")
      return
    }

    // Check if ticker already exists
    if (portfolio.tickers.some(t => t.symbol === symbol)) {
      toast.error("This ticker is already in your portfolio")
      return
    }

    // Check if adding this would exceed 100%
    if (totalAllocation + allocation > 100) {
      toast.error(`Adding ${allocation}% would exceed 100% total allocation`)
      return
    }

    const tickerData = await fetchTickerData(symbol)
    if (tickerData) {
      const newTicker: TickerData = {
        symbol: tickerData.symbol,
        name: tickerData.name,
        type: tickerData.type,
        description: tickerData.description,
        marketCap: tickerData.marketCap,
        currentPrice: tickerData.currentPrice,
        allocation: allocation,
        rsi14: tickerData.rsi14,
        sma14: tickerData.sma14,
        performance: tickerData.performance
      }

      setPortfolio(prev => ({
        ...prev,
        tickers: [...prev.tickers, newTicker]
      }))

      setTickerInput("")
      setAllocationInput("")
      toast.success(`Added ${symbol} to portfolio`)
    }
  }

  // Remove ticker from portfolio
  const handleRemoveTicker = (symbol: string) => {
    setPortfolio(prev => ({
      ...prev,
      tickers: prev.tickers.filter(t => t.symbol !== symbol)
    }))
    toast.success(`Removed ${symbol} from portfolio`)
  }

  // Update cash allocation
  const handleCashAllocationChange = (value: string) => {
    const cash = parseFloat(value)
    if (!isNaN(cash) && cash >= 0 && cash <= 100) {
      const tickerTotal = portfolio.tickers.reduce((sum, t) => sum + t.allocation, 0)
      if (tickerTotal + cash <= 100) {
        setPortfolio(prev => ({ ...prev, cashAllocation: cash }))
      } else {
        toast.error("Total allocation cannot exceed 100%")
      }
    }
  }

  // Refresh all ticker data
  const handleRefreshData = async () => {
    toast.info("Refreshing portfolio data...")
    const updatedTickers = await Promise.all(
      portfolio.tickers.map(async (ticker) => {
        const data = await fetchTickerData(ticker.symbol)
        if (data) {
          return {
            ...ticker,
            name: data.name,
            type: data.type,
            description: data.description,
            marketCap: data.marketCap,
            currentPrice: data.currentPrice,
            rsi14: data.rsi14,
            sma14: data.sma14,
            performance: data.performance
          }
        }
        return ticker
      })
    )
    setPortfolio(prev => ({ ...prev, tickers: updatedTickers }))
    toast.success("Portfolio data refreshed")
  }

  // Save portfolio to localStorage
  const handleSavePortfolio = () => {
    if (!portfolioName.trim()) {
      toast.error("Please enter a portfolio name")
      return
    }

    try {
      // Get existing portfolios from localStorage
      const existingData = localStorage.getItem('investingPortfolios')
      const portfolios: Record<string, Portfolio> = existingData ? JSON.parse(existingData) : {}

      // Save/update this portfolio
      portfolios[portfolioName] = {
        ...portfolio,
        name: portfolioName,
        lastUpdated: new Date().toISOString()
      }

      localStorage.setItem('investingPortfolios', JSON.stringify(portfolios))
      toast.success(`Portfolio "${portfolioName}" saved successfully`)
      loadSavedPortfolios()
    } catch (error) {
      console.error('Error saving portfolio:', error)
      toast.error("Failed to save portfolio")
    }
  }

  // Load saved portfolios list from localStorage
  const loadSavedPortfolios = () => {
    try {
      const existingData = localStorage.getItem('investingPortfolios')
      if (existingData) {
        const portfolios: Record<string, Portfolio> = JSON.parse(existingData)
        setSavedPortfolios(Object.keys(portfolios))
      }
    } catch (error) {
      console.error('Error loading portfolios:', error)
    }
  }

  // Load specific portfolio from localStorage
  const handleLoadPortfolio = (name: string) => {
    try {
      const existingData = localStorage.getItem('investingPortfolios')
      if (existingData) {
        const portfolios: Record<string, Portfolio> = JSON.parse(existingData)
        if (portfolios[name]) {
          setPortfolio(portfolios[name])
          setPortfolioName(portfolios[name].name)
          setSelectedPortfolio(name)
          toast.success(`Loaded portfolio "${name}"`)
        }
      }
    } catch (error) {
      console.error('Error loading portfolio:', error)
      toast.error("Failed to load portfolio")
    }
  }

  // Export to chatbot
  const handleAnalyzeInChat = () => {
    const portfolioText = generatePortfolioText()
    // Copy to clipboard and notify user
    navigator.clipboard.writeText(portfolioText)
    toast.success("Portfolio data copied! Opening chat...")
    // Open chat in new tab after short delay
    setTimeout(() => {
      window.open('/assistant', '_blank')
    }, 1000)
  }

  // Generate formatted portfolio text for chat
  const generatePortfolioText = () => {
    let text = `Portfolio Analysis Request\n\n`
    text += `Portfolio Name: ${portfolio.name}\n\n`
    text += `Holdings:\n`

    portfolio.tickers.forEach(ticker => {
      text += `- ${ticker.symbol} (${ticker.name}): ${ticker.allocation}%\n`
      if (ticker.performance) {
        text += `  Performance: 1M: ${ticker.performance.oneMonth?.toFixed(2)}%, `
        text += `3M: ${ticker.performance.threeMonth?.toFixed(2)}%, `
        text += `6M: ${ticker.performance.sixMonth?.toFixed(2)}%, `
        text += `1Y: ${ticker.performance.oneYear?.toFixed(2)}%\n`
      }
    })

    if (portfolio.cashAllocation > 0) {
      text += `- Cash: ${portfolio.cashAllocation}%\n`
    }

    text += `\nTotal Allocation: ${totalAllocation.toFixed(1)}%\n`
    text += `\nPlease perform a portfolio analysis on this allocation.`

    return text
  }

  // Export to CSV
  const handleExportCSV = () => {
    let csv = "Symbol,Name,Type,Price,Allocation %,RSI 14,SMA 14,1M Return %,3M Return %,1Y Return %\n"

    portfolio.tickers.forEach(ticker => {
      csv += `${ticker.symbol},"${ticker.name}",${ticker.type},`
      csv += `${ticker.currentPrice?.toFixed(2) || 'N/A'},`
      csv += `${ticker.allocation},`
      csv += `${ticker.rsi14?.toFixed(1) || 'N/A'},`
      csv += `${ticker.sma14?.toFixed(2) || 'N/A'},`
      csv += `${ticker.performance?.oneMonth?.toFixed(2) || 'N/A'},`
      csv += `${ticker.performance?.threeMonth?.toFixed(2) || 'N/A'},`
      csv += `${ticker.performance?.oneYear?.toFixed(2) || 'N/A'}\n`
    })

    if (portfolio.cashAllocation > 0) {
      csv += `CASH,"Cash",Cash,-,${portfolio.cashAllocation},-,-,0,0,0\n`
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${portfolio.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success("Portfolio exported to CSV")
  }

  useEffect(() => {
    loadSavedPortfolios()
  }, [userEmail])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/assistant">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Chat
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">Investment Portfolio</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">

        {/* Input Controls - Horizontal Layout */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Portfolio Name & Load */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Portfolio</label>
              <div className="flex gap-2">
                <Input
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  placeholder="My Portfolio"
                  className="flex-1"
                />
                <Button onClick={handleSavePortfolio} variant="outline" size="icon" title="Save Portfolio">
                  <Save className="w-4 h-4" />
                </Button>
              </div>
              {savedPortfolios.length > 0 && (
                <Select value={selectedPortfolio || ""} onValueChange={handleLoadPortfolio}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Load saved..." />
                  </SelectTrigger>
                  <SelectContent>
                    {savedPortfolios.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Add Position */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Position</label>
              <div className="flex gap-2">
                <Input
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                  placeholder="Ticker"
                  className="w-24"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTicker()}
                />
                <Input
                  type="number"
                  value={allocationInput}
                  onChange={(e) => setAllocationInput(e.target.value)}
                  placeholder="%"
                  className="w-20"
                  min="0"
                  max="100"
                  step="0.1"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTicker()}
                />
                <Button onClick={handleAddTicker} disabled={isLoadingTicker} size="icon" title="Add Position">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Cash Allocation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cash %</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={portfolio.cashAllocation}
                  onChange={(e) => handleCashAllocationChange(e.target.value)}
                  placeholder="0"
                  className="w-20"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Left: {(100 - totalAllocation).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button
                  onClick={handleRefreshData}
                  variant="outline"
                  size="icon"
                  disabled={portfolio.tickers.length === 0}
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleAnalyzeInChat}
                  variant="outline"
                  size="icon"
                  disabled={portfolio.tickers.length === 0}
                  title="Analyze in Chat"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="icon"
                  disabled={portfolio.tickers.length === 0}
                  title="Export to CSV"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Portfolio Display - Full Width */}
        <div className="space-y-6">

            {/* Portfolio Summary */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Portfolio Summary</h2>
                <div className={`text-sm font-medium px-3 py-1 rounded ${
                  totalAllocation === 100
                    ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                    : totalAllocation > 100
                    ? 'bg-red-500/20 text-red-700 dark:text-red-400'
                    : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                }`}>
                  {totalAllocation.toFixed(1)}% Allocated
                </div>
              </div>

              {portfolio.tickers.length === 0 && portfolio.cashAllocation === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <PieChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No positions added yet</p>
                  <p className="text-sm mt-2">Add tickers to start building your portfolio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Holdings Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-sm text-muted-foreground">
                          <th className="text-left py-2 px-2">Symbol</th>
                          <th className="text-left py-2 px-2">Name</th>
                          <th className="text-right py-2 px-2">Price</th>
                          <th className="text-right py-2 px-2">Alloc</th>
                          <th className="text-right py-2 px-2">RSI</th>
                          <th className="text-right py-2 px-2">SMA</th>
                          <th className="text-right py-2 px-2">1M</th>
                          <th className="text-right py-2 px-2">3M</th>
                          <th className="text-right py-2 px-2">1Y</th>
                          <th className="text-right py-2 px-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.tickers.map(ticker => (
                          <tr key={ticker.symbol} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2 font-mono font-semibold">{ticker.symbol}</td>
                            <td className="py-3 px-2 text-sm">{ticker.name}</td>
                            <td className="py-3 px-2 text-right text-sm">
                              {ticker.currentPrice !== null && ticker.currentPrice !== undefined
                                ? `$${ticker.currentPrice.toFixed(2)}`
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-2 text-right font-medium">{ticker.allocation.toFixed(1)}%</td>
                            <td className={`py-3 px-2 text-right text-sm ${
                              ticker.rsi14 !== null && ticker.rsi14 !== undefined
                                ? ticker.rsi14 < 30 ? 'text-green-600 dark:text-green-400'
                                : ticker.rsi14 > 70 ? 'text-red-600 dark:text-red-400'
                                : 'text-muted-foreground'
                                : 'text-muted-foreground'
                            }`}>
                              {ticker.rsi14 !== null && ticker.rsi14 !== undefined
                                ? ticker.rsi14.toFixed(1)
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-2 text-right text-sm text-muted-foreground">
                              {ticker.sma14 !== null && ticker.sma14 !== undefined
                                ? `$${ticker.sma14.toFixed(2)}`
                                : 'N/A'}
                            </td>
                            <td className={`py-3 px-2 text-right text-sm ${
                              (ticker.performance?.oneMonth || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {ticker.performance?.oneMonth !== null && ticker.performance?.oneMonth !== undefined
                                ? `${ticker.performance.oneMonth >= 0 ? '+' : ''}${ticker.performance.oneMonth.toFixed(1)}%`
                                : 'N/A'}
                            </td>
                            <td className={`py-3 px-2 text-right text-sm ${
                              (ticker.performance?.threeMonth || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {ticker.performance?.threeMonth !== null && ticker.performance?.threeMonth !== undefined
                                ? `${ticker.performance.threeMonth >= 0 ? '+' : ''}${ticker.performance.threeMonth.toFixed(1)}%`
                                : 'N/A'}
                            </td>
                            <td className={`py-3 px-2 text-right text-sm ${
                              (ticker.performance?.oneYear || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {ticker.performance?.oneYear !== null && ticker.performance?.oneYear !== undefined
                                ? `${ticker.performance.oneYear >= 0 ? '+' : ''}${ticker.performance.oneYear.toFixed(1)}%`
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTicker(ticker.symbol)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {portfolio.cashAllocation > 0 && (
                          <tr className="border-b bg-muted/30">
                            <td className="py-3 px-2 font-mono font-semibold">CASH</td>
                            <td className="py-3 px-2 text-sm">Cash Position</td>
                            <td className="py-3 px-2 text-right text-sm text-muted-foreground">-</td>
                            <td className="py-3 px-2 text-right font-medium">{portfolio.cashAllocation.toFixed(1)}%</td>
                            <td className="py-3 px-2 text-right text-sm text-muted-foreground">-</td>
                            <td className="py-3 px-2 text-right text-sm text-muted-foreground">-</td>
                            <td className="py-3 px-2 text-right text-sm text-muted-foreground">0%</td>
                            <td className="py-3 px-2 text-right text-sm text-muted-foreground">0%</td>
                            <td className="py-3 px-2 text-right text-sm text-muted-foreground">0%</td>
                            <td className="py-3 px-2"></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>

            {/* Portfolio Analytics */}
            {portfolio.tickers.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Portfolio Performance</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">1 Month</div>
                    <div className={`text-2xl font-bold ${
                      calculateWeightedAverage('oneMonth') >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {calculateWeightedAverage('oneMonth') >= 0 ? '+' : ''}
                      {calculateWeightedAverage('oneMonth').toFixed(2)}%
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">3 Month</div>
                    <div className={`text-2xl font-bold ${
                      calculateWeightedAverage('threeMonth') >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {calculateWeightedAverage('threeMonth') >= 0 ? '+' : ''}
                      {calculateWeightedAverage('threeMonth').toFixed(2)}%
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">6 Month</div>
                    <div className={`text-2xl font-bold ${
                      calculateWeightedAverage('sixMonth') >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {calculateWeightedAverage('sixMonth') >= 0 ? '+' : ''}
                      {calculateWeightedAverage('sixMonth').toFixed(2)}%
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">1 Year</div>
                    <div className={`text-2xl font-bold ${
                      calculateWeightedAverage('oneYear') >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {calculateWeightedAverage('oneYear') >= 0 ? '+' : ''}
                      {calculateWeightedAverage('oneYear').toFixed(2)}%
                    </div>
                  </div>
                </div>
              </Card>
            )}

        </div>
      </div>
    </div>
  )
}
