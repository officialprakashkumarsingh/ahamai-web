'use client'

import { useMemo } from 'react'

interface StockChartProps {
  data: Array<{
    date: string
    price: number
  }>
  symbol: string
}

export function StockChart({ data, symbol }: StockChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    const prices = data.map(d => d.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice

    const width = 400
    const height = 200
    const padding = 20

    const points = data.map((item, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((item.price - minPrice) / priceRange) * (height - 2 * padding)
      return { x, y, price: item.price, date: item.date }
    })

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')

    return {
      points,
      pathData,
      minPrice,
      maxPrice,
      width,
      height,
      isPositive: prices[prices.length - 1] >= prices[0]
    }
  }, [data])

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No chart data available
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  return (
    <div className="w-full">
      <div className="relative bg-background rounded border p-4">
        <svg
          width="100%"
          height={chartData.height}
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Price line */}
          <path
            d={chartData.pathData}
            fill="none"
            stroke={chartData.isPositive ? '#059669' : '#dc2626'}
            strokeWidth="2.5"
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {chartData.points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill={chartData.isPositive ? '#059669' : '#dc2626'}
                className="hover:r-4 transition-all cursor-pointer"
              />
              {/* Tooltip on hover */}
              <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <rect
                  x={point.x - 40}
                  y={point.y - 35}
                  width="80"
                  height="25"
                  rx="4"
                  fill="black"
                  fillOpacity="0.8"
                />
                <text
                  x={point.x}
                  y={point.y - 20}
                  textAnchor="middle"
                  className="text-xs fill-white"
                >
                  {formatPrice(point.price)}
                </text>
              </g>
            </g>
          ))}
          
          {/* Y-axis labels */}
          <text
            x="5"
            y="25"
            className="text-xs fill-muted-foreground"
            textAnchor="start"
          >
            {formatPrice(chartData.maxPrice)}
          </text>
          <text
            x="5"
            y={chartData.height - 10}
            className="text-xs fill-muted-foreground"
            textAnchor="start"
          >
            {formatPrice(chartData.minPrice)}
          </text>
        </svg>
        
        {/* Chart info */}
        <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
          <span>{data.length} data points</span>
          <span>
            {chartData.isPositive ? '↗' : '↘'} 
            {chartData.isPositive ? 'Trending Up' : 'Trending Down'}
          </span>
        </div>
      </div>
    </div>
  )
}