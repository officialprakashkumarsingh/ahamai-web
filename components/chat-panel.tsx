'use client'

import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { Message } from 'ai'
import { ArrowUp, ChevronDown, MessageCirclePlus, Square, Mic, MicOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { toast } from 'sonner'
import { useArtifact } from './artifact/artifact-context'
import { EmptyScreen } from './empty-screen'
import { ModelSelector } from './model-selector'
import { SearchModeToggle } from './search-mode-toggle'
import { Button } from './ui/button'
import { IconLogo } from './ui/icons'

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
  scrollContainerRef
}: ChatPanelProps) {
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false) // Composition state
  const [enterDisabled, setEnterDisabled] = useState(false) // Disable Enter after composition ends
  const { close: closeArtifact } = useArtifact()

  // Speech recognition setup
  const {
    isListening,
    isSupported: isSpeechSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      if (isFinal && transcript.trim()) {
        // Update the input with the final transcript
        handleInputChange({
          target: { value: input + (input ? ' ' : '') + transcript.trim() }
        } as React.ChangeEvent<HTMLTextAreaElement>)
        resetTranscript()
      }
    },
    onError: (error) => {
      toast.error(`Voice input error: ${error}`)
      stopListening()
    },
    onStart: () => {
      toast.success('Listening... Speak now!')
    },
    onEnd: () => {
      if (transcript.trim()) {
        toast.success('Voice input captured!')
      }
    }
  })

  const toggleVoiceInput = () => {
    if (!isSpeechSupported) {
      toast.error('Speech recognition is not supported in your browser')
      return
    }
    
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

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
    // Clear the input field as well
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    // Trigger input change to update state
    handleInputChange({
      target: { value: '' }
    } as React.ChangeEvent<HTMLTextAreaElement>)
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

  // Check if this is a follow-up conversation
  const isFollowUp = messages.length > 0

  return (
    <div
      className={cn(
        'w-full bg-background group/form-container shrink-0',
        messages.length > 0 ? 'sticky bottom-0 px-2 sm:px-4 pb-4 pt-2' : 'px-4 sm:px-6'
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
        className={cn('max-w-3xl w-full mx-auto relative')}
      >
        {/* Scroll to bottom button - optimized positioning */}
        {showScrollToBottomButton && messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute -top-12 right-2 sm:right-4 z-20 size-8 rounded-full shadow-lg bg-background/95 backdrop-blur-sm border"
            onClick={handleScrollToBottom}
            title="Scroll to bottom"
          >
            <ChevronDown size={16} />
          </Button>
        )}

        <div className="relative flex flex-col w-full gap-2 bg-muted/60 rounded-2xl sm:rounded-3xl border border-input shadow-sm">
          <Textarea
            ref={inputRef}
            name="input"
            rows={isFollowUp ? 1 : 2}
            maxRows={isFollowUp ? 3 : 5}
            tabIndex={0}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="Ask a question..."
            spellCheck={false}
            value={input}
            disabled={isLoading || isToolInvocationInProgress()}
            className={cn(
              "resize-none w-full bg-transparent border-0 p-3 sm:p-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              isFollowUp ? "min-h-10" : "min-h-12"
            )}
            onChange={e => {
              handleInputChange(e)
              setShowEmptyScreen(e.target.value.length === 0)
            }}
            onKeyDown={e => {
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
            }}
            onFocus={() => setShowEmptyScreen(true)}
            onBlur={() => setShowEmptyScreen(false)}
          />

          {/* Bottom menu area - Optimized for mobile and desktop */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-2 sm:p-3 gap-2 sm:gap-3">
            <div className="flex items-center gap-2 order-2 sm:order-1 flex-wrap">
              <ModelSelector models={models || []} />
            </div>
            <div className="flex items-center gap-2 justify-end order-1 sm:order-2 min-h-[44px] sm:min-h-auto">
              <SearchModeToggle />
              {/* Voice Input Button */}
              {isSpeechSupported && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleVoiceInput}
                  className={cn(
                    "shrink-0 rounded-full group min-h-[44px] min-w-[44px] sm:min-h-10 sm:min-w-10 transition-all",
                    isListening 
                      ? 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 animate-pulse' 
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                  type="button"
                  disabled={isLoading || isToolInvocationInProgress()}
                  title={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  {isListening ? (
                    <MicOff className="size-4" />
                  ) : (
                    <Mic className="size-4" />
                  )}
                </Button>
              )}
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNewChat}
                  className="shrink-0 rounded-full group min-h-[44px] min-w-[44px] sm:min-h-10 sm:min-w-10"
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
                className={cn(
                  'rounded-full min-h-[44px] min-w-[44px] sm:min-h-10 sm:min-w-10 transition-all duration-200 relative',
                  isLoading 
                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 animate-pulse' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-700 hover:border-gray-600'
                )}
                disabled={
                  (input.length === 0 && !isLoading) ||
                  isToolInvocationInProgress()
                }
                onClick={isLoading ? stop : undefined}
              >
                {isLoading && (
                  <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-spin border-t-white"></div>
                )}
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
      </form>
    </div>
  )
}
