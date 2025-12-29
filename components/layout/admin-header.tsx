// ============================================================================
// 🔝 HAPPENLIST - Admin Header Component
// ============================================================================
// Top header bar for the admin dashboard.
// Shows user info and mobile menu toggle.
// ============================================================================

'use client'

import { Menu, Bell } from 'lucide-react'
import { Button } from '@/components/ui'
import type { User } from '@supabase/supabase-js'

// ============================================================================
// 📋 AdminHeader Props
// ============================================================================

export interface AdminHeaderProps {
  /** The authenticated user */
  user: User
}

// ============================================================================
// 🔝 AdminHeader Component
// ============================================================================

export function AdminHeader({ user }: AdminHeaderProps) {
  const userEmail = user.email
  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* ========================================
            📱 Mobile Menu Toggle
            ======================================== */}
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Open menu</span>
        </Button>

        {/* ========================================
            🔔 Right Side Actions
            ======================================== */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications (placeholder) */}
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User Info */}
          {userEmail && (
            <div className="hidden sm:block">
              <p className="text-body-sm text-text-secondary">{userEmail}</p>
            </div>
          )}

          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
            <span className="text-sm font-medium text-primary-dark">
              {userEmail ? userEmail[0].toUpperCase() : 'A'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
