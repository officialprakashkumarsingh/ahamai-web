'use client'

import { RetrieveArtifactContent } from '@/components/artifact/retrieve-artifact-content'
import { SearchArtifactContent } from '@/components/artifact/search-artifact-content'
import { VideoSearchArtifactContent } from '@/components/artifact/video-search-artifact-content'
import { ImageGenerationArtifactContent } from '@/components/artifact/image-generation-artifact-content'
import { ChartGenerationArtifactContent } from '@/components/artifact/chart-generation-artifact-content'
import type { ToolInvocation } from 'ai'

export function ToolInvocationContent({
  toolInvocation
}: {
  toolInvocation: ToolInvocation
}) {
  switch (toolInvocation.toolName) {
    case 'search':
      return <SearchArtifactContent tool={toolInvocation} />
    case 'retrieve':
      return <RetrieveArtifactContent tool={toolInvocation} />
    case 'videoSearch':
      return <VideoSearchArtifactContent tool={toolInvocation} />
    case 'generate_image':
      return <ImageGenerationArtifactContent tool={toolInvocation} />
    case 'generate_chart':
      return <ChartGenerationArtifactContent tool={toolInvocation} />
    default:
      return <div className="p-4">Details for this tool are not available</div>
  }
}
