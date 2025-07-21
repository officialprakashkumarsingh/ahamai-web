'use client'

import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { Message } from 'ai'
import {
  ArrowUp,
  ChevronDown,
  MessageCirclePlus,
  Square,
  Hammer
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useArtifact } from './artifact/artifact-context'
import { EmptyScreen } from './empty-screen'
import { ModelSelector } from './model-selector'
import { SearchModeToggle } from './search-mode-toggle'
import { Button } from './ui/button'
import { IconLogo } from './ui/icons'
import { AppBuilderModal } from './app-builder-modal'

interface ChatPanelProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  messages: Message[]
  setMessages: (messages: Message[]) => void
  query?: string
  stop: () => void
  append: (message: any) => void
  models?: Model[]
  /** Whether to show the scroll to bottom button */
  showScrollToBottomButton: boolean
  /** Reference to the scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement>
  isAtBottom: boolean
  addToolResult: (result: any) => void
}

export function ChatPanel({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  messages,
  setMessages,
  query,
  stop,
  append,
  models,
  showScrollToBottomButton,
  scrollContainerRef,
  isAtBottom,
  addToolResult
}: ChatPanelProps) {
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false) // Composition state
  const [enterDisabled, setEnterDisabled] = useState(false) // Disable Enter after composition ends
  const { close: closeArtifact } = useArtifact()
  const [showAppBuilder, setShowAppBuilder] = useState(false)

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)
    setEnterDisabled(true)
    setTimeout(() => {
      setEnterDisabled(false)
    }, 300)
  }

  const handleNewChat = () => {
    setMessages([])
    closeArtifact()
    router.push('/')
  }

  const isToolInvocationInProgress = () => {
    if (!messages.length) return false

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'assistant' || !lastMessage.parts) return false

    const parts = lastMessage.parts
    const lastPart = parts[parts.length - 1]

    return (
      lastPart?.type === 'tool-invocation' &&
      lastPart?.toolInvocation?.state === 'call'
    )
  }

  // if query is not empty, submit the query
  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0) {
      append({
        role: 'user',
        content: query
      })
      isFirstRender.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  // Scroll to the bottom of the container
  const handleScrollToBottom = () => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !isComposing &&
      !enterDisabled
    ) {
      if (input.trim().length === 0) {
        e.preventDefault()
        return
      }
      e.preventDefault()
      const textarea = e.target as HTMLTextAreaElement
      textarea.form?.requestSubmit()
    }
  }

  return (
    <div
      className={cn(
        'w-full bg-background group/form-container shrink-0 chat-input-container',
        messages.length > 0 ? 'sticky bottom-0 px-2 sm:px-4 pb-4' : 'px-4 sm:px-6'
      )}
    >
      {messages.length === 0 && (
        <div className="mb-6 sm:mb-10 flex flex-col items-center gap-4">
          <IconLogo className="size-8 sm:size-12 text-muted-foreground" />
          <p className="text-center text-xl sm:text-3xl font-semibold px-4">
            How can I help you today?
          </p>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className={cn('max-w-3xl w-full mx-auto relative', isLoading && 'generating-content')}
      >
        {/* Scroll to bottom button - only shown when showScrollToBottomButton is true */}
        {showScrollToBottomButton && messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute -top-10 right-2 sm:right-4 z-20 size-8 rounded-full shadow-md"
            onClick={handleScrollToBottom}
            title="Scroll to bottom"
          >
            <ChevronDown size={16} />
          </Button>
        )}

        <div className="relative flex flex-col w-full gap-2 bg-muted rounded-2xl sm:rounded-3xl border border-input">
          <Textarea
            ref={inputRef}
            name="input"
            rows={2}
            maxRows={5}
            tabIndex={0}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder="Ask anything..."
            spellCheck={false}
            autoFocus
            value={input}
            className={cn(
              'w-full resize-none bg-transparent pl-4 pr-16 sm:pr-20 pt-4 pb-3 text-sm sm:text-base',
              'focus:outline-none',
              'placeholder:text-muted-foreground/60',
              'min-h-[3rem]'
            )}
          />

          {/* Bottom menu area - Mobile optimized */}
          <div className="flex items-center justify-between p-2 gap-2">
            {/* Left side - Model selector and search toggle */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <ModelSelector models={models || []} />
              <SearchModeToggle />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowAppBuilder(!showAppBuilder)}
                className="shrink-0 rounded-full"
                type="button"
                title="App Builder"
              >
                <Hammer className="size-4" />
              </Button>
            </div>
            
            {/* Right side - Action buttons */}
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNewChat}
                  className="shrink-0 rounded-full group"
                  type="button"
                  disabled={isLoading || isToolInvocationInProgress()}
                >
                  <MessageCirclePlus className="size-4 group-hover:rotate-12 transition-all" />
                </Button>
              )}
              <Button
                type={isLoading ? 'button' : 'submit'}
                size={'icon'}
                variant={'outline'}
                className={cn(isLoading && 'animate-pulse', 'rounded-full')}
                disabled={
                  (input.length === 0 && !isLoading) ||
                  isToolInvocationInProgress()
                }
                onClick={isLoading ? stop : undefined}
              >
                {isLoading ? <Square size={20} /> : <ArrowUp size={20} />}
              </Button>
            </div>
          </div>
        </div>

        {messages.length === 0 && (
          <EmptyScreen
            submitMessage={message => {
              handleInputChange({
                target: { value: message }
              } as React.ChangeEvent<HTMLTextAreaElement>)
            }}
            className={cn(showEmptyScreen ? 'visible' : 'invisible')}
          />
        )}

        {/* App Builder Modal */}
        {showAppBuilder && (
          <AppBuilderModal
            isOpen={showAppBuilder}
            onClose={() => setShowAppBuilder(false)}
          />
        )}
      </form>
    </div>
  )
}
