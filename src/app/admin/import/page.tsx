/**
 * SUPERADMIN IMPORT PAGE
 * =======================
 * Entry point for importing events via the Render-hosted scraper backend:
 * - URL mode: paste an event page URL, scraper fetches + extracts.
 * - Text mode: paste raw text (flyer, email, season lineup) + optional source URL.
 *
 * Imported events land in `pending_review`. The superadmin reviews them via
 * /admin/events/pending before publishing.
 *
 * @module app/admin/import
 */

import { redirect } from 'next/navigation';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { getSession } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/auth/is-superadmin';
import { scraperHealth } from '@/lib/scraper/client';
import { getCategories } from '@/data/categories';
import { ImportForm } from './import-form';

export const metadata = {
  title: 'Import Events',
};

export default async function AdminImportPage() {
  const { session } = await getSession();
  if (!session) {
    redirect('/auth/login?redirect=/admin/import');
  }
  if (!isSuperAdmin(session.email)) {
    redirect('/admin');
  }

  // Fetch both in parallel — categories drive the inline category picker in
  // the preview step, health drives the status dot.
  const [health, categoriesResult] = await Promise.allSettled([
    scraperHealth(),
    getCategories(),
  ]);
  const healthValue = health.status === 'fulfilled' ? health.value : { ok: false, message: 'check failed' };
  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Import Events"
        description="Pull events into pending review via the scraper backend. Paste a URL or text."
      />

      <div className="px-8 py-6">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Import' },
          ]}
        />

        {/* Health status */}
        <div className="mt-4 mb-6 flex items-center gap-2 text-sm">
          <span
            className={`inline-block w-2 h-2 rounded-full ${healthValue.ok ? 'bg-emerald' : 'bg-red-500'}`}
            aria-hidden="true"
          />
          <span className={healthValue.ok ? 'text-zinc' : 'text-red-700'}>
            {healthValue.ok
              ? 'Scraper backend reachable'
              : `Scraper backend unreachable${healthValue.message ? ` (${healthValue.message})` : ''}. Check SCRAPER_API_URL.`}
          </span>
        </div>

        <ImportForm categories={categories} />
      </div>
    </div>
  );
}
