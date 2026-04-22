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

  const health = await scraperHealth();

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
            className={`inline-block w-2 h-2 rounded-full ${health.ok ? 'bg-emerald' : 'bg-red-500'}`}
            aria-hidden="true"
          />
          <span className={health.ok ? 'text-zinc' : 'text-red-700'}>
            {health.ok
              ? 'Scraper backend reachable'
              : `Scraper backend unreachable${health.message ? ` (${health.message})` : ''}. Check SCRAPER_API_URL.`}
          </span>
        </div>

        <ImportForm />
      </div>
    </div>
  );
}
