/**
 * =============================================================================
 * <MobileActionBar> — sticky bottom bar, mobile only
 * =============================================================================
 *
 * Heart-first bottom bar that keeps the primary gesture always reachable on
 * mobile. Solves the old layout's biggest mobile problem: the sidebar
 * sidebar stacks 2,000+ px below the fold, so the Save action was
 * unreachable without scrolling the whole page.
 *
 * Grid is weighted to match Hazel's stated action hierarchy:
 *   [Save · 2fr] [Share · 1fr] [Tickets · 1fr]
 *
 * Save is category-accent filled (the hero gesture), the other two are
 * outlined. Tickets degrades gracefully — if there's no ticket URL the
 * button hides and the grid becomes two columns.
 *
 * Hidden on md+ breakpoints (`md:hidden`) — desktop gets the full ticket stub
 * on the sidebar.
 *
 * Cross-file coupling:
 *   - src/components/hearts/heart-button.tsx — wrapped, heavily overridden
 *   - src/components/events/share-button.tsx — wrapped
 *   - src/app/event/[slug]/page.tsx — mounted at root, outside Container
 * =============================================================================
 */

'use client';

import { ExternalLink } from 'lucide-react';
import { HeartButton } from '@/components/hearts';
import { ShareButton } from './share-button';
import type { CategoryColor } from '@/lib/constants/category-colors';

interface MobileActionBarProps {
  event: {
    id: string;
    title: string;
    short_description?: string | null;
    ticket_url?: string | null;
    registration_url?: string | null;
    website_url?: string | null;
    heart_count?: number | null;
    sold_out?: boolean | null;
  };
  isHearted: boolean;
  isPastEvent: boolean;
  categoryColor: CategoryColor;
}

export function MobileActionBar({
  event,
  isHearted,
  isPastEvent,
  categoryColor,
}: MobileActionBarProps) {
  const primaryLink = event.ticket_url || event.registration_url || event.website_url || null;
  const ticketLabel = event.ticket_url
    ? event.sold_out
      ? 'Check'
      : 'Tickets'
    : event.registration_url
      ? 'RSVP'
      : 'More';

  // If event is past, tickets column hides (doesn't make sense)
  const showTickets = !!primaryLink && !isPastEvent;

  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-[30] bg-pure border-t-2 border-ink"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div
        className="grid gap-2 p-2"
        style={{
          gridTemplateColumns: showTickets ? '2fr 1fr 1fr' : '2fr 1fr',
        }}
      >
        {/* Save — the hero action. Wrapped in a category-colored div so the
            button reads as the primary action at a glance; HeartButton
            itself doesn't accept a style prop so we paint the container. */}
        <div
          className="border-2 border-ink"
          style={{ backgroundColor: categoryColor.bg, color: categoryColor.text }}
        >
          <HeartButton
            eventId={event.id}
            initialHearted={isHearted}
            initialCount={event.heart_count ?? 0}
            size="md"
            showCount={true}
            className="!w-full !justify-center !gap-2 !py-3.5 !px-3 !border-0 !rounded-none !font-extrabold !text-sm !bg-transparent"
          />
        </div>

        {/* Share */}
        <ShareButton
          title={event.title}
          text={event.short_description || undefined}
          className="!w-full !justify-center !gap-1 !py-3.5 !px-2 !bg-pure !text-ink !border-2 !border-ink !rounded-none !font-extrabold !text-sm"
        />

        {/* Tickets — tertiary, can be hidden */}
        {showTickets && (
          <a
            href={primaryLink!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-2 py-3.5 bg-pure text-ink border-2 border-ink font-extrabold text-sm hover:bg-cloud transition-colors"
          >
            <span>{ticketLabel}</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}
