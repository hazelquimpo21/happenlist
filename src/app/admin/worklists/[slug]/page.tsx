/**
 * WORKLIST DETAIL PAGE
 * ====================
 * Renders the events flagged by a single worklist slug. Each row deep-links
 * to the admin event page so the operator can fix the issue in one click.
 *
 * Data: getWorklistItems() + getWorklistMeta() from src/data/admin/get-worklists.ts.
 *
 * @module app/admin/worklists/[slug]
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatMKEPattern } from '@/lib/utils/dates';
import { AlertTriangle, ExternalLink, ChevronLeft } from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { Card } from '@/components/ui/card';
import {
  WORKLISTS,
  getWorklistMeta,
  getWorklistItems,
  type WorklistSlug,
} from '@/data/admin';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Pre-render all known worklist slugs — cheap (5 pages) and safer than
// accepting arbitrary strings through to the data layer.
export function generateStaticParams() {
  return WORKLISTS.map((w) => ({ slug: w.slug }));
}

export default async function WorklistDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Runtime guard — even with generateStaticParams, the router might route an
  // unknown slug through if someone crafts a URL.
  const meta = getWorklistMeta(slug as WorklistSlug);
  if (!meta) notFound();

  const items = await getWorklistItems(slug as WorklistSlug, 100);

  return (
    <div className="min-h-screen">
      <AdminHeader title={meta.title} description={meta.description} />

      <div className="px-8 py-6 space-y-6">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Worklists', href: '/admin/worklists' },
            { label: meta.title },
          ]}
        />

        <Card padding="lg" className="border border-mist">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-body text-xl text-ink">
                {items.length} event{items.length === 1 ? '' : 's'}
              </h2>
              <code className="text-xs text-zinc/70">{meta.predicate}</code>
            </div>
            <Link
              href="/admin/worklists"
              className="text-sm text-blue hover:underline flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> All worklists
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center text-zinc">
              <p className="font-medium text-ink">All clean — nothing to fix.</p>
              <p className="text-sm mt-1">This worklist is empty.</p>
            </div>
          ) : (
            <div className="divide-y divide-mist border border-mist rounded-lg overflow-hidden">
              {items.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/admin/events/${ev.id}`}
                  className="flex items-start gap-4 p-4 hover:bg-cloud/50 transition-colors"
                >
                  <div className="w-16 h-16 rounded bg-cloud flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {ev.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ev.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-silver" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-ink line-clamp-1">{ev.title}</div>
                    <div className="text-sm text-zinc mt-0.5">
                      {formatMKEPattern(ev.start_datetime, 'MMM d, yyyy · h:mma')}
                      {ev.location_name && ` · ${ev.location_name}`}
                      {ev.category_name && ` · ${ev.category_name}`}
                    </div>
                    {ev.short_description && (
                      <p className="text-sm text-zinc/80 line-clamp-1 mt-1">
                        {ev.short_description}
                      </p>
                    )}
                  </div>

                  <ExternalLink className="w-4 h-4 text-silver flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
