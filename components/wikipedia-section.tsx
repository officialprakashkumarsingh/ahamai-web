'use client'

import { ToolInvocation } from 'ai'
import { CollapsibleMessage } from './collapsible-message'
import { ToolArgsSection } from './section'
import { useArtifact } from '@/components/artifact/artifact-context'
import { BookOpen, ExternalLink, Globe, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Button } from './ui/button'

interface WikipediaSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

interface WikipediaArticle {
  title: string
  description: string
  extract: string
  url: string
  thumbnail?: string
  coordinates?: any
  pageid: number
}

interface WikipediaResult {
  success: boolean
  query?: string
  language?: string
  total_results?: number
  articles?: WikipediaArticle[]
  error?: string
}

export function WikipediaSection({
  tool,
  isOpen,
  onOpenChange
}: WikipediaSectionProps) {
  const isLoading = tool.state === 'call'
  const result = tool.state === 'result' ? tool.result as WikipediaResult : null
  
  const query = tool.args?.query as string | undefined
  const { open } = useArtifact()

  const header = (
    <button
      type="button"
      onClick={() => open({ type: 'tool-invocation', toolInvocation: tool })}
      className="flex items-center justify-between w-full text-left rounded-md p-1 -ml-1"
      title="Open details"
    >
      <ToolArgsSection
        tool="wikipedia_search"
        number={result?.articles?.length || 0}
      >
        {query ? `Wikipedia search: ${query}` : 'Searching Wikipedia...'}
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
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-muted-foreground">Searching Wikipedia...</span>
        </div>
      ) : result?.success && result.articles ? (
        <div className="space-y-4">
          {/* Search Summary */}
          <div className="bg-card/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4" />
              <span className="font-medium">Wikipedia Search Results</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Found {result.total_results} articles for &quot;{result.query}&quot; 
              {result.language && result.language !== 'en' && ` (${result.language})`}
            </p>
          </div>

          {/* Articles */}
          <div className="space-y-4">
            {result.articles.map((article, index) => (
              <div key={article.pageid || index} className="bg-card/30 rounded-lg p-4 border hover:bg-card/50 transition-colors">
                <div className="flex gap-4">
                  {article.thumbnail && (
                    <div className="flex-shrink-0">
                      <Image
                        src={article.thumbnail}
                        alt={article.title}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg leading-tight">
                        {article.title}
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                    
                    {article.description && (
                      <p className="text-sm text-muted-foreground mb-2 italic">
                        {article.description}
                      </p>
                    )}
                    
                    <p className="text-sm leading-relaxed mb-3 line-clamp-4">
                      {article.extract}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Page ID: {article.pageid}</span>
                      </div>
                      
                      {article.coordinates && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {article.coordinates.lat?.toFixed(3)}, {article.coordinates.lon?.toFixed(3)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {result?.error || 'Failed to search Wikipedia'}
          </p>
        </div>
      )}
    </CollapsibleMessage>
  )
}