'use client'

import { ToolInvocation } from 'ai'
import { ImageGenerationSection } from './image-generation-section'
import { Section } from './section'
import { ToolBadge } from './tool-badge'

interface ImageGenerationToolSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageGenerationToolSection({
  tool,
  isOpen,
  onOpenChange
}: ImageGenerationToolSectionProps) {
  const isLoading = tool.state === 'call'
  const result = tool.state === 'result' ? tool.result : null
  
  const images = result?.success && result?.images ? result.images : []

  return (
    <Section
      size="sm"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      header={
        <div className="flex items-center gap-2">
          <ToolBadge type="generate_image" />
          <span className="text-muted-foreground">
            {isLoading ? 'Generating images...' : `Generated ${images.length} images`}
          </span>
        </div>
      }
    >
      <ImageGenerationSection 
        images={images} 
        isLoading={isLoading}
      />
    </Section>
  )
}