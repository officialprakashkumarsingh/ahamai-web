'use client'

import { ToolInvocation } from 'ai'
import { ImageGenerationSection } from './image-generation-section'
import { CollapsibleMessage } from './collapsible-message'
import { ToolArgsSection } from './section'
import { useArtifact } from '@/components/artifact/artifact-context'

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
  const prompt = tool.args?.prompt as string | undefined
  
  const { open } = useArtifact()
  
  const header = (
    <button
      type="button"
      onClick={() => open({ type: 'tool-invocation', toolInvocation: tool })}
      className="flex items-center justify-between w-full text-left rounded-md p-1 -ml-1"
      title="Open details"
    >
      <ToolArgsSection
        tool="generate_image"
        number={images.length}
      >
        {prompt || 'Generating images...'}
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
      <ImageGenerationSection 
        images={images} 
        isLoading={isLoading}
      />
    </CollapsibleMessage>
  )
}