'use client'

import { Download, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface GeneratedImage {
  model: string
  url: string
  prompt: string
  width: number
  height: number
}

interface ImageGenerationSectionProps {
  images: GeneratedImage[]
  isLoading?: boolean
}

export function ImageGenerationSection({ images, isLoading }: ImageGenerationSectionProps) {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({})

  const handleDownload = async (image: GeneratedImage) => {
    try {
      setLoadingStates(prev => ({ ...prev, [image.url]: true }))
      
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
      setLoadingStates(prev => ({ ...prev, [image.url]: false }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Generating images...</span>
      </div>
    )
  }

  if (!images || images.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Generated Images</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((image, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="relative aspect-square">
              <Image
                src={image.url}
                alt={image.prompt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {image.model.toUpperCase()}
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{image.prompt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {image.width} × {image.height}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(image)}
                  disabled={loadingStates[image.url]}
                >
                  {loadingStates[image.url] ? (
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
          </Card>
        ))}
      </div>
    </div>
  )
}