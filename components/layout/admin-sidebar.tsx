// ============================================================================
// 📊 HAPPENLIST - Admin Sidebar Component
// ============================================================================
// Navigation sidebar for the admin dashboard.
// Shows on desktop, collapses to menu on mobile.
// ============================================================================

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Users,
  Tags,
  Bookmark,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/lib/constants'
import { signOut } from '@/lib/actions/auth'
import type { User } from '@supabase/supabase-js'

// ============================================================================
// 📋 Props
// ============================================================================

interface AdminSidebarProps {
  user: User
}

// ============================================================================
// 📋 Navigation Items
// ============================================================================

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: ROUTES.admin,
    icon: LayoutDashboard,
  },
  {
    label: 'Events',
    href: ROUTES.adminEvents,
    icon: Calendar,
  },
  {
    label: 'Venues',
    href: ROUTES.adminVenues,
    icon: MapPin,
  },
  {
    label: 'Organizers',
    href: ROUTES.adminOrganizers,
    icon: Users,
  },
]

const SECONDARY_NAV_ITEMS = [
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: Bookmark,
  },
  {
    label: 'Tags',
    href: '/admin/tags',
    icon: Tags,
  },
]

// ============================================================================
// 📊 AdminSidebar Component
// ============================================================================

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === ROUTES.admin) {
      return pathname === ROUTES.admin
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-surface border-r border-border hidden lg:block">
      <div className="flex flex-col h-full">
        {/* ========================================
            🏠 Logo
            ======================================== */}
        <div className="p-6 border-b border-border">
          <Link href={ROUTES.admin} className="flex items-center gap-2">
            <span className="text-2xl">🗓️</span>
            <div>
              <span className="text-lg font-bold text-text-primary block">
                Happenlist
              </span>
              <span className="text-xs text-text-tertiary">Admin</span>
            </div>
          </Link>
        </div>

        {/* ========================================
            📍 Main Navigation
            ======================================== */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={<item.icon className="w-5 h-5" />}
              isActive={isActive(item.href)}
            >
              {item.label}
            </NavLink>
          ))}

          {/* Separator */}
          <div className="py-4">
            <hr className="border-border" />
          </div>

          {/* Secondary Nav */}
          {SECONDARY_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={<item.icon className="w-5 h-5" />}
              isActive={isActive(item.href)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* ========================================
            🔗 Footer Actions
            ======================================== */}
        <div className="p-4 border-t border-border space-y-1">
          <NavLink
            href={ROUTES.home}
            icon={<ExternalLink className="w-5 h-5" />}
            isActive={false}
            isExternal
          >
            View Site
          </NavLink>
          <form action={signOut}>
            <button
              type="submit"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg w-full',
                'text-body-sm font-medium text-left',
                'transition-colors duration-200',
                'text-text-secondary hover:bg-background hover:text-text-primary'
              )}
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}

// ============================================================================
// 🔗 NavLink Sub-Component
// ============================================================================

interface NavLinkProps {
  href: string
  icon: React.ReactNode
  isActive: boolean
  isExternal?: boolean
  children: React.ReactNode
}

function NavLink({
  href,
  icon,
  isActive,
  isExternal,
  children,
}: NavLinkProps) {
  const linkProps = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg',
        'text-body-sm font-medium',
        'transition-colors duration-200',
        isActive
          ? 'bg-primary-light text-primary-dark'
          : 'text-text-secondary hover:bg-background hover:text-text-primary'
      )}
      {...linkProps}
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}
