/**
 * PERFORMER DETAIL PAGE
 * =====================
 * Individual performer profile with their events.
 */

export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import {
  Mic2,
  Globe,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { Button } from '@/components/ui';
import { EventGrid, SectionHeader } from '@/components/events';
import { getPerformer, getPerformerEvents } from '@/data/performers';

interface PerformerPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate metadata for the performer page.
 */
export async function generateMetadata({
  params,
}: PerformerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const performer = await getPerformer({ slug });

  if (!performer) {
    return { title: 'Performer Not Found' };
  }

  const description = performer.bio ||
    `Events featuring ${performer.name}. Find upcoming shows and performances.`;

  return {
    title: performer.name,
    description,
    openGraph: {
      title: performer.name,
      description,
      images: performer.image_url ? [performer.image_url] : undefined,
    },
  };
}

/**
 * Performer detail page.
 */
export default async function PerformerPage({ params }: PerformerPageProps) {
  const { slug } = await params;

  console.log('🎤 [PerformerPage] Rendering performer:', slug);

  const performer = await getPerformer({ slug });

  if (!performer) {
    console.log('⚠️ [PerformerPage] Performer not found');
    notFound();
  }

  // Fetch events
  const { upcoming, past } = await getPerformerEvents(performer.id);

  console.log('✅ [PerformerPage] Performer loaded:', performer.name);

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Performers', href: '/performers' },
          { label: performer.name },
        ]}
        className="mb-6"
      />

      {/* Performer header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Profile section */}
          <div className="flex items-start gap-6 mb-8">
            {/* Image */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {performer.image_url ? (
                <Image
                  src={performer.image_url}
                  alt={performer.name}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              ) : (
                <Mic2 className="w-12 h-12 text-purple-500" />
              )}
            </div>

            {/* Info */}
            <div>
              {performer.genre && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 mb-3">
                  {performer.genre}
                </span>
              )}
              <h1 className="font-body text-h1 text-ink">
                {performer.name}
              </h1>
            </div>
          </div>

          {/* Bio */}
          {performer.bio && (
            <div className="mb-8">
              <h2 className="font-body text-h3 text-ink mb-4">
                About
              </h2>
              <div className="prose-event whitespace-pre-wrap">
                {performer.bio}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Links card */}
            {performer.website_url && (
              <div className="p-6 bg-pure rounded-lg border border-mist">
                <h3 className="font-body text-h4 text-ink mb-4">
                  Links
                </h3>
                <div className="flex items-start gap-3 mb-4">
                  <Globe className="w-5 h-5 text-blue mt-0.5" />
                  <div>
                    <p className="font-medium text-ink">Website</p>
                    <a
                      href={performer.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-sm text-blue hover:text-orange-dark transition-colors"
                    >
                      Visit website
                    </a>
                  </div>
                </div>
                <Button
                  href={performer.website_url}
                  external
                  fullWidth
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Visit Website
                </Button>
              </div>
            )}

            {/* Stats card */}
            <div className="p-6 bg-pure rounded-lg border border-mist">
              <div className="text-center">
                <p className="font-body text-h2 text-blue">{upcoming.length}</p>
                <p className="text-body-sm text-zinc">
                  {upcoming.length === 1 ? 'Upcoming Event' : 'Upcoming Events'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <section className="mb-12">
        <SectionHeader
          title="Upcoming Events"
          subtitle={`Catch ${performer.name} live`}
        />
        <EventGrid
          events={upcoming}
          columns={4}
          emptyTitle="No upcoming events"
          emptyMessage={`Check back soon for upcoming events featuring ${performer.name}!`}
        />
      </section>

      {/* Past Events (collapsed by default) */}
      {past.length > 0 && (
        <section>
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer mb-6 list-none">
              <h2 className="font-body text-h3 text-ink">
                Past Events
              </h2>
              <span className="text-body-sm text-zinc">({past.length})</span>
              <ChevronDown className="w-5 h-5 text-zinc transition-transform group-open:rotate-180" />
            </summary>
            <EventGrid events={past} columns={4} />
          </details>
        </section>
      )}
    </Container>
  );
}
