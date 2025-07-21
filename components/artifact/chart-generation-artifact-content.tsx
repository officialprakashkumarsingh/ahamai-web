'use client'

import { ToolInvocation } from 'ai'
import Image from 'next/image'
import { Download, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { useState } from 'react'

export function ChartGenerationArtifactContent({
  tool
}: {
  tool: ToolInvocation
}) {
  const [downloadingStates, setDownloadingStates] = useState<{ [key: string]: boolean }>({})
  const title = tool.args?.title as string | undefined
  const type = tool.args?.type as string | undefined
  const result = tool.state === 'result' ? tool.result : null
  const charts = result?.success && result?.charts ? result.charts : []
  
  const handleDownload = async (chart: any) => {
    try {
      setDownloadingStates(prev => ({ ...prev, [chart.url]: true }))
      
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
      setDownloadingStates(prev => ({ ...prev, [chart.url]: false }))
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Chart Generation</h3>
        {title && (
          <p className="text-sm text-muted-foreground mt-1">
            {title} ({type})
          </p>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {tool.state === 'call' ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Generating chart...</span>
          </div>
        ) : charts.length > 0 ? (
          <div className="space-y-4">
            {charts.map((chart: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-white border">
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
                      disabled={downloadingStates[chart.url]}
                    >
                      {downloadingStates[chart.url] ? (
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
                {tool.args && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      Chart Configuration
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(tool.args, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            No chart generated
          </div>
        )}
      </div>
    </div>
  )
}