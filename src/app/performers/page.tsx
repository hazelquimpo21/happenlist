/**
 * PERFORMERS DIRECTORY PAGE
 * =========================
 * Browse all performers with search and genre filtering.
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Mic2, Calendar, Search } from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { getPerformers, getPerformerGenres } from '@/data/performers';

export const metadata: Metadata = {
  title: 'Performers',
  description: 'Browse artists, DJs, speakers, comedians, and more performing at Milwaukee events.',
};

interface PerformersPageProps {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    page?: string;
  }>;
}

export default async function PerformersPage({ searchParams }: PerformersPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.q?.trim() || '';
  const genreFilter = params.genre || '';

  const [{ performers, total }, genres] = await Promise.all([
    getPerformers({ search: search || undefined, genre: genreFilter || undefined, page, limit: 24 }),
    getPerformerGenres(),
  ]);

  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[{ label: 'Performers' }]}
        className="mb-6"
      />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-body text-h1 text-ink mb-2">Performers</h1>
        <p className="text-zinc text-body">
          {total} {total === 1 ? 'artist' : 'artists'} performing at Milwaukee events
        </p>
      </div>

      {/* Search */}
      <form action="/performers" method="get" className="max-w-md mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc" />
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Search performers..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-mist bg-pure text-ink placeholder:text-zinc/60 focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
          />
          {genreFilter && <input type="hidden" name="genre" value={genreFilter} />}
        </div>
      </form>

      {/* Genre filter chips */}
      {genres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href={`/performers${search ? `?q=${encodeURIComponent(search)}` : ''}`}
            className={`px-4 py-2 rounded-full text-body-sm font-medium transition-all ${
              !genreFilter
                ? 'bg-ink text-pure shadow-sm'
                : 'bg-cloud/50 text-ink hover:bg-cloud border border-mist'
            }`}
          >
            All
          </Link>
          {genres.slice(0, 12).map((genre) => (
            <Link
              key={genre}
              href={`/performers?genre=${encodeURIComponent(genre)}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
              className={`px-4 py-2 rounded-full text-body-sm font-medium transition-all ${
                genreFilter === genre
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200'
              }`}
            >
              {genre}
            </Link>
          ))}
        </div>
      )}

      {/* Performer grid */}
      {performers.length === 0 ? (
        <div className="text-center py-16">
          <Mic2 className="w-12 h-12 text-zinc/40 mx-auto mb-4" />
          <h2 className="font-body text-h3 text-ink mb-2">
            No performers found
          </h2>
          <p className="text-zinc mb-6">
            {search
              ? `No performers match "${search}". Try a different search term.`
              : 'Check back soon for performers!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {performers.map((performer) => (
            <Link
              key={performer.id}
              href={`/performer/${performer.slug}`}
              className="group p-4 rounded-xl bg-pure border border-mist hover:shadow-card-lifted hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {performer.image_url ? (
                    <Image
                      src={performer.image_url}
                      alt={performer.name}
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  ) : (
                    <Mic2 className="w-6 h-6 text-purple-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink group-hover:text-blue transition-colors truncate">
                    {performer.name}
                  </p>
                  {performer.genre && (
                    <p className="text-xs text-zinc truncate">{performer.genre}</p>
                  )}
                </div>
              </div>
              {performer.upcoming_event_count > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-zinc">
                  <Calendar className="w-3.5 h-3.5" />
                  {performer.upcoming_event_count} upcoming {performer.upcoming_event_count === 1 ? 'event' : 'events'}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 24 && (
        <div className="mt-12 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/performers?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ''}${genreFilter ? `&genre=${encodeURIComponent(genreFilter)}` : ''}`}
              className="px-4 py-2 rounded-md bg-cloud text-ink hover:bg-blue-light transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-zinc">
            Page {page} of {Math.ceil(total / 24)}
          </span>
          {page * 24 < total && (
            <Link
              href={`/performers?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ''}${genreFilter ? `&genre=${encodeURIComponent(genreFilter)}` : ''}`}
              className="px-4 py-2 rounded-md bg-cloud text-ink hover:bg-blue-light transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </Container>
  );
}
