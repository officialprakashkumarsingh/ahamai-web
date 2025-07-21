'use client'

import { cn } from '@/lib/utils'

function IconLogo({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('relative inline-flex flex-col items-center', className)}
      {...props}
    >
      {/* AhamAI watermark text above */}
      <div className="text-[8px] font-medium text-muted-foreground/60 mb-0.5 select-none tracking-wide">
        AhamAI
      </div>
      
      {/* Square logo container */}
      <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 shadow-sm overflow-hidden">
        {/* Geometric pattern background */}
        <div className="absolute inset-0 opacity-30">
          <svg width="100%" height="100%" viewBox="0 0 32 32" className="text-primary/40">
            <defs>
              <pattern id="dots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="4" r="1" fill="currentColor" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)"/>
          </svg>
        </div>
        
        {/* Main logo shape - modern AI-inspired design */}
        <div className="absolute inset-2 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" className="text-primary">
            {/* Central neural node */}
            <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.9"/>
            
            {/* Connecting neural paths */}
            <circle cx="4" cy="4" r="1.5" fill="currentColor" opacity="0.7"/>
            <circle cx="12" cy="4" r="1.5" fill="currentColor" opacity="0.7"/>
            <circle cx="4" cy="12" r="1.5" fill="currentColor" opacity="0.7"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.7"/>
            
            {/* Connection lines */}
            <line x1="5.5" y1="5.5" x2="6.5" y2="6.5" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
            <line x1="10.5" y1="5.5" x2="9.5" y2="6.5" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
            <line x1="5.5" y1="10.5" x2="6.5" y2="9.5" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
            <line x1="10.5" y1="10.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
          </svg>
        </div>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
        
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-2 h-2 bg-primary/20 transform rotate-45 translate-x-1 -translate-y-1" />
      </div>
    </div>
  )
}

export { IconLogo }
