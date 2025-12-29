// ============================================================================
// 📄 HAPPENLIST - Footer Component
// ============================================================================
// The site footer with links and branding.
// ============================================================================

import Link from 'next/link'
import { ROUTES } from '@/lib/constants'

// ============================================================================
// 📄 Footer Component
// ============================================================================

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ========================================
              🏠 Brand Column
              ======================================== */}
          <div className="md:col-span-2">
            <Link href={ROUTES.home} className="flex items-center gap-2">
              <span className="text-2xl">🗓️</span>
              <span className="text-xl font-bold text-text-primary">
                Happenlist
              </span>
            </Link>
            <p className="mt-4 text-body-sm text-text-secondary max-w-sm">
              Milwaukee's go-to events directory. Discover concerts, festivals,
              family activities, and more happening in your city.
            </p>
          </div>

          {/* ========================================
              🔗 Browse Links
              ======================================== */}
          <div>
            <h4 className="text-heading-sm text-text-primary mb-4">Browse</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={ROUTES.events}
                  className="text-body-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  All Events
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.venues}
                  className="text-body-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Venues
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.organizers}
                  className="text-body-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Organizers
                </Link>
              </li>
            </ul>
          </div>

          {/* ========================================
              ℹ️ Info Links
              ======================================== */}
          <div>
            <h4 className="text-heading-sm text-text-primary mb-4">Info</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-body-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-body-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.login}
                  className="text-body-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ========================================
            📝 Copyright
            ======================================== */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-body-sm text-text-tertiary text-center">
            &copy; {currentYear} Happenlist. Made with 💚 in Milwaukee.
          </p>
        </div>
      </div>
    </footer>
  )
}
