'use client'

import { cn } from '@/lib/utils'

function IconLogo({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('relative inline-flex items-center justify-center w-8 h-8', className)}
      {...props}
    >
      <style jsx>{`
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        
        @keyframes curious-look {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }
        
        .eye {
          animation: blink 4s infinite;
          transform-origin: center;
        }
        
        .eye:nth-child(2) {
          animation-delay: 0.1s;
        }
        
        .pupil {
          animation: curious-look 6s infinite ease-in-out;
        }
      `}</style>
      
      {/* Din black circle background */}
      <svg width="32" height="32" viewBox="0 0 32 32" className="w-full h-full">
        <circle cx="16" cy="16" r="15" fill="#1a1a1a" />
        
        {/* Left eye */}
        <g className="eye">
          <ellipse cx="11" cy="14" rx="3.5" ry="5" fill="white" />
          <circle cx="11" cy="14" r="2.5" fill="black" className="pupil" />
          <circle cx="11.5" cy="13" r="0.8" fill="white" opacity="0.9" />
        </g>
        
        {/* Right eye */}
        <g className="eye">
          <ellipse cx="21" cy="14" rx="3.5" ry="5" fill="white" />
          <circle cx="21" cy="14" r="2.5" fill="black" className="pupil" />
          <circle cx="21.5" cy="13" r="0.8" fill="white" opacity="0.9" />
        </g>
        
        {/* Subtle highlight on the circle */}
        <circle cx="16" cy="16" r="14" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
      </svg>
    </div>
  )
}

export { IconLogo }
