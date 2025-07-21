'use client'

import { ToolInvocation } from 'ai'
import { ChartGenerationSection } from './chart-generation-section'
import { CollapsibleMessage } from './collapsible-message'
import { ToolArgsSection } from './section'
import { useArtifact } from '@/components/artifact/artifact-context'

interface ChartGenerationToolSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ChartGenerationToolSection({
  tool,
  isOpen,
  onOpenChange
}: ChartGenerationToolSectionProps) {
  const isLoading = tool.state === 'call'
  const result = tool.state === 'result' ? tool.result : null
  
  const charts = result?.success && result?.charts ? result.charts : []
  const title = tool.args?.title as string | undefined
  
  const { open } = useArtifact()
  
  const header = (
    <button
      type="button"
      onClick={() => open({ type: 'tool-invocation', toolInvocation: tool })}
      className="flex items-center justify-between w-full text-left rounded-md p-1 -ml-1"
      title="Open details"
    >
      <ToolArgsSection
        tool="generate_chart"
        number={charts.length}
      >
        {title || 'Generating chart...'}
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
      <ChartGenerationSection 
        charts={charts} 
        isLoading={isLoading}
      />
    </CollapsibleMessage>
  )
}