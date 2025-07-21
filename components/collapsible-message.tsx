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
  const content = <div className="flex-1 overflow-hidden">{children}</div>

  return (
    <div className="flex gap-3 sm:gap-4 w-full">
      {showIcon && (
        <div className="relative flex flex-col items-center shrink-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6">
            {role === 'assistant' ? (
              <IconLogo className="size-5 sm:size-6" />
            ) : (
              <CurrentUserAvatar />
            )}
          </div>
        </div>
      )}

      {isCollapsible ? (
        <div
          className={cn(
            'flex-1 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 min-w-0',
            showBorder && 'border border-border/50 bg-card/30'
          )}
        >
          <Collapsible
            open={isOpen}
            onOpenChange={onOpenChange}
            className="w-full"
          >
            <div className="flex items-center justify-between w-full gap-2 min-h-[40px] sm:min-h-[44px]">
              {header && (
                <div className="text-sm sm:text-base w-full overflow-hidden">
                  {header}
                </div>
              )}
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 rounded-md p-2 hover:bg-accent/80 group transition-colors min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center"
                  aria-label={isOpen ? 'Collapse section' : 'Expand section'}
                >
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down overflow-hidden">
              <Separator className="my-2 sm:my-3 md:my-4 border-border/50" />
              {content}
            </CollapsibleContent>
          </Collapsible>
        </div>
      ) : (
        <div
          className={cn(
            'flex-1 min-w-0',
            role === 'assistant' 
              ? 'rounded-xl sm:rounded-2xl px-0 sm:px-0' 
              : 'rounded-xl sm:rounded-2xl px-2 sm:px-3'
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
