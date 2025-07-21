import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { CurrentUserAvatar } from './current-user-avatar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from './ui/collapsible'
import { IconLogo } from './ui/icons'
import { Separator } from './ui/separator'

interface CollapsibleMessageProps {
  children: React.ReactNode
  role: 'user' | 'assistant'
  isCollapsible?: boolean
  isOpen?: boolean
  header?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  showBorder?: boolean
  showIcon?: boolean
}

export function CollapsibleMessage({
  children,
  role,
  isCollapsible = false,
  isOpen = true,
  header,
  onOpenChange,
  showBorder = true,
  showIcon = true
}: CollapsibleMessageProps) {
  const content = <div className="flex-1 message-content">{children}</div>

  return (
    <div className="flex">
      {showIcon && (
        <div className="relative flex flex-col items-center">
          <div className="w-5 shrink-0">
            {role === 'assistant' ? (
              <IconLogo className="size-5" />
            ) : (
              <CurrentUserAvatar />
            )}
          </div>
        </div>
      )}

      {isCollapsible ? (
        <div
          className={cn(
            'flex-1 ml-5 pb-4 collapsible-message-content',
            'sm:ml-6 sm:pb-6'
          )}
        >
          <Collapsible open={isOpen} onOpenChange={onOpenChange}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between text-left text-sm font-medium transition-colors hover:text-foreground/80',
                  'px-2 sm:px-0'
                )}
              >
                {header}
                <ChevronDown
                  className={cn(
                    'ml-2 h-4 w-4 shrink-0 transition-transform duration-200',
                    isOpen ? 'rotate-180' : ''
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className={cn('pt-2', showBorder && 'pl-2 border-l')}>
                {content}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ) : (
        <div
          className={cn(
            'flex-1 ml-5 pb-4',
            'sm:ml-6 sm:pb-6',
            showBorder && 'pl-2 border-l',
            'collapsible-message-content'
          )}
        >
          {header && <div className="mb-2">{header}</div>}
          {content}
        </div>
      )}
    </div>
  )
}
