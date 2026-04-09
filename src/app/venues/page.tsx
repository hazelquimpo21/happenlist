/**
 * VENUES INDEX PAGE
 * =================
 * Lists all venues with their event counts.
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui';
import { getVenues } from '@/data/venues';
import { buildVenueUrl, getBestImageUrl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Venues',
  description: 'Explore event venues. Find concerts halls, theaters, parks, and community spaces.',
};

interface VenuesPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

/**
 * Venues listing page.
 */
export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const params = await searchParams;

  console.log('🏛️ [VenuesPage] Rendering venues page');

  const page = parseInt(params.page || '1', 10);

  const { venues, total } = await getVenues({
    search: params.q,
    page,
    limit: 24,
  });

  console.log(`✅ [VenuesPage] Found ${venues.length} venues`);

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: 'Venues' }]}
        className="mb-6"
      />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-body text-h1 text-ink">Venues</h1>
        <p className="text-zinc text-body mt-2">
          {total} {total === 1 ? 'venue' : 'venues'} to explore
        </p>
      </div>

      {/* Venues grid */}
      {venues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <Link key={venue.id} href={buildVenueUrl(venue)}>
              <Card
                className="h-full hover:shadow-card-hover transition-shadow overflow-hidden"
                padding="none"
              >
                {(() => {
                  const img = getBestImageUrl(venue.image_url, venue.external_image_url);
                  return img ? (
                    <div className="relative h-32 w-full">
                      <Image
                        src={img}
                        alt={venue.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-full bg-emerald/10 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-emerald/40" />
                    </div>
                  );
                })()}
                <div className="p-4">
                  <h2 className="font-body text-h4 text-ink group-hover:text-blue transition-colors">
                    {venue.name}
                  </h2>
                  {venue.address_line && (
                    <p className="text-body-sm text-zinc mt-1">
                      {venue.address_line}
                    </p>
                  )}
                  {venue.city && (
                    <p className="text-body-sm text-zinc">
                      {venue.city}, {venue.state}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-zinc/40 mx-auto mb-4" />
          <h2 className="font-body text-h3 text-ink mb-2">
            No venues found
          </h2>
          <p className="text-zinc">
            Check back soon for venue listings!
          </p>
        </div>
      )}

      {/* Pagination */}
      {total > 24 && (
        <div className="mt-12 flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/venues?page=${page - 1}`}
              className="px-4 py-2 rounded-md bg-cloud text-ink hover:bg-blue-light transition-colors"
            >
              Previous
            </a>
          )}
          <span className="px-4 py-2 text-zinc">
            Page {page} of {Math.ceil(total / 24)}
          </span>
          {page * 24 < total && (
            <a
              href={`/venues?page=${page + 1}`}
              className="px-4 py-2 rounded-md bg-cloud text-ink hover:bg-blue-light transition-colors"
            >
              Next
            </a>
          )}
        </div>
      )}
    </Container>
  );
}
