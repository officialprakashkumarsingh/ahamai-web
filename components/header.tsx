'use client'

import { useSidebar, SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
import React from 'react'
import GuestMenu from './guest-menu'
import UserMenu from './user-menu'

interface HeaderProps {
  user: User | null
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const { open } = useSidebar()
  return (
    <header
      className={cn(
        'fixed top-0 right-0 p-2 sm:p-4 flex justify-between items-center z-50 backdrop-blur-md bg-background/95 transition-[width] duration-200 ease-linear',
        open ? 'md:w-[calc(100%-var(--sidebar-width))]' : 'md:w-full',
        'w-full h-14 sm:h-16'
      )}
    >
      {/* Left side - Sidebar trigger */}
      <div className="flex items-center">
        <SidebarTrigger className="h-8 w-8 sm:h-10 sm:w-10 -ml-1 sm:-ml-2" />
      </div>

      {/* Center - Logo */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <span className="font-pacifico text-lg sm:text-xl text-foreground">
          AhamAI
        </span>
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-1 sm:gap-2">
        {user ? <UserMenu user={user} /> : <GuestMenu />}
      </div>
    </header>
  )
}

export default Header
