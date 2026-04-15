/**
 * EVENT PEEK SHEET — Radix Dialog wrapper
 * =====================================================================
 * Responsive dialog chrome for the event peek.
 *
 *   Mobile (< md):  bottom sheet, slides up, rounded top, drag handle.
 *   Desktop (md+):  centered modal, max-w-2xl, backdrop blur.
 *
 * Same primitive as FilterDrawer. Respects `prefers-reduced-motion`
 * via Tailwind's motion-safe/motion-reduce variants (kept simple —
 * fade-only when reduced).
 *
 * COMPOUND API:
 *   <EventPeekSheet event={...} open={...} onOpenChange={...} />
 *   <EventPeekSheet.Skeleton open onOpenChange> {skeleton} </...>
 *   <EventPeekSheet.Error message="..." open onOpenChange />
 *
 * The Skeleton and Error variants share the outer chrome so transitions
 * between loading → loaded → closed don't visually pop.
 *
 * CROSS-FILE COUPLING:
 *   - peek-host.tsx              — only caller (via context)
 *   - event-peek.tsx             — content rendered inside
 *   - event-peek.constants.ts    — layout + copy
 * =====================================================================
 */

'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { EventWithDetails } from '@/types';
import { cn } from '@/lib/utils/cn';
import { PEEK_COPY } from '@/lib/constants/event-peek';
import { EventPeek } from './event-peek';

// ---------------------------------------------------------------------------
// SHARED CHROME — the outer Dialog.Root / Portal / Overlay / Content wrapper.
// Extracted so Skeleton, Error, and the real content share animations and
// scroll-lock behavior. If you touch the classNames here, re-verify the
// open/close transitions on both mobile and desktop.
// ---------------------------------------------------------------------------

interface SheetChromeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible dialog title — visually hidden unless overridden inside. */
  title: string;
  children: ReactNode;
}

function SheetChrome({ open, onOpenChange, title, children }: SheetChromeProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop — slightly heavier on mobile (more immersive sheet feel). */}
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm',
            // Always fade (cheap, works with reduced-motion).
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:duration-200 data-[state=closed]:duration-150'
          )}
        />

        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'fixed z-50 bg-pure shadow-2xl flex flex-col overflow-hidden',
            // --- MOBILE: bottom sheet ----------------------------------
            'inset-x-0 bottom-0 max-h-[92vh] rounded-t-2xl',
            // --- DESKTOP: centered modal -------------------------------
            'md:inset-x-auto md:left-1/2 md:top-1/2 md:bottom-auto',
            'md:-translate-x-1/2 md:-translate-y-1/2',
            'md:w-full md:max-w-2xl md:rounded-2xl md:max-h-[85vh]',
            // --- ANIMATIONS --------------------------------------------
            // Full motion for users who allow it; gentler fade-only for
            // `prefers-reduced-motion: reduce`. Tailwind's `motion-safe:`
            // wraps these in the appropriate media query.
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:duration-300 data-[state=closed]:duration-200',
            // Always fade — works in both motion modes.
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            // Mobile slide — motion-safe only (bottom sheet slide is
            // disorienting for reduced-motion users).
            'motion-safe:data-[state=open]:slide-in-from-bottom',
            'motion-safe:data-[state=closed]:slide-out-to-bottom',
            // Desktop zoom — motion-safe only.
            'md:motion-safe:data-[state=open]:zoom-in-95',
            'md:motion-safe:data-[state=closed]:zoom-out-95',
            // Kill mobile slide on desktop (slide-from-bottom looks weird
            // on a centered modal even in motion-safe mode).
            'md:motion-safe:data-[state=open]:slide-in-from-bottom-0',
            'md:motion-safe:data-[state=closed]:slide-out-to-bottom-0'
          )}
        >
          {/* Mobile drag handle — visual affordance. Actual swipe-to-dismiss
              is deferred to a later polish pass (needs gesture lib). */}
          <div className="md:hidden flex justify-center pt-2 pb-1 flex-shrink-0">
            <span
              aria-hidden="true"
              className="block w-10 h-1 rounded-full bg-mist"
            />
          </div>

          {/* SR-only title keeps Radix happy and screen readers oriented. */}
          <Dialog.Title className="sr-only">{title}</Dialog.Title>

          {/* Close button — desktop only. On mobile users tap backdrop or
              drag the handle; an X in the corner fights thumb ergonomics. */}
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label={PEEK_COPY.closeLabel}
              className={cn(
                'absolute top-3 right-3 z-20',
                'hidden md:inline-flex items-center justify-center',
                'w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm',
                'text-ink hover:bg-white transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2'
              )}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </Dialog.Close>

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---------------------------------------------------------------------------
// MAIN VARIANT — event loaded, render the peek content
// ---------------------------------------------------------------------------

interface EventPeekSheetProps {
  event: EventWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called right before a CTA navigates away — parent should close. */
  onNavigate?: () => void;
  recurrenceLabel?: string | null;
  upcomingCount?: number;
  /**
   * True when `event` is a partial stub (reshape of card data) pending
   * the full fetch. Disables CTAs that require fields absent on cards
   * (ticket_url) and dims the description placeholder.
   */
  isStub?: boolean;
}

function EventPeekSheetBase({
  event,
  open,
  onOpenChange,
  onNavigate,
  recurrenceLabel,
  upcomingCount,
  isStub = false,
}: EventPeekSheetProps) {
  return (
    <SheetChrome
      open={open}
      onOpenChange={onOpenChange}
      title={event.title || PEEK_COPY.fallbackTitle}
    >
      <EventPeek
        event={event}
        recurrenceLabel={recurrenceLabel}
        upcomingCount={upcomingCount}
        onNavigate={onNavigate}
        isStub={isStub}
      />
    </SheetChrome>
  );
}

// ---------------------------------------------------------------------------
// SKELETON VARIANT — while event data is in flight
// ---------------------------------------------------------------------------

interface SkeletonSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

function SkeletonSheet({ open, onOpenChange, children }: SkeletonSheetProps) {
  return (
    <SheetChrome
      open={open}
      onOpenChange={onOpenChange}
      title={PEEK_COPY.fallbackTitle}
    >
      {children}
    </SheetChrome>
  );
}

// ---------------------------------------------------------------------------
// ERROR VARIANT — fetch failed
// ---------------------------------------------------------------------------

interface ErrorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
}

function ErrorSheet({ open, onOpenChange, message }: ErrorSheetProps) {
  return (
    <SheetChrome
      open={open}
      onOpenChange={onOpenChange}
      title="Couldn't load event"
    >
      <div className="flex flex-col items-center justify-center text-center px-6 py-12 gap-3">
        <AlertCircle
          className="w-10 h-10 text-orange-600"
          aria-hidden="true"
        />
        <h2 className="font-body text-h4 font-semibold text-ink">
          We couldn't load this one
        </h2>
        <p className="text-body-sm text-zinc max-w-sm">{message}</p>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="mt-2 px-4 py-2 rounded-lg bg-cloud text-ink text-body-sm font-semibold hover:bg-mist transition-colors"
        >
          Close
        </button>
      </div>
    </SheetChrome>
  );
}

// ---------------------------------------------------------------------------
// COMPOUND EXPORT
// ---------------------------------------------------------------------------

export const EventPeekSheet = Object.assign(EventPeekSheetBase, {
  Skeleton: SkeletonSheet,
  Error: ErrorSheet,
});
