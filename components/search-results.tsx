'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SearchResultItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'

export interface SearchResultsProps {
  results: SearchResultItem[]
  displayMode?: 'grid' | 'list'
}

export function SearchResults({
  results,
  displayMode = 'grid'
}: SearchResultsProps) {
  // State to manage whether to display the results
  const [showAllResults, setShowAllResults] = useState(false)

  const handleViewMore = () => {
    setShowAllResults(true)
  }

  // Logic for grid mode
  const displayedGridResults = showAllResults ? results : results.slice(0, 3)
  const additionalResultsCount = results.length > 3 ? results.length - 3 : 0
  const displayUrlName = (url: string) => {
    const hostname = new URL(url).hostname
    const parts = hostname.split('.')
    return parts.length > 2 ? parts.slice(1, -1).join('.') : parts[0]
  }

  // --- List Mode Rendering ---
  if (displayMode === 'list') {
    return (
      <div className="flex flex-col gap-2 search-results">
        {results.map((result, index) => (
          <Link
            href={result.url}
            key={index}
            passHref
            target="_blank"
            className="block"
          >
            <Card className="w-full hover:bg-muted/50 transition-colors border-border/50">
              <CardContent className="p-3 sm:p-4 flex items-start space-x-3">
                <Avatar className="h-4 w-4 mt-1 flex-shrink-0">
                  <AvatarImage
                    src={`https://www.google.com/s2/favicons?domain=${
                      new URL(result.url).hostname
                    }`}
                    alt={new URL(result.url).hostname}
                  />
                  <AvatarFallback className="text-xs bg-muted">
                    {new URL(result.url).hostname[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-grow overflow-hidden space-y-1">
                  <p className="text-sm sm:text-base font-medium line-clamp-1 text-foreground">
                    {result.title || new URL(result.url).pathname}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {result.content}
                  </p>
                  <div className="text-xs text-muted-foreground/80 mt-1 truncate">
                    <span className="underline">
                      {new URL(result.url).hostname}
                    </span>{' '}
                    - {index + 1}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    )
  }

  // --- Grid Mode Rendering (Enhanced for Mobile) ---
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
      {displayedGridResults.map((result, index) => (
        <Link href={result.url} passHref target="_blank" key={index}>
          <Card className={cn(
            "h-full hover:bg-muted/50 transition-colors border-border/50 cursor-pointer",
            "hover:shadow-sm hover:border-border"
          )}>
            <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full">
              <p className="text-xs sm:text-sm line-clamp-3 min-h-[3rem] sm:min-h-[2.5rem] text-foreground leading-relaxed">
                {result.title || result.content}
              </p>
              <div className="mt-2 sm:mt-3 flex items-center space-x-2">
                <Avatar className="h-4 w-4 flex-shrink-0">
                  <AvatarImage
                    src={`https://www.google.com/s2/favicons?domain=${
                      new URL(result.url).hostname
                    }`}
                    alt={new URL(result.url).hostname}
                  />
                  <AvatarFallback className="text-xs bg-muted">
                    {new URL(result.url).hostname[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs text-muted-foreground/80 truncate flex-1">
                  {`${displayUrlName(result.url)} - ${index + 1}`}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      {!showAllResults && additionalResultsCount > 0 && (
        <Card className="h-full flex items-center justify-center border-border/50 border-dashed">
          <CardContent className="p-3 sm:p-4 flex items-center justify-center h-full">
            <Button
              variant={'ghost'}
              className="text-muted-foreground text-xs sm:text-sm h-auto p-2 sm:p-3 hover:bg-muted/50"
              onClick={handleViewMore}
            >
              View {additionalResultsCount} more
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
