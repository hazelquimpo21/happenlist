// ============================================================================
// 🔒 HAPPENLIST - Admin Layout
// ============================================================================
// Layout for all admin pages with sidebar navigation.
// Requires authentication - protected by middleware.
// ============================================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { AdminHeader } from '@/components/layout/admin-header'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'

// ============================================================================
// 🔒 Admin Layout Component
// ============================================================================

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('🔒 Unauthorized access to admin, redirecting to login')
    redirect(ROUTES.login)
  }

  logger.debug('🔒 Admin layout rendered for user', { userId: user.id })

  return (
    <div className="min-h-screen bg-background">
      {/* ========================================
          📱 Mobile Header
          ======================================== */}
      <div className="lg:hidden">
        <AdminHeader user={user} />
      </div>

      {/* ========================================
          🖥️ Desktop Layout
          ======================================== */}
      <div className="flex">
        {/* Sidebar (hidden on mobile) */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
          <AdminSidebar user={user} />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64">
          {/* Desktop Header */}
          <div className="hidden lg:block sticky top-0 z-40 bg-surface border-b border-border">
            <AdminHeader user={user} />
          </div>

          {/* Page Content */}
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
