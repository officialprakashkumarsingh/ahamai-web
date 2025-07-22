'use client'

import { Download, Loader2, AlertCircle, ZoomIn } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { cn } from '@/lib/utils'

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
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({})

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

  const handleImageError = (imageUrl: string) => {
    setImageErrors(prev => ({ ...prev, [imageUrl]: true }))
    setImageLoading(prev => ({ ...prev, [imageUrl]: false }))
  }

  const handleImageLoad = (imageUrl: string) => {
    setImageLoading(prev => ({ ...prev, [imageUrl]: false }))
  }

  const handleImageLoadStart = (imageUrl: string) => {
    setImageLoading(prev => ({ ...prev, [imageUrl]: true }))
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
      <h3 className="text-base sm:text-lg font-semibold px-1">Generated Images</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {images.map((image, index) => (
          <Card key={index} className="overflow-hidden bg-card/50 border shadow-sm hover:shadow-md transition-shadow">
            <div className="relative aspect-square group">
              {imageErrors[image.url] ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center p-4">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Failed to load image</p>
                  </div>
                </div>
              ) : (
                <>
                  {imageLoading[image.url] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <Image
                    src={image.url}
                    alt={image.prompt}
                    fill
                    className="object-cover transition-opacity"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    unoptimized={true}
                    quality={90}
                    onError={() => handleImageError(image.url)}
                    onLoad={() => handleImageLoad(image.url)}
                    onLoadStart={() => handleImageLoadStart(image.url)}
                    priority={index < 2}
                  />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-full h-full max-h-[90vh] p-0">
                      <div className="relative w-full h-full">
                        <Image
                          src={image.url}
                          alt={image.prompt}
                          fill
                          className="object-contain"
                          unoptimized={true}
                          quality={100}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                {image.model.toUpperCase()}
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                {image.prompt}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {image.width} × {image.height}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(image)}
                  disabled={loadingStates[image.url] || imageErrors[image.url]}
                  className={cn(
                    "min-h-[32px] px-3 text-xs",
                    "sm:min-h-[36px] sm:px-4 sm:text-sm"
                  )}
                >
                  {loadingStates[image.url] ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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