import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Stock symbol is required' },
        { status: 400 }
      )
    }

    // Use Yahoo Finance API directly (no API key required)
    const stockData = await fetchStockData(symbol.toUpperCase())

    if (!stockData) {
      return NextResponse.json(
        { success: false, error: 'Stock data not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: stockData
    })
  } catch (error) {
    console.error('Stock API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}

async function fetchStockData(symbol: string) {
  try {
    const cleanSymbol = symbol.toUpperCase().trim()
    
    // First get basic quote data from Yahoo Finance
    const quoteResponse = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    )
    
    if (!quoteResponse.ok) {
      throw new Error(`Failed to fetch quote data for ${cleanSymbol}`)
    }
    
    const quoteData = await quoteResponse.json()
    
    if (!quoteData.chart?.result?.[0]) {
      return null
    }
    
    const result = quoteData.chart.result[0]
    const meta = result.meta
    const prices = result.indicators?.quote?.[0]
    const timestamps = result.timestamp
    
    // Get additional company info
    let companyName = meta.longName || meta.shortName || cleanSymbol
    let marketCap = null
    
    try {
      const summaryResponse = await fetch(
        `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${cleanSymbol}?modules=summaryDetail,defaultKeyStatistics`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      )
      
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        const quoteSummary = summaryData.quoteSummary?.result?.[0]
        
        if (quoteSummary) {
          marketCap = quoteSummary.summaryDetail?.marketCap?.raw || 
                    quoteSummary.defaultKeyStatistics?.marketCap?.raw
        }
      }
    } catch (error) {
      console.log('Could not fetch additional data:', error)
    }
    
    const currentPrice = meta.regularMarketPrice || meta.previousClose
    const previousClose = meta.previousClose
    const change = currentPrice - previousClose
    const changePercent = (change / previousClose) * 100
    
    // Generate price history from available data
    const priceHistory = []
    if (timestamps && prices?.close) {
      const last30Days = Math.min(30, timestamps.length)
      const startIndex = Math.max(0, timestamps.length - last30Days)
      
      for (let i = startIndex; i < timestamps.length; i++) {
        if (prices.close[i] != null) {
          const date = new Date(timestamps[i] * 1000)
          priceHistory.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(prices.close[i] * 100) / 100
          })
        }
      }
    }
    
    return {
      symbol: cleanSymbol,
      name: companyName,
      price: Math.round(currentPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      high: Math.round((meta.regularMarketDayHigh || currentPrice) * 100) / 100,
      low: Math.round((meta.regularMarketDayLow || currentPrice) * 100) / 100,
      volume: meta.regularMarketVolume || 0,
      marketCap: marketCap,
      priceHistory: priceHistory.length > 0 ? priceHistory : null
    }
  } catch (error) {
    console.error('Error fetching stock data:', error)
    return null
  }
}