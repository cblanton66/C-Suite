import { NextRequest, NextResponse } from 'next/server'
import {
  getQuote,
  getDailyHistory,
  getCompanyOverview,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlow,
  getRSI,
  getMACD,
  getSMA,
  getEMA,
  getBollingerBands,
  findRSIOversoldWithReturns,
  calculatePerformance
} from '@/lib/alpha-vantage-api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Detect what type of analysis the user is asking for
function detectAnalysisType(query: string): string[] {
  const types: string[] = []
  const lowerQuery = query.toLowerCase()

  // Price/Quote related
  if (lowerQuery.includes('price') || lowerQuery.includes('quote') || lowerQuery.includes('trading')) {
    types.push('quote')
  }

  // Performance/Returns
  if (lowerQuery.includes('perform') || lowerQuery.includes('return') || lowerQuery.includes('gain') || lowerQuery.includes('lost') || lowerQuery.includes('change')) {
    types.push('performance')
  }

  // Technical Indicators
  if (lowerQuery.includes('rsi') || lowerQuery.includes('relative strength')) {
    types.push('rsi')
  }
  if (lowerQuery.includes('macd') || lowerQuery.includes('moving average convergence')) {
    types.push('macd')
  }
  if (lowerQuery.includes('sma') || lowerQuery.includes('simple moving average')) {
    types.push('sma')
  }
  if (lowerQuery.includes('ema') || lowerQuery.includes('exponential moving average')) {
    types.push('ema')
  }
  if (lowerQuery.includes('bollinger') || lowerQuery.includes('bands')) {
    types.push('bollinger')
  }
  if (lowerQuery.includes('technical') || lowerQuery.includes('indicator')) {
    types.push('rsi', 'macd')
  }
  if (lowerQuery.includes('overbought') || lowerQuery.includes('oversold')) {
    types.push('rsi')
  }

  // Fundamental Data
  if (lowerQuery.includes('overview') || lowerQuery.includes('company') || lowerQuery.includes('about')) {
    types.push('overview')
  }
  if (lowerQuery.includes('balance sheet') || lowerQuery.includes('assets') || lowerQuery.includes('liabilities')) {
    types.push('balanceSheet')
  }
  if (lowerQuery.includes('income') || lowerQuery.includes('revenue') || lowerQuery.includes('earnings') || lowerQuery.includes('profit')) {
    types.push('incomeStatement')
  }
  if (lowerQuery.includes('cash flow') || lowerQuery.includes('cashflow')) {
    types.push('cashFlow')
  }
  if (lowerQuery.includes('fundamental') || lowerQuery.includes('financials')) {
    types.push('overview', 'incomeStatement', 'balanceSheet')
  }

  // Historical
  if (lowerQuery.includes('history') || lowerQuery.includes('historical') || lowerQuery.includes('past')) {
    types.push('history')
  }

  // Default to quote and overview if nothing specific detected
  if (types.length === 0) {
    types.push('quote', 'overview')
  }

  return [...new Set(types)] // Remove duplicates
}

// Extract ticker symbols from query
function extractTickers(query: string): string[] {
  // Common patterns: $AAPL, AAPL, "AAPL", ticker AAPL
  const patterns = [
    /\$([A-Z]{1,5})/g,                    // $AAPL
    /\b([A-Z]{1,5})\b(?='s|')/g,          // AAPL's
    /\b([A-Z]{2,5})\b/g,                  // AAPL (2-5 uppercase letters)
  ]

  const tickers: string[] = []

  for (const pattern of patterns) {
    const matches = query.match(pattern)
    if (matches) {
      for (const match of matches) {
        const ticker = match.replace('$', '').replace("'s", '').replace("'", '')
        // Filter out common words that look like tickers
        const excludeWords = ['RSI', 'MACD', 'SMA', 'EMA', 'ETF', 'IPO', 'CEO', 'CFO', 'PE', 'EPS', 'ROI', 'ROE', 'ROA', 'YOY', 'QOQ', 'TTM', 'THE', 'AND', 'FOR', 'HOW', 'HAS', 'WAS', 'ARE', 'CAN', 'YOU']
        if (ticker.length >= 1 && !excludeWords.includes(ticker)) {
          tickers.push(ticker)
        }
      }
    }
  }

  return [...new Set(tickers)]
}

// Extract number of days from query
function extractDays(query: string): number {
  const patterns = [
    /(\d+)\s*days?/i,
    /last\s*(\d+)/i,
    /past\s*(\d+)/i,
  ]

  for (const pattern of patterns) {
    const match = query.match(pattern)
    if (match) {
      return parseInt(match[1])
    }
  }

  return 30 // Default to 30 days
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    if (!process.env.ALPHA_VANTAGE_API_KEY) {
      return NextResponse.json({ error: 'Alpha Vantage API key not configured' }, { status: 500 })
    }

    console.log('[Stock Analysis] Processing query:', query)

    const tickers = extractTickers(query)
    const analysisTypes = detectAnalysisType(query)
    const days = extractDays(query)

    console.log('[Stock Analysis] Detected tickers:', tickers)
    console.log('[Stock Analysis] Analysis types:', analysisTypes)
    console.log('[Stock Analysis] Days:', days)

    if (tickers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No stock ticker detected in query. Please include a ticker symbol like AAPL, MSFT, or XLK.',
        query
      })
    }

    const results: Record<string, any> = {}

    // Fetch data for each ticker
    for (const ticker of tickers.slice(0, 3)) { // Limit to 3 tickers to avoid rate limits
      results[ticker] = {}

      // Fetch requested data types in parallel where possible
      const fetchPromises: Promise<void>[] = []

      if (analysisTypes.includes('quote')) {
        fetchPromises.push(
          getQuote(ticker).then(data => { results[ticker].quote = data })
        )
      }

      if (analysisTypes.includes('performance')) {
        fetchPromises.push(
          calculatePerformance(ticker, days).then(data => { results[ticker].performance = data })
        )
      }

      if (analysisTypes.includes('overview')) {
        fetchPromises.push(
          getCompanyOverview(ticker).then(data => { results[ticker].overview = data })
        )
      }

      if (analysisTypes.includes('history')) {
        fetchPromises.push(
          getDailyHistory(ticker, 'compact').then(data => {
            results[ticker].history = data?.slice(0, Math.min(days, 100))
          })
        )
      }

      if (analysisTypes.includes('rsi')) {
        fetchPromises.push(
          getRSI(ticker).then(data => {
            results[ticker].rsi = data?.slice(0, 30) // Last 30 readings
          })
        )
        // Also check for oversold conditions if query mentions it
        if (query.toLowerCase().includes('oversold') || query.toLowerCase().includes('below')) {
          fetchPromises.push(
            findRSIOversoldWithReturns(ticker, 30, days, 10).then(data => {
              results[ticker].rsiOversoldAnalysis = data
            })
          )
        }
      }

      if (analysisTypes.includes('macd')) {
        fetchPromises.push(
          getMACD(ticker).then(data => {
            results[ticker].macd = data?.slice(0, 30)
          })
        )
      }

      if (analysisTypes.includes('sma')) {
        fetchPromises.push(
          getSMA(ticker, 50).then(data => {
            results[ticker].sma50 = data?.slice(0, 30)
          })
        )
      }

      if (analysisTypes.includes('ema')) {
        fetchPromises.push(
          getEMA(ticker, 50).then(data => {
            results[ticker].ema50 = data?.slice(0, 30)
          })
        )
      }

      if (analysisTypes.includes('bollinger')) {
        fetchPromises.push(
          getBollingerBands(ticker).then(data => {
            results[ticker].bollingerBands = data?.slice(0, 30)
          })
        )
      }

      if (analysisTypes.includes('incomeStatement')) {
        fetchPromises.push(
          getIncomeStatement(ticker).then(data => {
            results[ticker].incomeStatement = {
              annual: data?.annual?.slice(0, 3),
              quarterly: data?.quarterly?.slice(0, 4)
            }
          })
        )
      }

      if (analysisTypes.includes('balanceSheet')) {
        fetchPromises.push(
          getBalanceSheet(ticker).then(data => {
            results[ticker].balanceSheet = {
              annual: data?.annual?.slice(0, 3),
              quarterly: data?.quarterly?.slice(0, 4)
            }
          })
        )
      }

      if (analysisTypes.includes('cashFlow')) {
        fetchPromises.push(
          getCashFlow(ticker).then(data => {
            results[ticker].cashFlow = {
              annual: data?.annual?.slice(0, 3),
              quarterly: data?.quarterly?.slice(0, 4)
            }
          })
        )
      }

      await Promise.all(fetchPromises)
    }

    return NextResponse.json({
      success: true,
      query,
      tickers,
      analysisTypes,
      days,
      data: results
    })

  } catch (error) {
    console.error('[Stock Analysis] Error:', error)
    return NextResponse.json({
      error: 'Failed to analyze stock data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
