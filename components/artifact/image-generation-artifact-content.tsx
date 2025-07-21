'use client'

import { ToolInvocation } from 'ai'
import Image from 'next/image'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { useState } from 'react'

export function ImageGenerationArtifactContent({
  tool
}: {
  tool: ToolInvocation
}) {
  const [downloadingStates, setDownloadingStates] = useState<{ [key: string]: boolean }>({})
  const prompt = tool.args?.prompt as string | undefined
  const result = tool.state === 'result' ? tool.result : null
  const images = result?.success && result?.images ? result.images : []
  
  const handleDownload = async (image: any) => {
    try {
      setDownloadingStates(prev => ({ ...prev, [image.url]: true }))
      
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `${image.prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}-${image.model}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download image:', error)
    } finally {
      setDownloadingStates(prev => ({ ...prev, [image.url]: false }))
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Image Generation</h3>
        {prompt && (
          <p className="text-sm text-muted-foreground mt-1">
            Prompt: {prompt}
          </p>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {tool.state === 'call' ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Generating images...</span>
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {images.map((image: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={image.url}
                    alt={image.prompt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized
                  />
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {image.model.toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {image.width} × {image.height}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(image)}
                    disabled={downloadingStates[image.url]}
                  >
                    {downloadingStates[image.url] ? (
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
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            No images generated
          </div>
        )}
      </div>
    </div>
  )
}