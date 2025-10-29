// Polygon.io API utility functions
const POLYGON_API_KEY = process.env.POLYGON_API_KEY
const BASE_URL = 'https://api.polygon.io'

export interface TickerDetails {
  ticker: string
  name: string
  market: string
  locale: string
  primary_exchange: string
  type: string
  active: boolean
  currency_name: string
  description?: string
  market_cap?: number
  phone_number?: string
  address?: {
    city: string
    state: string
  }
}

export interface StockQuote {
  ticker: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: number
}

export interface AggregateBar {
  c: number // Close price
  h: number // High price
  l: number // Low price
  o: number // Open price
  v: number // Volume
  t: number // Timestamp
}

/**
 * Get ticker details (company/ETF information)
 */
export async function getTickerDetails(symbol: string): Promise<TickerDetails | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/v3/reference/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`
    )

    if (!response.ok) {
      console.error(`[Polygon] Failed to fetch ticker details for ${symbol}: ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data.results || null
  } catch (error) {
    console.error(`[Polygon] Error fetching ticker details for ${symbol}:`, error)
    return null
  }
}

/**
 * Get last trade/quote for a ticker
 */
export async function getLastQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/v2/last/trade/${symbol}?apiKey=${POLYGON_API_KEY}`
    )

    if (!response.ok) {
      console.error(`[Polygon] Failed to fetch quote for ${symbol}: ${response.statusText}`)
      return null
    }

    const data = await response.json()
    const result = data.results

    if (!result) return null

    return {
      ticker: symbol,
      price: result.p,
      change: 0, // Calculate from previous close if needed
      changePercent: 0,
      volume: result.s,
      timestamp: result.t
    }
  } catch (error) {
    console.error(`[Polygon] Error fetching quote for ${symbol}:`, error)
    return null
  }
}

/**
 * Get aggregate bars (OHLC) for historical data
 * @param symbol Stock/ETF ticker
 * @param multiplier Size of timespan multiplier
 * @param timespan Size of time window (day, week, month, year)
 * @param from Start date (YYYY-MM-DD)
 * @param to End date (YYYY-MM-DD)
 */
export async function getAggregateBars(
  symbol: string,
  multiplier: number = 1,
  timespan: 'day' | 'week' | 'month' | 'year' = 'day',
  from: string,
  to: string
): Promise<AggregateBar[] | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&apiKey=${POLYGON_API_KEY}`
    )

    if (!response.ok) {
      console.error(`[Polygon] Failed to fetch aggregate bars for ${symbol}: ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data.results || null
  } catch (error) {
    console.error(`[Polygon] Error fetching aggregate bars for ${symbol}:`, error)
    return null
  }
}

/**
 * Calculate performance returns for different time periods
 */
export async function calculatePerformance(symbol: string): Promise<{
  oneMonth: number | null
  threeMonth: number | null
  sixMonth: number | null
  oneYear: number | null
} | null> {
  try {
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(today.getFullYear() - 1)

    const toDate = today.toISOString().split('T')[0]
    const fromDate = oneYearAgo.toISOString().split('T')[0]

    const bars = await getAggregateBars(symbol, 1, 'day', fromDate, toDate)

    if (!bars || bars.length === 0) return null

    const currentPrice = bars[bars.length - 1].c

    // Calculate returns
    const oneMonthAgo = new Date(today)
    oneMonthAgo.setMonth(today.getMonth() - 1)

    const threeMonthAgo = new Date(today)
    threeMonthAgo.setMonth(today.getMonth() - 3)

    const sixMonthAgo = new Date(today)
    sixMonthAgo.setMonth(today.getMonth() - 6)

    const findClosestBar = (targetDate: Date) => {
      return bars.reduce((prev, curr) => {
        const currDate = new Date(curr.t)
        const prevDate = new Date(prev.t)
        return Math.abs(currDate.getTime() - targetDate.getTime()) < Math.abs(prevDate.getTime() - targetDate.getTime())
          ? curr
          : prev
      })
    }

    const oneMonthBar = findClosestBar(oneMonthAgo)
    const threeMonthBar = findClosestBar(threeMonthAgo)
    const sixMonthBar = findClosestBar(sixMonthAgo)
    const oneYearBar = bars[0]

    return {
      oneMonth: ((currentPrice - oneMonthBar.c) / oneMonthBar.c) * 100,
      threeMonth: ((currentPrice - threeMonthBar.c) / threeMonthBar.c) * 100,
      sixMonth: ((currentPrice - sixMonthBar.c) / sixMonthBar.c) * 100,
      oneYear: ((currentPrice - oneYearBar.c) / oneYearBar.c) * 100
    }
  } catch (error) {
    console.error(`[Polygon] Error calculating performance for ${symbol}:`, error)
    return null
  }
}
