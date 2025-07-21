'use client'

import { ToolInvocation } from 'ai'
import { CollapsibleMessage } from './collapsible-message'
import { ToolArgsSection } from './section'
import { StockChart } from './stock-chart'
import { useArtifact } from '@/components/artifact/artifact-context'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StockDataSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
  marketCap?: number
  priceHistory?: Array<{
    date: string
    price: number
  }>
}

export function StockDataSection({
  tool,
  isOpen,
  onOpenChange
}: StockDataSectionProps) {
  const isLoading = tool.state === 'call'
  const result = tool.state === 'result' ? tool.result : null
  
  const stockData: StockData | null = result?.success && result?.data ? result.data : null
  const symbol = tool.args?.symbol as string | undefined
  
  const { open } = useArtifact()
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + 'B'
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M'
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K'
    }
    return num.toLocaleString()
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />
    if (change < 0) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const header = (
    <button
      type="button"
      onClick={() => open({ type: 'tool-invocation', toolInvocation: tool })}
      className="flex items-center justify-between w-full text-left rounded-md p-1 -ml-1"
      title="Open details"
    >
      <ToolArgsSection
        tool="get_stock_data"
        number={stockData ? 1 : 0}
      >
        {symbol ? `Stock data for ${symbol.toUpperCase()}` : 'Getting stock data...'}
      </ToolArgsSection>
    </button>
  )

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible={true}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      header={header}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-muted-foreground">Fetching stock data...</span>
        </div>
      ) : stockData ? (
        <div className="space-y-6">
          {/* Stock Header */}
          <div className="bg-card/50 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{stockData.symbol}</h3>
                <p className="text-sm text-muted-foreground">{stockData.name}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatPrice(stockData.price)}</div>
                <div className={cn("flex items-center gap-1", getTrendColor(stockData.change))}>
                  {getTrendIcon(stockData.change)}
                  <span className="font-medium">
                    {stockData.change >= 0 ? '+' : ''}{formatPrice(stockData.change)} 
                    ({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card/30 rounded-lg p-3 border">
              <div className="text-xs text-muted-foreground">High</div>
              <div className="font-semibold">{formatPrice(stockData.high)}</div>
            </div>
            <div className="bg-card/30 rounded-lg p-3 border">
              <div className="text-xs text-muted-foreground">Low</div>
              <div className="font-semibold">{formatPrice(stockData.low)}</div>
            </div>
            <div className="bg-card/30 rounded-lg p-3 border">
              <div className="text-xs text-muted-foreground">Volume</div>
              <div className="font-semibold">{formatNumber(stockData.volume)}</div>
            </div>
            {stockData.marketCap && (
              <div className="bg-card/30 rounded-lg p-3 border">
                <div className="text-xs text-muted-foreground">Market Cap</div>
                <div className="font-semibold">{formatNumber(stockData.marketCap)}</div>
              </div>
            )}
          </div>

          {/* Stock Chart */}
          {stockData.priceHistory && stockData.priceHistory.length > 0 && (
            <div className="bg-card/30 rounded-lg p-4 border">
              <h4 className="font-semibold mb-4">Price Chart</h4>
              <StockChart data={stockData.priceHistory} symbol={stockData.symbol} />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to fetch stock data</p>
        </div>
      )}
    </CollapsibleMessage>
  )
}