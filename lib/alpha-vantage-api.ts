// Alpha Vantage API utility functions
const BASE_URL = 'https://www.alphavantage.co/query'

// Get API key at request time (not module load time) for reliability
function getApiKey(): string {
  const key = process.env.ALPHA_VANTAGE_API_KEY
  if (!key) {
    console.error('[Alpha Vantage] WARNING: No API key found in ALPHA_VANTAGE_API_KEY')
    return ''
  }
  return key
}

// ============================================
// RETRY HELPER FOR RATE LIMITING
// ============================================

async function fetchWithRetry(url: string, maxRetries: number = 3): Promise<any> {
  let lastError: Error | null = null

  // Check API key before making request
  if (!getApiKey()) {
    console.error('[Alpha Vantage] Cannot make request - no API key')
    return {}
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url)
      const data = await response.json()

      // Check for rate limit message (Note field indicates rate limiting)
      if (data['Note'] && data['Note'].includes('call frequency')) {
        console.log(`[Alpha Vantage] Rate limited, attempt ${attempt + 1}/${maxRetries}, waiting...`)
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        continue
      }

      // Check for invalid API key
      if (data['Information'] && data['Information'].includes('API key')) {
        console.error('[Alpha Vantage] Invalid API key response:', data['Information'])
        return data
      }

      // If response is empty object, retry
      if (Object.keys(data).length === 0) {
        console.log(`[Alpha Vantage] Empty response, attempt ${attempt + 1}/${maxRetries}, retrying...`)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        continue
      }

      return data
    } catch (error) {
      lastError = error as Error
      console.error(`[Alpha Vantage] Fetch error, attempt ${attempt + 1}/${maxRetries}:`, error)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

// ============================================
// STOCK QUOTES & PRICE DATA
// ============================================

export interface GlobalQuote {
  symbol: string
  open: number
  high: number
  low: number
  price: number
  volume: number
  latestTradingDay: string
  previousClose: number
  change: number
  changePercent: string
}

export async function getQuote(symbol: string): Promise<GlobalQuote | null> {
  try {
    const data = await fetchWithRetry(
      `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${getApiKey()}`
    )

    if (data['Error Message']) {
      console.error('[Alpha Vantage] API Error:', data['Error Message'])
      return null
    }

    const quote = data['Global Quote']
    if (!quote || Object.keys(quote).length === 0) return null

    return {
      symbol: quote['01. symbol'],
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      price: parseFloat(quote['05. price']),
      volume: parseInt(quote['06. volume']),
      latestTradingDay: quote['07. latest trading day'],
      previousClose: parseFloat(quote['08. previous close']),
      change: parseFloat(quote['09. change']),
      changePercent: quote['10. change percent']
    }
  } catch (error) {
    console.error('[Alpha Vantage] Error fetching quote:', error)
    return null
  }
}

export interface DailyPrice {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function getDailyHistory(symbol: string, outputSize: 'compact' | 'full' = 'compact'): Promise<DailyPrice[] | null> {
  try {
    const data = await fetchWithRetry(
      `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${getApiKey()}`
    )

    if (data['Error Message']) {
      console.error('[Alpha Vantage] API Error:', data['Error Message'])
      return null
    }

    const timeSeries = data['Time Series (Daily)']
    if (!timeSeries) return null

    return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('[Alpha Vantage] Error fetching daily history:', error)
    return null
  }
}

// ============================================
// TECHNICAL INDICATORS
// ============================================

export interface TechnicalIndicatorValue {
  date: string
  value: number
}

export async function getRSI(symbol: string, timePeriod: number = 14, interval: string = 'daily'): Promise<TechnicalIndicatorValue[] | null> {
  try {
    const response = await fetch(
      `${BASE_URL}?function=RSI&symbol=${symbol}&interval=${interval}&time_period=${timePeriod}&series_type=close&apikey=${getApiKey()}`
    )
    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      console.error('[Alpha Vantage] API Error:', data['Error Message'] || data['Note'])
      return null
    }

    const technicalData = data['Technical Analysis: RSI']
    if (!technicalData) return null

    return Object.entries(technicalData).map(([date, values]: [string, any]) => ({
      date,
      value: parseFloat(values['RSI'])
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('[Alpha Vantage] Error fetching RSI:', error)
    return null
  }
}

export async function getMACD(symbol: string, interval: string = 'daily'): Promise<{ date: string; macd: number; signal: number; histogram: number }[] | null> {
  try {
    const response = await fetch(
      `${BASE_URL}?function=MACD&symbol=${symbol}&interval=${interval}&series_type=close&apikey=${getApiKey()}`
    )
    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      console.error('[Alpha Vantage] API Error:', data['Error Message'] || data['Note'])
      return null
    }

    const technicalData = data['Technical Analysis: MACD']
    if (!technicalData) return null

    return Object.entries(technicalData).map(([date, values]: [string, any]) => ({
      date,
      macd: parseFloat(values['MACD']),
      signal: parseFloat(values['MACD_Signal']),
      histogram: parseFloat(values['MACD_Hist'])
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('[Alpha Vantage] Error fetching MACD:', error)
    return null
  }
}

export async function getSMA(symbol: string, timePeriod: number = 50, interval: string = 'daily'): Promise<TechnicalIndicatorValue[] | null> {
  try {
    const response = await fetch(
      `${BASE_URL}?function=SMA&symbol=${symbol}&interval=${interval}&time_period=${timePeriod}&series_type=close&apikey=${getApiKey()}`
    )
    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      console.error('[Alpha Vantage] API Error:', data['Error Message'] || data['Note'])
      return null
    }

    const technicalData = data['Technical Analysis: SMA']
    if (!technicalData) return null

    return Object.entries(technicalData).map(([date, values]: [string, any]) => ({
      date,
      value: parseFloat(values['SMA'])
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('[Alpha Vantage] Error fetching SMA:', error)
    return null
  }
}

export async function getEMA(symbol: string, timePeriod: number = 50, interval: string = 'daily'): Promise<TechnicalIndicatorValue[] | null> {
  try {
    const response = await fetch(
      `${BASE_URL}?function=EMA&symbol=${symbol}&interval=${interval}&time_period=${timePeriod}&series_type=close&apikey=${getApiKey()}`
    )
    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      console.error('[Alpha Vantage] API Error:', data['Error Message'] || data['Note'])
      return null
    }

    const technicalData = data['Technical Analysis: EMA']
    if (!technicalData) return null

    return Object.entries(technicalData).map(([date, values]: [string, any]) => ({
      date,
      value: parseFloat(values['EMA'])
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('[Alpha Vantage] Error fetching EMA:', error)
    return null
  }
}

export async function getBollingerBands(symbol: string, timePeriod: number = 20, interval: string = 'daily'): Promise<{ date: string; upper: number; middle: number; lower: number }[] | null> {
  try {
    const response = await fetch(
      `${BASE_URL}?function=BBANDS&symbol=${symbol}&interval=${interval}&time_period=${timePeriod}&series_type=close&apikey=${getApiKey()}`
    )
    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      console.error('[Alpha Vantage] API Error:', data['Error Message'] || data['Note'])
      return null
    }

    const technicalData = data['Technical Analysis: BBANDS']
    if (!technicalData) return null

    return Object.entries(technicalData).map(([date, values]: [string, any]) => ({
      date,
      upper: parseFloat(values['Real Upper Band']),
      middle: parseFloat(values['Real Middle Band']),
      lower: parseFloat(values['Real Lower Band'])
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('[Alpha Vantage] Error fetching Bollinger Bands:', error)
    return null
  }
}

// ============================================
// FUNDAMENTAL DATA
// ============================================

export interface CompanyOverview {
  symbol: string
  name: string
  description: string
  exchange: string
  currency: string
  country: string
  sector: string
  industry: string
  marketCap: number
  peRatio: number
  pegRatio: number
  bookValue: number
  dividendPerShare: number
  dividendYield: number
  eps: number
  revenuePerShareTTM: number
  profitMargin: number
  operatingMarginTTM: number
  returnOnAssetsTTM: number
  returnOnEquityTTM: number
  revenueTTM: number
  grossProfitTTM: number
  quarterlyEarningsGrowthYOY: number
  quarterlyRevenueGrowthYOY: number
  analystTargetPrice: number
  trailingPE: number
  forwardPE: number
  priceToSalesRatioTTM: number
  priceToBookRatio: number
  evToRevenue: number
  evToEBITDA: number
  beta: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  fiftyDayMovingAverage: number
  twoHundredDayMovingAverage: number
  sharesOutstanding: number
}

export async function getCompanyOverview(symbol: string): Promise<CompanyOverview | null> {
  try {
    const data = await fetchWithRetry(
      `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${getApiKey()}`
    )

    // Debug: log what we actually received
    if (!data['Symbol']) {
      console.log('[Alpha Vantage] Overview response for', symbol, ':', JSON.stringify(data).substring(0, 200))
    }

    if (data['Error Message'] || !data['Symbol']) {
      console.error('[Alpha Vantage] API Error:', data['Error Message'] || 'No data found')
      return null
    }

    return {
      symbol: data['Symbol'],
      name: data['Name'],
      description: data['Description'],
      exchange: data['Exchange'],
      currency: data['Currency'],
      country: data['Country'],
      sector: data['Sector'],
      industry: data['Industry'],
      marketCap: parseFloat(data['MarketCapitalization']) || 0,
      peRatio: parseFloat(data['PERatio']) || 0,
      pegRatio: parseFloat(data['PEGRatio']) || 0,
      bookValue: parseFloat(data['BookValue']) || 0,
      dividendPerShare: parseFloat(data['DividendPerShare']) || 0,
      dividendYield: parseFloat(data['DividendYield']) || 0,
      eps: parseFloat(data['EPS']) || 0,
      revenuePerShareTTM: parseFloat(data['RevenuePerShareTTM']) || 0,
      profitMargin: parseFloat(data['ProfitMargin']) || 0,
      operatingMarginTTM: parseFloat(data['OperatingMarginTTM']) || 0,
      returnOnAssetsTTM: parseFloat(data['ReturnOnAssetsTTM']) || 0,
      returnOnEquityTTM: parseFloat(data['ReturnOnEquityTTM']) || 0,
      revenueTTM: parseFloat(data['RevenueTTM']) || 0,
      grossProfitTTM: parseFloat(data['GrossProfitTTM']) || 0,
      quarterlyEarningsGrowthYOY: parseFloat(data['QuarterlyEarningsGrowthYOY']) || 0,
      quarterlyRevenueGrowthYOY: parseFloat(data['QuarterlyRevenueGrowthYOY']) || 0,
      analystTargetPrice: parseFloat(data['AnalystTargetPrice']) || 0,
      trailingPE: parseFloat(data['TrailingPE']) || 0,
      forwardPE: parseFloat(data['ForwardPE']) || 0,
      priceToSalesRatioTTM: parseFloat(data['PriceToSalesRatioTTM']) || 0,
      priceToBookRatio: parseFloat(data['PriceToBookRatio']) || 0,
      evToRevenue: parseFloat(data['EVToRevenue']) || 0,
      evToEBITDA: parseFloat(data['EVToEBITDA']) || 0,
      beta: parseFloat(data['Beta']) || 0,
      fiftyTwoWeekHigh: parseFloat(data['52WeekHigh']) || 0,
      fiftyTwoWeekLow: parseFloat(data['52WeekLow']) || 0,
      fiftyDayMovingAverage: parseFloat(data['50DayMovingAverage']) || 0,
      twoHundredDayMovingAverage: parseFloat(data['200DayMovingAverage']) || 0,
      sharesOutstanding: parseFloat(data['SharesOutstanding']) || 0
    }
  } catch (error) {
    console.error('[Alpha Vantage] Error fetching company overview:', error)
    return null
  }
}

export interface FinancialStatement {
  fiscalDateEnding: string
  reportedCurrency: string
  [key: string]: string | number
}

export async function getIncomeStatement(symbol: string): Promise<{ annual: FinancialStatement[]; quarterly: FinancialStatement[] } | null> {
  try {
    const response = await fetch(
      `${BASE_URL}?function=INCOME_STATEMENT&symbol=${symbol}&apikey=${getApiKey()}`
    )
    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      console.error('[Alpha Vantage] API Error:', data['Error Message'] || data['Note'])
      return null
    }

    return {
      annual: data['annualReports'] || [],
      quarterly: data['quarterlyReports'] || []
    }
  } catch (error) {
    console.error('[Alpha Vantage] Error fetching income statement:', error)
    return null
  }
}

export async function getBalanceSheet(symbol: string): Promise<{ annual: FinancialStatement[]; quarterly: FinancialStatement[] } | null> {
  try {
    const response = await fetch(
      `${BASE_URL}?function=BALANCE_SHEET&symbol=${symbol}&apikey=${getApiKey()}`
    )
    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      console.error('[Alpha Vantage] API Error:', data['Error Message'] || data['Note'])
      return null
    }

    return {
      annual: data['annualReports'] || [],
      quarterly: data['quarterlyReports'] || []
    }
  } catch (error) {
    console.error('[Alpha Vantage] Error fetching balance sheet:', error)
    return null
  }
}

export async function getCashFlow(symbol: string): Promise<{ annual: FinancialStatement[]; quarterly: FinancialStatement[] } | null> {
  try {
    const response = await fetch(
      `${BASE_URL}?function=CASH_FLOW&symbol=${symbol}&apikey=${getApiKey()}`
    )
    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      console.error('[Alpha Vantage] API Error:', data['Error Message'] || data['Note'])
      return null
    }

    return {
      annual: data['annualReports'] || [],
      quarterly: data['quarterlyReports'] || []
    }
  } catch (error) {
    console.error('[Alpha Vantage] Error fetching cash flow:', error)
    return null
  }
}

// ============================================
// HELPER FUNCTIONS FOR ANALYSIS
// ============================================

/**
 * Find dates where RSI was below a threshold and calculate forward returns
 */
export async function findRSIOversoldWithReturns(
  symbol: string,
  threshold: number = 30,
  forwardDays: number = 10,
  limit: number = 10
): Promise<{ date: string; rsi: number; forwardReturn: number }[] | null> {
  try {
    const [rsiData, priceData] = await Promise.all([
      getRSI(symbol, 14, 'daily'),
      getDailyHistory(symbol, 'full')
    ])

    if (!rsiData || !priceData) return null

    // Create a price lookup map
    const priceMap = new Map(priceData.map(p => [p.date, p.close]))

    // Find oversold dates and calculate forward returns
    const results: { date: string; rsi: number; forwardReturn: number }[] = []

    for (const rsiPoint of rsiData) {
      if (rsiPoint.value < threshold) {
        const entryPrice = priceMap.get(rsiPoint.date)
        if (!entryPrice) continue

        // Find price N days later
        const entryIndex = priceData.findIndex(p => p.date === rsiPoint.date)
        if (entryIndex === -1 || entryIndex - forwardDays < 0) continue

        const exitPrice = priceData[entryIndex - forwardDays]?.close
        if (!exitPrice) continue

        const forwardReturn = ((exitPrice - entryPrice) / entryPrice) * 100

        results.push({
          date: rsiPoint.date,
          rsi: rsiPoint.value,
          forwardReturn: Math.round(forwardReturn * 100) / 100
        })

        if (results.length >= limit) break
      }
    }

    return results
  } catch (error) {
    console.error('[Alpha Vantage] Error in RSI analysis:', error)
    return null
  }
}

/**
 * Calculate performance for multiple time periods (matching Polygon API interface)
 * Uses a single API call for efficiency
 */
export async function calculateMultiPeriodPerformance(symbol: string): Promise<{
  oneMonth: number | null
  threeMonth: number | null
  sixMonth: number | null
  oneYear: number | null
} | null> {
  try {
    const priceData = await getDailyHistory(symbol, 'full')
    if (!priceData || priceData.length === 0) return null

    const currentPrice = priceData[0].close
    const today = new Date(priceData[0].date)

    const findClosestPrice = (targetDaysAgo: number): number | null => {
      const targetDate = new Date(today)
      targetDate.setDate(targetDate.getDate() - targetDaysAgo)

      // Find the closest price to the target date
      let closest = priceData[0]
      let closestDiff = Math.abs(new Date(priceData[0].date).getTime() - targetDate.getTime())

      for (const p of priceData) {
        const diff = Math.abs(new Date(p.date).getTime() - targetDate.getTime())
        if (diff < closestDiff) {
          closest = p
          closestDiff = diff
        }
      }

      return closest.close
    }

    const calculateReturn = (daysAgo: number): number | null => {
      const oldPrice = findClosestPrice(daysAgo)
      if (!oldPrice) return null
      return ((currentPrice - oldPrice) / oldPrice) * 100
    }

    return {
      oneMonth: calculateReturn(30),
      threeMonth: calculateReturn(90),
      sixMonth: calculateReturn(180),
      oneYear: calculateReturn(365)
    }
  } catch (error) {
    console.error('[Alpha Vantage] Error calculating multi-period performance:', error)
    return null
  }
}

/**
 * Calculate performance over a specified number of days
 */
export async function calculatePerformance(symbol: string, days: number = 30): Promise<{
  symbol: string
  startDate: string
  endDate: string
  startPrice: number
  endPrice: number
  change: number
  changePercent: number
} | null> {
  try {
    const priceData = await getDailyHistory(symbol, 'compact')
    if (!priceData || priceData.length < days) return null

    const endPrice = priceData[0].close
    const startPrice = priceData[Math.min(days - 1, priceData.length - 1)].close
    const change = endPrice - startPrice
    const changePercent = (change / startPrice) * 100

    return {
      symbol,
      startDate: priceData[Math.min(days - 1, priceData.length - 1)].date,
      endDate: priceData[0].date,
      startPrice: Math.round(startPrice * 100) / 100,
      endPrice: Math.round(endPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100
    }
  } catch (error) {
    console.error('[Alpha Vantage] Error calculating performance:', error)
    return null
  }
}
