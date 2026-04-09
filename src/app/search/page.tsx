/**
 * SEARCH PAGE
 * ===========
 * Search for events, venues, and organizers.
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Container, Breadcrumbs } from '@/components/layout';
import { EventGrid, SectionHeader } from '@/components/events';
import { SearchBar } from '@/components/search';
import { getEvents } from '@/data/events';
import { getVenues } from '@/data/venues';
import { getOrganizers } from '@/data/organizers';
import { getPerformers } from '@/data/performers';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, User, Calendar, Mic2 } from 'lucide-react';
import { buildVenueUrl, buildOrganizerUrl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search for events, venues, and organizers.',
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

/**
 * Search results page.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || '';

  console.log('🔍 [SearchPage] Rendering search page with query:', query);

  // If no query, show just the search bar
  if (!query) {
    return (
      <Container className="py-8">
        <Breadcrumbs items={[{ label: 'Search' }]} className="mb-6" />

        {/* Page header */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h1 className="font-body text-h1 text-ink mb-4">
            Search
          </h1>
          <p className="text-zinc text-body mb-8">
            Find events, venues, and organizers
          </p>
          <SearchBar size="lg" autoFocus />
        </div>

        {/* Popular suggestions */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <p className="text-body-sm text-zinc mb-4">Popular searches:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['music', 'art', 'food', 'comedy', 'free events'].map((term) => (
              <a
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="px-4 py-2 rounded-full bg-cloud text-ink text-body-sm hover:bg-blue-light transition-colors"
              >
                {term}
              </a>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  // Fetch results from all sources in parallel
  const [eventsResult, venuesResult, organizersResult, performersResult] = await Promise.all([
    getEvents({ search: query, limit: 12 }),
    getVenues({ search: query, limit: 6 }),
    getOrganizers({ search: query, limit: 6 }),
    getPerformers({ search: query, limit: 6 }),
  ]);

  const totalResults =
    eventsResult.total + venuesResult.total + organizersResult.total + performersResult.total;

  console.log(
    `✅ [SearchPage] Found ${totalResults} results (${eventsResult.total} events, ${venuesResult.total} venues, ${organizersResult.total} organizers, ${performersResult.total} performers)`
  );

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: 'Search' }]} className="mb-6" />

      {/* Search header */}
      <div className="max-w-2xl mx-auto mb-12">
        <SearchBar initialValue={query} size="lg" />
        <p className="text-zinc text-body-sm mt-4 text-center">
          {totalResults} {totalResults === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
        </p>
      </div>

      {/* No results */}
      {totalResults === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-zinc/40 mx-auto mb-4" />
          <h2 className="font-body text-h3 text-ink mb-2">
            No results found
          </h2>
          <p className="text-zinc mb-6">
            Try a different search term or browse our events.
          </p>
          <Link
            href="/events"
            className="inline-block px-6 py-3 rounded-md bg-blue text-pure font-medium hover:bg-blue-dark transition-colors"
          >
            Browse Events
          </Link>
        </div>
      )}

      {/* Events results */}
      {eventsResult.events.length > 0 && (
        <section className="mb-12">
          <SectionHeader
            title="Events"
            subtitle={`${eventsResult.total} events found`}
            action={
              eventsResult.total > 12 ? (
                <a
                  href={`/events?q=${encodeURIComponent(query)}`}
                  className="text-blue hover:text-orange-dark transition-colors"
                >
                  View all {eventsResult.total} events
                </a>
              ) : undefined
            }
          />
          <EventGrid events={eventsResult.events} columns={4} />
        </section>
      )}

      {/* Performers results */}
      {performersResult.performers.length > 0 && (
        <section className="mb-12">
          <SectionHeader
            title="Performers"
            subtitle={`${performersResult.total} performers found`}
            action={
              performersResult.total > 6 ? (
                <a
                  href={`/performers?q=${encodeURIComponent(query)}`}
                  className="text-blue hover:text-orange-dark transition-colors"
                >
                  View all performers
                </a>
              ) : undefined
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performersResult.performers.map((performer) => (
              <Link
                key={performer.id}
                href={`/performer/${performer.slug}`}
                className="flex items-center gap-3 p-4 rounded-lg bg-pure border border-mist hover:shadow-card-hover transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {performer.image_url ? (
                    <Image
                      src={performer.image_url}
                      alt={performer.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <Mic2 className="w-5 h-5 text-purple-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-ink">{performer.name}</p>
                  {performer.genre && (
                    <p className="text-body-sm text-zinc">{performer.genre}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Venues results */}
      {venuesResult.venues.length > 0 && (
        <section className="mb-12">
          <SectionHeader
            title="Venues"
            subtitle={`${venuesResult.total} venues found`}
            action={
              venuesResult.total > 6 ? (
                <a
                  href={`/venues?q=${encodeURIComponent(query)}`}
                  className="text-blue hover:text-orange-dark transition-colors"
                >
                  View all venues
                </a>
              ) : undefined
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venuesResult.venues.map((venue) => (
              <Link
                key={venue.id}
                href={buildVenueUrl(venue)}
                className="flex items-center gap-3 p-4 rounded-lg bg-pure border border-mist hover:shadow-card-hover transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-emerald/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-emerald" />
                </div>
                <div>
                  <p className="font-medium text-ink">{venue.name}</p>
                  {venue.city && (
                    <p className="text-body-sm text-zinc">
                      {venue.city}, {venue.state}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Organizers results */}
      {organizersResult.organizers.length > 0 && (
        <section className="mb-12">
          <SectionHeader
            title="Organizers"
            subtitle={`${organizersResult.total} organizers found`}
            action={
              organizersResult.total > 6 ? (
                <a
                  href={`/organizers?q=${encodeURIComponent(query)}`}
                  className="text-blue hover:text-orange-dark transition-colors"
                >
                  View all organizers
                </a>
              ) : undefined
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizersResult.organizers.map((organizer) => (
              <Link
                key={organizer.id}
                href={buildOrganizerUrl(organizer)}
                className="flex items-center gap-3 p-4 rounded-lg bg-pure border border-mist hover:shadow-card-hover transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-blue/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue" />
                </div>
                <div>
                  <p className="font-medium text-ink">{organizer.name}</p>
                  {organizer.description && (
                    <p className="text-body-sm text-zinc line-clamp-1">
                      {organizer.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
