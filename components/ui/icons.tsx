'use client'

import { cn } from '@/lib/utils'

function IconLogo({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('relative inline-block overflow-hidden', className)}
      {...props}
    >
      <div className="relative">
        <span className="ahamai-logo inline-block text-2xl font-normal select-none">
          AhamAI
        </span>
        
        {/* Cutting line effect */}
        <div className="ahamai-cutter absolute inset-0 pointer-events-none mix-blend-multiply dark:mix-blend-screen opacity-60" />
      </div>
    </div>
  )
}

export { IconLogo }
