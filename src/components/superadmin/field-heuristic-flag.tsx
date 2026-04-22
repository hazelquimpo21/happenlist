'use client';

/**
 * FIELD HEURISTIC FLAG
 * ====================
 * Tiny amber/red pill rendered next to a field label when the heuristics in
 * lib/admin/field-heuristics.ts flag an issue. Tooltip-style — full reason
 * shows on hover.
 *
 * Severity map:
 *   - 'low'  → yellow (informational, might be fine)
 *   - 'high' → amber/red (probably wrong, fix before publishing)
 *
 * @module components/superadmin/field-heuristic-flag
 */

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeuristicFlag as Flag } from '@/lib/admin/field-heuristics';

interface Props {
  flag: Flag | null;
  /** Shorter label for tight spaces (default: "Check this") */
  label?: string;
}

export function FieldHeuristicFlag({ flag, label = 'Check this' }: Props) {
  if (!flag) return null;
  const isHigh = flag.severity === 'high';
  return (
    <span
      title={flag.reason}
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium align-middle ml-2 cursor-help',
        isHigh
          ? 'bg-red-100 text-red-800 border border-red-200'
          : 'bg-amber-100 text-amber-800 border border-amber-200'
      )}
    >
      <AlertTriangle className="w-3 h-3" />
      {label}
    </span>
  );
}
