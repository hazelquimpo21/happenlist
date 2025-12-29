// ============================================================================
// 🚫 HAPPENLIST - 404 Not Found Page
// ============================================================================
// Displayed when a page is not found within public routes.
// ============================================================================

import Link from 'next/link'
import { Search, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui'
import { ROUTES } from '@/lib/constants'

// ============================================================================
// 🚫 Not Found Page Component
// ============================================================================

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16">
      <div className="page-container text-center">
        {/* 404 Visual */}
        <div className="mb-8">
          <span className="text-8xl font-bold text-primary/20">404</span>
        </div>

        {/* Message */}
        <h1 className="text-heading-lg font-bold text-text-primary">
          Page Not Found
        </h1>
        <p className="mt-4 text-body-md text-text-secondary max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have
          been moved, deleted, or never existed.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href={ROUTES.home}>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>

          <Button asChild variant="secondary">
            <Link href={ROUTES.events}>
              <Search className="w-4 h-4 mr-2" />
              Browse Events
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
