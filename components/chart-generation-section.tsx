'use client'

import { Download, ExternalLink, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface GeneratedChart {
  type: string
  url: string
  sandboxUrl?: string
  title: string
  width: number
  height: number
}

interface ChartGenerationSectionProps {
  charts: GeneratedChart[]
  isLoading?: boolean
}

export function ChartGenerationSection({ charts, isLoading }: ChartGenerationSectionProps) {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({})

  const handleDownload = async (chart: GeneratedChart) => {
    try {
      setLoadingStates(prev => ({ ...prev, [chart.url]: true }))
      
      const response = await fetch(chart.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `${chart.title.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}-chart.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download chart:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [chart.url]: false }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Generating chart...</span>
      </div>
    )
  }

  if (!charts || charts.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Generated Charts</h3>
      <div className="grid grid-cols-1 gap-4">
        {charts.map((chart, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="relative aspect-[4/3] bg-white">
              <Image
                src={chart.url}
                alt={chart.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {chart.type.toUpperCase()}
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium mb-3">{chart.title}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {chart.width} × {chart.height}
                </span>
                <div className="flex gap-2">
                  {chart.sandboxUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(chart.sandboxUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(chart)}
                    disabled={loadingStates[chart.url]}
                  >
                    {loadingStates[chart.url] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}