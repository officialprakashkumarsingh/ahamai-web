import { tool } from 'ai'
import { z } from 'zod'

const stockDataSchema = z.object({
  symbol: z.string().describe('Stock symbol (e.g., AAPL, GOOGL, MSFT)')
})

export const stockDataTool = tool({
  description: 'Get real-time stock data including price, change, volume, and historical data for any stock symbol',
  parameters: stockDataSchema,
  execute: async ({ symbol }) => {
    try {
      // Use Yahoo Finance API through public endpoints that don't require API keys
      const cleanSymbol = symbol.toUpperCase().trim()
      
      // First get basic quote data
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
        return {
          success: false,
          error: `Stock symbol ${cleanSymbol} not found`
        }
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
      
      // Generate price history from the last 30 days of data
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
      
      const stockData = {
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
      
      return {
        success: true,
        data: stockData
      }
      
    } catch (error) {
      console.error('Stock data fetch error:', error)
      return {
        success: false,
        error: `Failed to fetch stock data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
})