/**
 * PEEK HOST — mounts the peek sheet globally
 * =====================================================================
 * Reads the peek context and renders `<EventPeekSheet>` when a peek
 * is open. Handles three render paths:
 *
 *   1. Loaded              → full peek content
 *   2. Error               → small error sheet (with "Close" button)
 *   3. Loading with stub   → peek populated from card data (instant)
 *   4. Loading without stub → skeleton (rare — popstate re-entry only)
 *
 * WHY THE STUB PATH MATTERS:
 *   On a typical tap-from-card, we already have title/image/date. We
 *   render those immediately and only fade CTAs + description in once
 *   the full fetch completes. Users perceive the peek as instantaneous.
 *
 * CROSS-FILE COUPLING:
 *   - src/app/layout.tsx                     — mounts this
 *   - src/contexts/peek-context.tsx          — source of truth
 *   - src/components/events/peek/event-peek-sheet.tsx  — the chrome
 *   - src/components/events/peek/event-peek.tsx         — content
 *   - src/lib/utils/card-to-peek.ts          — stub adapter
 * =====================================================================
 */

'use client';

import { usePeek } from '@/contexts/peek-context';
import { EventPeekSheet } from './event-peek-sheet';
import { PeekSkeleton } from './peek-skeleton';
import { cardToPeekStub } from '@/lib/utils/card-to-peek';

export function PeekHost() {
  const { data, isOpen, closePeek } = usePeek();

  // Nothing to render until a peek has been requested.
  if (!isOpen || !data) return null;

  const handleOpenChange = (next: boolean) => {
    if (!next) closePeek();
  };

  // Fetch failed — render a minimal error sheet.
  if (data.error) {
    return (
      <EventPeekSheet.Error
        message={data.error}
        open={isOpen}
        onOpenChange={handleOpenChange}
      />
    );
  }

  // Navigation-aware close — peek CTAs call this so closePeek doesn't
  // race the outgoing link navigation with history.back().
  const handleNavigate = () => closePeek({ forNavigation: true });

  // Loaded — render the real content.
  if (data.event) {
    return (
      <EventPeekSheet
        event={data.event}
        open={isOpen}
        onOpenChange={handleOpenChange}
        onNavigate={handleNavigate}
      />
    );
  }

  // Loading — prefer stub (from card tap) for instant first paint.
  if (data.stub) {
    return (
      <EventPeekSheet
        event={cardToPeekStub(data.stub)}
        open={isOpen}
        onOpenChange={handleOpenChange}
        onNavigate={handleNavigate}
        isStub
      />
    );
  }

  // Rare fallback — no stub (popstate re-entry). Skeleton.
  return (
    <EventPeekSheet.Skeleton
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <PeekSkeleton />
    </EventPeekSheet.Skeleton>
  );
}
