'use client'

import { CHAT_ID } from '@/lib/constants'
import { useChat } from '@ai-sdk/react'
import { JSONValue } from 'ai'
import { ArrowRight } from 'lucide-react'
import React from 'react'
import { CollapsibleMessage } from './collapsible-message'
import { Section } from './section'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

export interface RelatedQuestionsProps {
  annotations: JSONValue[]
  onQuerySelect: (query: string) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

interface RelatedQuestionsAnnotation extends Record<string, JSONValue> {
  type: 'related-questions'
  data: {
    items: Array<{ query: string }>
  }
}

export const RelatedQuestions: React.FC<RelatedQuestionsProps> = ({
  annotations,
  onQuerySelect,
  isOpen,
  onOpenChange
}) => {
  const { status } = useChat({
    id: CHAT_ID
  })
  const isLoading = status === 'submitted' || status === 'streaming'

  if (!annotations) {
    return null
  }

  const lastRelatedQuestionsAnnotation = annotations[
    annotations.length - 1
  ] as RelatedQuestionsAnnotation

  const relatedQuestions = lastRelatedQuestionsAnnotation?.data
  if ((!relatedQuestions || !relatedQuestions.items) && !isLoading) {
    return null
  }

  if (relatedQuestions.items.length === 0 && isLoading) {
    return (
      <div className="mb-24 sm:mb-20">
        <CollapsibleMessage
          role="assistant"
          isCollapsible={false}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          showIcon={false}
        >
          <Skeleton className="w-full h-6" />
        </CollapsibleMessage>
      </div>
    )
  }

  return (
    <div className="mb-24 sm:mb-20">
      <CollapsibleMessage
        role="assistant"
        isCollapsible={false}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        showIcon={false}
        showBorder={false}
      >
        <Section title="Related" className="pt-0 pb-4">
          <div className="flex flex-col gap-1">
            {Array.isArray(relatedQuestions.items) ? (
              relatedQuestions.items
                ?.filter(item => item?.query !== '')
                .map((item, index) => (
                  <div className="flex items-start w-full p-1 rounded-md hover:bg-accent/20 transition-colors" key={index}>
                    <ArrowRight className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-accent-foreground/50" />
                    <Button
                      variant="link"
                      className="flex-1 justify-start px-0 py-1 h-fit font-medium text-accent-foreground/70 hover:text-accent-foreground whitespace-normal text-left text-sm"
                      type="submit"
                      name={'related_query'}
                      value={item?.query}
                      onClick={() => onQuerySelect(item?.query)}
                    >
                      {item?.query}
                    </Button>
                  </div>
                ))
            ) : (
              <div>Not an array</div>
            )}
          </div>
        </Section>
      </CollapsibleMessage>
    </div>
  )
}
export default RelatedQuestions
