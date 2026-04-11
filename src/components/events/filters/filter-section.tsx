/**
 * FilterSection — labeled grouping inside the FilterDrawer.
 *
 * Just a heading + an optional "Clear" link + a child slot for chips. Lives
 * here so that adding new sections to the drawer is one wrapper, not five
 * lines of duplicated header markup.
 *
 * Cross-file coupling: filter-drawer.tsx (sole consumer)
 */

'use client';

import type { ReactNode } from 'react';

interface FilterSectionProps {
  label: string;
  /** Optional sublabel for context (e.g. "America/Chicago"). */
  hint?: string;
  /** When true, shows a "Clear" affordance that calls onClear. */
  showClear?: boolean;
  onClear?: () => void;
  children: ReactNode;
}

export function FilterSection({
  label,
  hint,
  showClear,
  onClear,
  children,
}: FilterSectionProps) {
  return (
    <section className="py-5 border-b border-mist last:border-b-0">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-body text-body font-semibold text-ink">{label}</h3>
          {hint && <p className="text-xs text-zinc mt-0.5">{hint}</p>}
        </div>
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-blue hover:text-blue-dark focus-visible:outline-none focus-visible:underline"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}
