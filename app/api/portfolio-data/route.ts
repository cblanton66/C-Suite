import { type NextRequest, NextResponse } from "next/server"
import { getCompanyOverview, getQuote, calculateMultiPeriodPerformance, getRSI, getSMA } from "@/lib/alpha-vantage-api"

// Common ETF name mappings for better display
const ETF_NAMES: Record<string, string> = {
  'SPY': 'SPDR S&P 500 ETF Trust',
  'SPYG': 'SPDR Portfolio S&P 500 Growth ETF',
  'SPYV': 'SPDR Portfolio S&P 500 Value ETF',
  'QQQ': 'Invesco QQQ Trust',
  'VTI': 'Vanguard Total Stock Market ETF',
  'VOO': 'Vanguard S&P 500 ETF',
  'VGT': 'Vanguard Information Technology ETF',
  'XLK': 'Technology Select Sector SPDR Fund',
  'XLF': 'Financial Select Sector SPDR Fund',
  'XLE': 'Energy Select Sector SPDR Fund',
  'XLV': 'Health Care Select Sector SPDR Fund',
  'XLI': 'Industrial Select Sector SPDR Fund',
  'XLP': 'Consumer Staples Select Sector SPDR Fund',
  'XLY': 'Consumer Discretionary Select Sector SPDR Fund',
  'XLU': 'Utilities Select Sector SPDR Fund',
  'XLB': 'Materials Select Sector SPDR Fund',
  'XLRE': 'Real Estate Select Sector SPDR Fund',
  'XLC': 'Communication Services Select Sector SPDR Fund',
  'XAR': 'SPDR S&P Aerospace & Defense ETF',
  'IWM': 'iShares Russell 2000 ETF',
  'IVV': 'iShares Core S&P 500 ETF',
  'AGG': 'iShares Core U.S. Aggregate Bond ETF',
  'BND': 'Vanguard Total Bond Market ETF',
  'GLD': 'SPDR Gold Shares',
  'SLV': 'iShares Silver Trust',
  'EEM': 'iShares MSCI Emerging Markets ETF',
  'VWO': 'Vanguard FTSE Emerging Markets ETF',
  'ARKK': 'ARK Innovation ETF',
  'DIA': 'SPDR Dow Jones Industrial Average ETF',
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get('symbol')?.toUpperCase()

    if (!symbol) {
      return NextResponse.json({ error: "Symbol parameter is required" }, { status: 400 })
    }

    console.log(`[Portfolio Data] Fetching data for ${symbol} via Alpha Vantage`)

    // Fetch all data in parallel for efficiency
    const [overview, performance, rsiData, smaData, quote] = await Promise.all([
      getCompanyOverview(symbol),
      calculateMultiPeriodPerformance(symbol),
      getRSI(symbol, 14, 'daily'),  // 14-day RSI
      getSMA(symbol, 14, 'daily'),  // 14-day SMA
      getQuote(symbol)              // Current price
    ])

    // Get latest RSI and SMA values
    const currentRSI = rsiData && rsiData.length > 0 ? rsiData[0].value : null
    const currentSMA = smaData && smaData.length > 0 ? smaData[0].value : null
    const currentPrice = quote?.price || null

    // If overview works (stock), return stock data
    if (overview) {
      return NextResponse.json({
        symbol: overview.symbol,
        name: overview.name,
        type: 'Stock',
        description: overview.description,
        marketCap: overview.marketCap,
        sector: overview.sector,
        industry: overview.industry,
        peRatio: overview.peRatio,
        dividendYield: overview.dividendYield,
        fiftyTwoWeekHigh: overview.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: overview.fiftyTwoWeekLow,
        currentPrice: currentPrice,
        rsi14: currentRSI,
        sma14: currentSMA,
        performance: performance || {
          oneMonth: null,
          threeMonth: null,
          sixMonth: null,
          oneYear: null
        }
      })
    }

    // If overview failed, this is likely an ETF - use quote data instead
    console.log(`[Portfolio Data] Overview failed for ${symbol}, trying as ETF...`)

    if (!quote && !performance) {
      return NextResponse.json({ error: `No data found for symbol ${symbol}` }, { status: 404 })
    }

    // Return ETF data with available information
    return NextResponse.json({
      symbol: symbol,
      name: ETF_NAMES[symbol] || `${symbol} ETF`,
      type: 'ETF',
      description: ETF_NAMES[symbol] ? `Exchange-traded fund tracking ${ETF_NAMES[symbol].replace(' ETF', '').replace(' Trust', '')}` : 'Exchange-traded fund',
      marketCap: null,
      sector: null,
      industry: null,
      peRatio: null,
      dividendYield: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      currentPrice: currentPrice,
      change: quote?.change || null,
      changePercent: quote?.changePercent || null,
      rsi14: currentRSI,
      sma14: currentSMA,
      performance: performance || {
        oneMonth: null,
        threeMonth: null,
        sixMonth: null,
        oneYear: null
      }
    })
  } catch (error) {
    console.error("[Portfolio Data] API error:", error)
    return NextResponse.json({ error: "Failed to fetch portfolio data" }, { status: 500 })
  }
}
