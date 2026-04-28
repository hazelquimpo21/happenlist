/**
 * FormSection
 * ============
 * The shared visual wrapper for every grouped section on the admin Edit
 * Event and Edit Series pages. Renders:
 *
 *   - A 4px left accent stripe in the section's accent color
 *   - An icon in the same accent (in a soft tinted square)
 *   - Title + optional description
 *   - Optional dirty count pill (e.g. "2 changes")
 *   - Collapsible body with persistent open/closed state via sessionStorage
 *
 * Open/closed state is persisted per-entity so different events remember
 * their layout independently. Same approach as
 * `CollapsibleFilterSection`.
 *
 * Anchored via `id` so the TOC and `Cmd+1..9` shortcuts can scroll-to.
 *
 * @module components/admin/form-shell/form-section
 */
'use client';

import { useEffect, useState, useCallback, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAccent, type SectionAccent } from '@/lib/constants/admin-accents';

interface Props {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  accent: SectionAccent;
  /** Number of unsaved-change fields in this section. 0 hides the pill. */
  dirtyCount?: number;
  /** Initial collapse state if no stored preference. Defaults to true. */
  defaultOpen?: boolean;
  /** Per-entity scope for sessionStorage so each event remembers separately. */
  storageScope?: string;
  /** Element rendered at the top-right of the heading row (badges, links). */
  headerRight?: React.ReactNode;
  /** Show a small "Always-on" hint when this section can't collapse. */
  alwaysOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

const STORAGE_PREFIX = 'happenlist:admin-section';

export function FormSection({
  id,
  title,
  description,
  icon: Icon,
  accent,
  dirtyCount = 0,
  defaultOpen = true,
  storageScope,
  headerRight,
  alwaysOpen = false,
  children,
  className,
}: Props) {
  const accentClasses = getAccent(accent);
  const headingId = useId();

  const storageKey = storageScope
    ? `${STORAGE_PREFIX}:${storageScope}:${id}`
    : `${STORAGE_PREFIX}:${id}`;

  const [open, setOpen] = useState(defaultOpen);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (alwaysOpen) {
      setHydrated(true);
      return;
    }
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored === 'open') setOpen(true);
      else if (stored === 'closed') setOpen(false);
    } catch {
      // sessionStorage may be unavailable (SSR, privacy mode) — keep default.
    }
    setHydrated(true);
    // storageKey is stable per (storageScope, id); intentional re-run if it
    // ever changes mid-mount (e.g. parent re-keys).
  }, [storageKey, alwaysOpen]);

  const toggle = useCallback(() => {
    if (alwaysOpen) return;
    setOpen((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(storageKey, next ? 'open' : 'closed');
      } catch {
        // ignore
      }
      return next;
    });
  }, [storageKey, alwaysOpen]);

  const effectiveOpen = alwaysOpen || open;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-pure shadow-card scroll-mt-24',
        accentClasses.cardBorder,
        className,
      )}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1', accentClasses.stripe)} />

      <button
        type="button"
        onClick={toggle}
        disabled={alwaysOpen}
        aria-expanded={effectiveOpen}
        className={cn(
          'w-full flex items-center gap-3 pl-5 pr-4 py-4 text-left',
          !alwaysOpen && 'hover:bg-cloud/40 transition-colors',
          alwaysOpen && 'cursor-default',
        )}
      >
        <span
          className={cn(
            'inline-flex w-9 h-9 rounded-lg items-center justify-center shrink-0',
            accentClasses.iconBg,
          )}
        >
          <Icon className={cn('w-5 h-5', accentClasses.iconText)} />
        </span>

        <span className="flex-1 min-w-0">
          <span
            id={headingId}
            className={cn('block text-base font-semibold leading-tight', accentClasses.titleText)}
          >
            {title}
          </span>
          {description && (
            <span className="block text-xs text-zinc mt-0.5 truncate">{description}</span>
          )}
        </span>

        {dirtyCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue/10 text-blue text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
            {dirtyCount} {dirtyCount === 1 ? 'change' : 'changes'}
          </span>
        )}

        {headerRight}

        {!alwaysOpen && (
          <ChevronDown
            className={cn(
              'w-4 h-4 text-zinc transition-transform duration-base shrink-0',
              effectiveOpen ? 'rotate-180' : 'rotate-0',
            )}
          />
        )}
      </button>

      {/* When pre-hydration, render with the SSR-default open state. After
          hydration, use the resolved open state. This avoids an open/close
          flash where possible. */}
      {(hydrated ? effectiveOpen : defaultOpen) && (
        <div className="pl-5 pr-5 pb-6 pt-1">{children}</div>
      )}
    </section>
  );
}
