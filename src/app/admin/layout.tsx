/**
 * ADMIN LAYOUT
 * =============
 * Layout wrapper for all admin pages.
 * Includes sidebar navigation and main content area.
 */

import { AdminSidebar } from '@/components/admin';
import { getAdminStats } from '@/data/admin';

export const metadata = {
  title: {
    template: '%s | Happenlist Admin',
    default: 'Admin | Happenlist',
  },
  description: 'Happenlist administration dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch stats for sidebar badge
  let pendingCount = 0;
  try {
    const stats = await getAdminStats();
    pendingCount = stats.pendingReviewCount;
  } catch (error) {
    // Silently fail - sidebar will just show 0
    console.error('Failed to fetch admin stats for sidebar:', error);
  }

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Sidebar */}
      <AdminSidebar pendingCount={pendingCount} />

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
