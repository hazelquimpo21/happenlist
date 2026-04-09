/**
 * ADMIN LAYOUT
 * =============
 * Layout wrapper for all admin pages.
 * Includes sidebar navigation and main content area.
 */

import { Suspense } from 'react';
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

async function SidebarWithStats() {
  let pendingCount = 0;
  try {
    const stats = await getAdminStats();
    pendingCount = stats.pendingReviewCount;
  } catch (error) {
    console.error('Failed to fetch admin stats for sidebar:', error);
  }
  return <AdminSidebar pendingCount={pendingCount} />;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar — loads async, doesn't block page content */}
      <Suspense fallback={<AdminSidebar pendingCount={0} />}>
        <SidebarWithStats />
      </Suspense>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
