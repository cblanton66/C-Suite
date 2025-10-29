import { type NextRequest, NextResponse } from "next/server"
import { getTickerDetails, calculatePerformance } from "@/lib/polygon-api"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json({ error: "Symbol parameter is required" }, { status: 400 })
    }

    console.log(`[Portfolio Data] Fetching data for ${symbol}`)

    // Fetch ticker details and performance in parallel
    const [details, performance] = await Promise.all([
      getTickerDetails(symbol),
      calculatePerformance(symbol)
    ])

    if (!details) {
      return NextResponse.json({ error: `No data found for symbol ${symbol}` }, { status: 404 })
    }

    return NextResponse.json({
      symbol: details.ticker,
      name: details.name,
      type: details.type,
      description: details.description,
      marketCap: details.market_cap,
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
