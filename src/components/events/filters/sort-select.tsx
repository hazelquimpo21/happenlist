'use client';

/**
 * SORT SELECT
 * ===========
 * Small client control for choosing the `/events` sort order.
 * Writes `?sort=...` to the URL; the server component re-renders with the
 * chosen `orderBy` passed into getEvents().
 *
 * Kept separate from FilterBar/FilterDrawer because sort is orthogonal to
 * filters — selecting a sort shouldn't reset filter state, and the count
 * badge in FilterBar intentionally ignores sort.
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { SortOption } from '@/types';

const SORT_LABELS: Record<SortOption, string> = {
  'date-asc': 'Soonest first',
  'newest': 'Newly added',
  'popular': 'Most popular',
  'name-asc': 'Name (A–Z)',
  'date-desc': 'Latest first',
  'distance-asc': 'Nearest first',
};

const PUBLIC_SORT_OPTIONS: SortOption[] = [
  'date-asc',
  'newest',
  'popular',
  'name-asc',
];

export function SortSelect({ current }: { current: SortOption }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(searchParams.toString());
    const value = e.target.value as SortOption;
    if (value === 'date-asc') {
      next.delete('sort');
    } else {
      next.set('sort', value);
    }
    next.delete('page');
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <label className="inline-flex items-center gap-2 text-body-sm text-zinc">
      <span>Sort:</span>
      <select
        value={current}
        onChange={handleChange}
        className="rounded-md border border-mist bg-pure px-2 py-1 text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-blue/40"
      >
        {PUBLIC_SORT_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {SORT_LABELS[opt]}
          </option>
        ))}
      </select>
    </label>
  );
}
