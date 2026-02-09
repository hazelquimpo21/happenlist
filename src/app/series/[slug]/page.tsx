/**
 * SERIES DETAIL PAGE
 * ==================
 * Shows full series details with list of events.
 *
 * URL: /series/[slug]
 * Example: /series/pottery-101-spring-2025
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Container, Breadcrumbs } from '@/components/layout';
import {
  SeriesHeader,
  SeriesEventsList,
  SeriesDetailSkeleton,
} from '@/components/series';
import { SeriesGrid } from '@/components/series';
import { getSeriesBySlug, getSeriesEvents, getRelatedSeries } from '@/data/series';
import { SeriesJsonLd } from './series-json-ld';

// ============================================================================
// PAGE PROPS
// ============================================================================

interface SeriesDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// ============================================================================
// METADATA
// ============================================================================

/**
 * Generate dynamic metadata based on series data.
 */
export async function generateMetadata({
  params,
}: SeriesDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  const series = await getSeriesBySlug(slug);

  if (!series) {
    return {
      title: 'Series Not Found',
    };
  }

  return {
    title: series.meta_title || series.title,
    description: series.meta_description || series.short_description || series.description?.slice(0, 155),
    openGraph: {
      title: series.title,
      description: series.short_description || series.description || undefined,
      images: series.image_url ? [series.image_url] : undefined,
      type: 'website',
    },
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

/**
 * Series detail page.
 * Shows header, description, event list, and related series.
 */
export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const { slug } = await params;

  console.log(`📖 [SeriesDetailPage] Rendering series: ${slug}`);

  // Fetch series data
  const series = await getSeriesBySlug(slug);

  // 404 if not found
  if (!series) {
    console.log(`⚠️ [SeriesDetailPage] Series not found: ${slug}`);
    notFound();
  }

  // Fetch events and related series in parallel
  const [events, relatedSeries] = await Promise.all([
    getSeriesEvents(series.id, true), // Include past events
    getRelatedSeries({
      categoryId: series.category_id || undefined,
      organizerId: series.organizer_id || undefined,
      excludeSeriesId: series.id,
      limit: 4,
    }),
  ]);

  console.log(`✅ [SeriesDetailPage] Loaded series: ${series.title} with ${events.length} events`);

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Classes & Series', href: '/series' },
    ...(series.category
      ? [
          {
            label: series.category.name,
            href: `/series?category=${series.category.slug}`,
          },
        ]
      : []),
    { label: series.title },
  ];

  return (
    <>
      {/* Structured data for SEO */}
      <SeriesJsonLd series={series} events={events} />

      <Container className="py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        {/* Series header (hero section) */}
        <SeriesHeader series={series} className="mb-12" />

        {/* Description */}
        {series.description && (
          <section className="mb-12">
            <h2 className="font-display text-h2 text-charcoal mb-4">About</h2>
            <div
              className="prose prose-stone max-w-none"
              dangerouslySetInnerHTML={{ __html: formatDescription(series.description) }}
            />
          </section>
        )}

        {/* Events list */}
        <SeriesEventsList
          events={events}
          title="Sessions"
          showPast
          className="mb-12"
        />

        {/* Organizer info (if has description) */}
        {series.organizer?.description && (
          <section className="mb-12 p-6 bg-cream rounded-lg">
            <h2 className="font-display text-h3 text-charcoal mb-3">
              About the Organizer
            </h2>
            <p className="text-body text-stone">{series.organizer.description}</p>
          </section>
        )}

        {/* Related series */}
        {relatedSeries.length > 0 && (
          <section>
            <h2 className="font-display text-h2 text-charcoal mb-6">
              Similar Series
            </h2>
            <SeriesGrid
              series={relatedSeries.map(transformToCard)}
              columns={4}
            />
          </section>
        )}
      </Container>
    </>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert plain text to HTML with paragraphs.
 */
function formatDescription(text: string): string {
  return text
    .split('\n\n')
    .map((p) => `<p>${p.replace(/\n/g, '<br />')}</p>`)
    .join('');
}

/**
 * Transform SeriesWithDetails to SeriesCard format for the grid.
 */
function transformToCard(series: Awaited<ReturnType<typeof getRelatedSeries>>[0]) {
  return {
    id: series.id,
    title: series.title,
    slug: series.slug,
    short_description: series.short_description,
    series_type: series.series_type as 'class' | 'camp' | 'workshop' | 'recurring' | 'festival' | 'season',
    total_sessions: series.total_sessions,
    sessions_remaining: series.sessions_remaining,
    start_date: series.start_date,
    end_date: series.end_date,
    image_url: series.image_url,
    thumbnail_url: series.thumbnail_url,
    price_type: series.price_type,
    price_low: series.price_low,
    price_high: series.price_high,
    is_free: series.is_free,
    heart_count: series.heart_count,
    category_name: series.category?.name || null,
    category_slug: series.category?.slug || null,
    location_name: series.location?.name || null,
    location_slug: series.location?.slug || null,
    organizer_name: series.organizer?.name || null,
    organizer_slug: series.organizer?.slug || null,
  };
}
