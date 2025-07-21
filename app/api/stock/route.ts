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

    // Use Yahoo Finance API alternative (Alpha Vantage free tier or Yahoo Finance)
    // For demo purposes, I'll create a mock API that simulates real stock data
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
    // Try to use Alpha Vantage (free tier) or create mock data for demo
    // For production, you would use: https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=YOUR_API_KEY
    
    // Mock data for demonstration (you can replace this with real API calls)
    const mockStocks: Record<string, any> = {
      'AAPL': {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 175.84,
        change: 2.34,
        changePercent: 1.35,
        high: 178.21,
        low: 173.50,
        volume: 54821000,
        marketCap: 2759000000000,
        priceHistory: generateMockPriceHistory(175.84, 30)
      },
      'GOOGL': {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 134.25,
        change: -1.45,
        changePercent: -1.07,
        high: 136.78,
        low: 132.90,
        volume: 28451000,
        marketCap: 1685000000000,
        priceHistory: generateMockPriceHistory(134.25, 30)
      },
      'MSFT': {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        price: 348.56,
        change: 5.67,
        changePercent: 1.65,
        high: 351.23,
        low: 345.12,
        volume: 34567000,
        marketCap: 2589000000000,
        priceHistory: generateMockPriceHistory(348.56, 30)
      },
      'TSLA': {
        symbol: 'TSLA',
        name: 'Tesla, Inc.',
        price: 238.45,
        change: -8.34,
        changePercent: -3.38,
        high: 248.90,
        low: 235.67,
        volume: 89234000,
        marketCap: 756000000000,
        priceHistory: generateMockPriceHistory(238.45, 30)
      },
      'NVDA': {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        price: 457.12,
        change: 12.34,
        changePercent: 2.77,
        high: 465.78,
        low: 445.23,
        volume: 67890000,
        marketCap: 1127000000000,
        priceHistory: generateMockPriceHistory(457.12, 30)
      }
    }

    if (mockStocks[symbol]) {
      return mockStocks[symbol]
    }

    // Try to use a real API for other symbols (you can implement this)
    // For now, return null for unknown symbols
    return null
  } catch (error) {
    console.error('Error fetching stock data:', error)
    return null
  }
}

function generateMockPriceHistory(currentPrice: number, days: number) {
  const history = []
  let price = currentPrice
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    // Add some random variation to simulate real price movement
    const variation = (Math.random() - 0.5) * 0.05 // ±2.5% variation
    price = price * (1 + variation)
    
    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100
    })
  }
  
  return history
}