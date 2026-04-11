/**
 * FilterChip — primitive pill button for the filter UI.
 *
 * One pill, two visual states (active / inactive), optional left icon and
 * optional right "×" remove affordance. Stays presentational on purpose —
 * URL state lives in `use-filter-state.ts`, this component just calls the
 * onClick handler the parent supplies.
 *
 * Design tokens (CLAUDE.md):
 *   - Inactive: white bg, mist border, ink text, hover blue text + blue border
 *   - Active:   blue/10 bg, blue border (semi-bold), blue text
 *   - Brand category color is intentionally NOT used here — color overload
 *     happens fast in a filter row, brand blue is the canonical "selected"
 *     state across the app. Category-colored pills stay on the cards.
 *
 * Cross-file coupling: filter-bar.tsx, filter-drawer.tsx, empty-filter-state.tsx
 */

'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

interface FilterChipProps {
  label: string;
  active?: boolean;
  /** Optional icon shown on the left side, before the label. */
  icon?: ReactNode;
  /** Click handler — toggles the filter in the parent. */
  onClick?: () => void;
  /**
   * If provided, renders an "×" button on the right side that calls this
   * handler instead of `onClick`. Use for EmptyFilterState's "remove" chips
   * where the whole chip IS the remove action.
   */
  onRemove?: () => void;
  /** Smaller chip variant for dense rows (drawer sections). */
  size?: 'sm' | 'md';
  /** Optional accessible description (tooltip / sr-only). */
  title?: string;
  className?: string;
}

export function FilterChip({
  label,
  active = false,
  icon,
  onClick,
  onRemove,
  size = 'md',
  title,
  className,
}: FilterChipProps) {
  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-xs'
      : 'px-3.5 py-1.5 text-body-sm';

  return (
    <button
      type="button"
      onClick={onRemove ?? onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium font-body',
        'border transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-1',
        sizeClasses,
        active
          ? 'bg-blue/10 border-blue text-blue font-semibold'
          : 'bg-pure border-mist text-ink hover:border-blue hover:text-blue',
        className
      )}
    >
      {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
      <span>{label}</span>
      {onRemove && (
        <X className="w-3.5 h-3.5 flex-shrink-0 -mr-0.5" aria-hidden="true" />
      )}
    </button>
  );
}
