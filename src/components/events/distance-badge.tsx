/**
 * DISTANCE BADGE — shows distance from anchor point on event cards
 * =================================================================
 * Rendered when a geo anchor (neighborhood or user location) is active
 * and the event has a `distance_miles` value from the query layer.
 *
 * Design: small pill below the location line, using zinc text to stay
 * secondary to the main card content. Matches the visual weight of
 * the recurrence label row.
 *
 * Cross-file coupling:
 *   - src/components/events/event-card.tsx — mounts this when distance_miles is set
 *   - src/data/events/get-events.ts — populates distance_miles on EventCard
 */

import { Navigation } from 'lucide-react';

interface DistanceBadgeProps {
  /** Distance in miles, rounded to 2 decimal places by get-events.ts */
  miles: number;
  /** Optional CSS class override */
  className?: string;
}

/**
 * Format distance for display:
 *   - < 0.1 mi  → "Nearby"
 *   - < 1 mi    → "0.3 mi"
 *   - >= 1 mi   → "2.4 mi" (1 decimal)
 *   - >= 10 mi  → "12 mi" (no decimal)
 */
function formatDistance(miles: number): string {
  if (miles < 0.1) return 'Nearby';
  if (miles < 1) return `${miles.toFixed(1)} mi`;
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function DistanceBadge({ miles, className }: DistanceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] text-zinc ${className ?? ''}`}
      title={`${miles.toFixed(2)} miles away`}
    >
      <Navigation className="w-3 h-3" aria-hidden="true" />
      <span>{formatDistance(miles)}</span>
    </span>
  );
}
