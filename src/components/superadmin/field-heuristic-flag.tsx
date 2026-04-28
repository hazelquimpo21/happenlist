'use client';

/**
 * FIELD HEURISTIC FLAG
 * ====================
 * Quiet colored dot rendered next to a field label when the heuristics in
 * lib/admin/field-heuristics.ts flag an issue. Hover for the full reason.
 *
 * Reduced visual weight (Phase D, 2026-04-28) — used to be a chunky pill
 * with a label. The previous treatment competed with the field labels and
 * made every section look like an error state. A 8px dot whispers instead.
 *
 * Severity map:
 *   - 'low'  → amber (informational, might be fine)
 *   - 'high' → rose  (probably wrong, fix before publishing)
 *
 * @module components/superadmin/field-heuristic-flag
 */

import { cn } from '@/lib/utils';
import type { HeuristicFlag as Flag } from '@/lib/admin/field-heuristics';

interface Props {
  flag: Flag | null;
  /** No longer rendered. Kept for backwards-compat with old call sites. */
  label?: string;
}

export function FieldHeuristicFlag({ flag }: Props) {
  if (!flag) return null;
  const isHigh = flag.severity === 'high';
  return (
    <span
      title={flag.reason}
      role="img"
      aria-label={`${isHigh ? 'High' : 'Low'} severity: ${flag.reason}`}
      className={cn(
        'inline-block w-2 h-2 rounded-full ml-2 cursor-help align-middle',
        isHigh ? 'bg-rose animate-pulse' : 'bg-amber',
      )}
    />
  );
}
