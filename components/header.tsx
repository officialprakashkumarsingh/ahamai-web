'use client'

import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
// import Link from 'next/link' // No longer needed directly here for Sign In button
import React from 'react'
// import { Button } from './ui/button' // No longer needed directly here for Sign In button
import GuestMenu from './guest-menu' // Import the new GuestMenu component
import UserMenu from './user-menu'

interface HeaderProps {
  user: User | null
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const { open } = useSidebar()
  return (
    <header
      className={cn(
        'fixed top-0 right-0 p-2 sm:p-4 flex justify-between items-center z-[100] backdrop-blur-md bg-background/90 transition-[width] duration-200 ease-linear',
        open ? 'md:w-[calc(100%-var(--sidebar-width))]' : 'md:w-full',
        'w-full'
      )}
    >
      {/* This div can be used for a logo or title on the left if needed */}
      <div></div>

      <div className="flex items-center gap-1 sm:gap-2">
        {user ? <UserMenu user={user} /> : <GuestMenu />}
      </div>
    </header>
  )
}

export default Header
