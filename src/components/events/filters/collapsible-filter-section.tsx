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

import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  // Track open state ourselves so the chevron rotation + sessionStorage write
  // both react to the same toggle event. The native <details> would handle
  // open/close on its own, but we need a hook for persistence anyway.
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const storageKey = STORAGE_KEY_PREFIX + id;

  // Hydrate from sessionStorage on mount. Done in an effect (not initial
  // useState) because `sessionStorage` is browser-only and SSR would crash.
  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored === 'open' || stored === 'closed') {
        const next = stored === 'open';
        setOpen(next);
        if (detailsRef.current) detailsRef.current.open = next;
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
      ref={detailsRef}
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
