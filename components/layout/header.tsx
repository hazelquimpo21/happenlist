// ============================================================================
// 🔝 HAPPENLIST - Header Component
// ============================================================================
// The main site header with logo, navigation, and search.
// Responsive design with mobile menu support.
// ============================================================================

import Link from 'next/link'
import { Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui'
import { ROUTES } from '@/lib/constants'

// ============================================================================
// 📋 Header Props
// ============================================================================

export interface HeaderProps {
  /** Show the mobile menu toggle */
  showMobileMenu?: boolean
}

// ============================================================================
// 🔝 Header Component
// ============================================================================

export function Header({ showMobileMenu = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* ========================================
              🏠 Logo & Brand
              ======================================== */}
          <div className="flex items-center gap-8">
            <Link
              href={ROUTES.home}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">🗓️</span>
              <span className="text-xl font-bold text-text-primary">
                Happenlist
              </span>
            </Link>

            {/* ========================================
                📍 Navigation (Desktop)
                ======================================== */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href={ROUTES.events}
                className="text-body-md text-text-secondary hover:text-text-primary transition-colors"
              >
                Events
              </Link>
              <Link
                href={ROUTES.venues}
                className="text-body-md text-text-secondary hover:text-text-primary transition-colors"
              >
                Venues
              </Link>
              <Link
                href={ROUTES.organizers}
                className="text-body-md text-text-secondary hover:text-text-primary transition-colors"
              >
                Organizers
              </Link>
            </nav>
          </div>

          {/* ========================================
              🔍 Search & Actions
              ======================================== */}
          <div className="flex items-center gap-4">
            {/* Search Button (Desktop) */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="w-5 h-5" />
              <span className="sr-only">Search events</span>
            </Button>

            {/* Mobile Menu Button */}
            {showMobileMenu && (
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            )}

            {/* Search Button (Mobile) */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="w-5 h-5" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
