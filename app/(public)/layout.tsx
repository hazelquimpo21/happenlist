// ============================================================================
// 🌐 HAPPENLIST - Public Layout
// ============================================================================
// Layout for all public-facing pages with header and footer.
// This layout is applied to all routes within the (public) group.
// ============================================================================

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

// ============================================================================
// 🎨 Public Layout Component
// ============================================================================

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ========================================
          🔝 Site Header
          ======================================== */}
      <Header />

      {/* ========================================
          📄 Main Content Area
          ======================================== */}
      <main className="flex-1">{children}</main>

      {/* ========================================
          📄 Site Footer
          ======================================== */}
      <Footer />
    </div>
  )
}
