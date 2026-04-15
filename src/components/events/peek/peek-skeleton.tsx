/**
 * PEEK SKELETON — loading state
 * =====================================================================
 * Shown while the peek fetch is in flight. Matches the EventPeek
 * layout so the transition from skeleton → real content doesn't jump.
 *
 * Kept intentionally simple — no shimmer, just muted blocks. Skeletons
 * that try too hard feel worse than plain ones.
 * =====================================================================
 */

'use client';

import { PEEK_LAYOUT } from '@/lib/constants/event-peek';

export function PeekSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Hero block */}
      <div className={`${PEEK_LAYOUT.heroAspect} bg-mist flex-shrink-0`} />

      {/* Body */}
      <div className="flex-1 px-5 py-4 space-y-4">
        <div className="h-4 w-32 bg-mist rounded" />
        <div className="h-6 w-3/4 bg-mist rounded" />
        <div className="h-4 w-1/2 bg-mist rounded" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-cloud rounded" />
          <div className="h-3 w-full bg-cloud rounded" />
          <div className="h-3 w-5/6 bg-cloud rounded" />
        </div>
      </div>

      {/* CTA footer */}
      <div className="flex-shrink-0 border-t border-mist px-5 py-3 flex gap-2">
        <div className="flex-1 h-11 bg-mist rounded-lg" />
        <div className="flex-1 h-11 bg-cloud rounded-lg" />
      </div>
    </div>
  );
}
