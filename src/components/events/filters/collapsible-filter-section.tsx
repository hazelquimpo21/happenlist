/**
 * =============================================================================
 * CollapsibleFilterSection — disclosure variant of FilterSection
 * =============================================================================
 *
 * Same visual heading as `<FilterSection>` but the chip list lives inside a
 * `<details>` element so users can fold sections away. State persists in
 * `sessionStorage` keyed by `id` — refreshes during the same browser session
 * keep the user's collapse choices, but a new session resets to the default.
 *
 * Why sessionStorage and not localStorage?
 *   The drawer UI evolves often; pinning a user's collapse choices forever
 *   means a redesigned section silently stays folded for returning users
 *   weeks later. SessionStorage scopes the memory to a single browse and
 *   matches user intuition ("I closed it now, it stays closed for now").
 *
 * Why <details> over Radix Collapsible?
 *   - Native keyboard support (Enter/Space toggle) for free.
 *   - Native open/close events — no extra state machine.
 *   - One less dependency edge for a primitive that doesn't need animation.
 *
 * Cross-file coupling:
 *   - filter-drawer.tsx — sole consumer (Stage 3 sections only)
 *   - filter-section.tsx — non-collapsible sibling for legacy sections
 * =============================================================================
 */

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CollapsibleFilterSectionProps {
  /** Stable id used for sessionStorage key + ARIA. snake_case recommended. */
  id: string;
  label: string;
  hint?: string;
  /** Default open state when no sessionStorage entry exists. */
  defaultOpen?: boolean;
  showClear?: boolean;
  onClear?: () => void;
  children: ReactNode;
}

const STORAGE_KEY_PREFIX = 'happenlist:filter-section:';

export function CollapsibleFilterSection({
  id,
  label,
  hint,
  defaultOpen = true,
  showClear,
  onClear,
  children,
}: CollapsibleFilterSectionProps) {
  // Single source of truth: React state controls the <details open> attribute.
  // We do NOT touch detailsRef.current.open directly — that would race with
  // React's render and could double-toggle.
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const storageKey = STORAGE_KEY_PREFIX + id;

  // Hydrate from sessionStorage on mount. Done in an effect (not initial
  // useState) because sessionStorage is browser-only and SSR would crash.
  // First-paint flash (defaultOpen → stored value) is one frame and doesn't
  // produce a React hydration warning since the open prop is controlled.
  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored === 'open' || stored === 'closed') {
        setOpen(stored === 'open');
      }
    } catch {
      // sessionStorage can throw in some privacy modes — fall through to default
    }
  }, [storageKey]);

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const next = e.currentTarget.open;
    setOpen(next);
    try {
      window.sessionStorage.setItem(storageKey, next ? 'open' : 'closed');
    } catch {
      // ignored — collapse choice just won't persist
    }
  };

  return (
    <details
      open={open}
      onToggle={handleToggle}
      className="py-5 border-b border-mist last:border-b-0"
    >
      <summary
        className={cn(
          'flex items-baseline justify-between gap-3 cursor-pointer',
          'list-none [&::-webkit-details-marker]:hidden',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue rounded-sm'
        )}
      >
        <div className="flex items-baseline gap-2">
          <ChevronDown
            className={cn(
              'w-4 h-4 text-zinc transition-transform flex-shrink-0',
              !open && '-rotate-90'
            )}
            aria-hidden="true"
          />
          <div>
            <h3 className="font-body text-body font-semibold text-ink inline">
              {label}
            </h3>
            {hint && <p className="text-xs text-zinc mt-0.5">{hint}</p>}
          </div>
        </div>
        {showClear && (
          // Real button so it's keyboard-reachable. stopPropagation prevents
          // clicking "Clear" from also toggling the disclosure.
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear?.();
            }}
            className="text-xs font-medium text-blue hover:text-blue-dark focus-visible:outline-none focus-visible:underline"
          >
            Clear
          </button>
        )}
      </summary>
      <div className="flex flex-wrap gap-2 mt-3">{children}</div>
    </details>
  );
}
