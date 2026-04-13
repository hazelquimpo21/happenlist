/**
 * PAST EVENT BANNER
 * =================
 * Subtle banner shown on event detail pages when the event has already passed.
 * Provides a contextual link to upcoming events from the same organizer, or
 * falls back to the main events page if no organizer exists.
 *
 * Mounted in: src/app/event/[slug]/page.tsx (conditionally, when instance_date < today)
 * Cross-file coupling: uses ROUTES from src/lib/constants/routes.ts
 *
 * @module components/events/past-event-banner
 */

import Link from 'next/link';
import { CalendarX } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

interface PastEventBannerProps {
  /** Organizer name (null if no organizer linked) */
  organizerName?: string | null;
  /** Organizer slug for building the link */
  organizerSlug?: string | null;
}

/**
 * Banner displayed at the top of past event detail pages.
 * Subtle bg-cloud styling — informational, not alarming.
 */
export function PastEventBanner({ organizerName, organizerSlug }: PastEventBannerProps) {
  const hasOrganizer = organizerName && organizerSlug;

  return (
    <div className="bg-cloud border border-mist rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
      <CalendarX className="w-5 h-5 text-zinc mt-0.5 shrink-0" />
      <div className="text-body-sm text-slate">
        <span className="font-semibold">This event has passed.</span>{' '}
        {hasOrganizer ? (
          <Link
            href={ROUTES.organizerDetail(organizerSlug)}
            className="text-blue hover:text-blue-dark underline underline-offset-2"
          >
            See upcoming events from {organizerName}
          </Link>
        ) : (
          <Link
            href={ROUTES.events}
            className="text-blue hover:text-blue-dark underline underline-offset-2"
          >
            Browse upcoming events
          </Link>
        )}
      </div>
    </div>
  );
}
