/**
 * SEARCH PAGE
 * ===========
 * Search for events, venues, and organizers.
 */

import type { Metadata } from 'next';
import { Container, Breadcrumbs } from '@/components/layout';
import { EventGrid, SectionHeader } from '@/components/events';
import { SearchBar } from '@/components/search';
import { getEvents } from '@/data/events';
import { getVenues } from '@/data/venues';
import { getOrganizers } from '@/data/organizers';
import Link from 'next/link';
import { MapPin, User, Calendar } from 'lucide-react';
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
          <h1 className="font-display text-h1 text-charcoal mb-4">
            Search
          </h1>
          <p className="text-stone text-body mb-8">
            Find events, venues, and organizers
          </p>
          <SearchBar size="lg" autoFocus />
        </div>

        {/* Popular suggestions */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <p className="text-body-sm text-stone mb-4">Popular searches:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['music', 'art', 'food', 'comedy', 'free events'].map((term) => (
              <a
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="px-4 py-2 rounded-full bg-sand text-charcoal text-body-sm hover:bg-coral-light transition-colors"
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
  const [eventsResult, venuesResult, organizersResult] = await Promise.all([
    getEvents({ search: query, limit: 12 }),
    getVenues({ search: query, limit: 6 }),
    getOrganizers({ search: query, limit: 6 }),
  ]);

  const totalResults =
    eventsResult.total + venuesResult.total + organizersResult.total;

  console.log(
    `✅ [SearchPage] Found ${totalResults} results (${eventsResult.total} events, ${venuesResult.total} venues, ${organizersResult.total} organizers)`
  );

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: 'Search' }]} className="mb-6" />

      {/* Search header */}
      <div className="max-w-2xl mx-auto mb-12">
        <SearchBar initialValue={query} size="lg" />
        <p className="text-stone text-body-sm mt-4 text-center">
          {totalResults} {totalResults === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
        </p>
      </div>

      {/* No results */}
      {totalResults === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-stone/40 mx-auto mb-4" />
          <h2 className="font-display text-h3 text-charcoal mb-2">
            No results found
          </h2>
          <p className="text-stone mb-6">
            Try a different search term or browse our events.
          </p>
          <a
            href="/events"
            className="inline-block px-6 py-3 rounded-md bg-coral text-warm-white font-medium hover:bg-coral-dark transition-colors"
          >
            Browse Events
          </a>
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
                  className="text-coral hover:text-coral-dark transition-colors"
                >
                  View all {eventsResult.total} events
                </a>
              ) : undefined
            }
          />
          <EventGrid events={eventsResult.events} columns={4} />
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
                  className="text-coral hover:text-coral-dark transition-colors"
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
                className="flex items-center gap-3 p-4 rounded-lg bg-warm-white border border-sand hover:shadow-card-hover transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-sage" />
                </div>
                <div>
                  <p className="font-medium text-charcoal">{venue.name}</p>
                  {venue.city && (
                    <p className="text-body-sm text-stone">
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
                  className="text-coral hover:text-coral-dark transition-colors"
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
                className="flex items-center gap-3 p-4 rounded-lg bg-warm-white border border-sand hover:shadow-card-hover transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-coral/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-coral" />
                </div>
                <div>
                  <p className="font-medium text-charcoal">{organizer.name}</p>
                  {organizer.description && (
                    <p className="text-body-sm text-stone line-clamp-1">
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
