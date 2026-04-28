/**
 * WhatChangedCard
 * ================
 * Sidebar card that lists every dirty field with its before → after
 * representation. Replaces the old "Event Summary" card whose data
 * duplicated the form.
 *
 * Each row links back to its section anchor, mirroring the QuickChecklist
 * pattern so the operator can fix or revert from one place.
 *
 * Renders a friendly empty state when nothing is dirty.
 *
 * @module components/admin/form-shell/what-changed-card
 */
'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DirtyChange } from '@/lib/admin/use-form-dirty-state';

interface Props {
  changes: DirtyChange[];
  className?: string;
}

export function WhatChangedCard({ changes, className }: Props) {
  if (changes.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-mist bg-pure p-4 flex items-start gap-3',
          className,
        )}
      >
        <CheckCircle2 className="w-5 h-5 text-emerald shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-ink">No unsaved changes</p>
          <p className="text-xs text-zinc mt-0.5">
            Edits will appear here as you make them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-blue/30 bg-pure shadow-card', className)}>
      <div className="px-4 py-3 border-b border-mist flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">What changed</p>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue/10 text-blue text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
          {changes.length}
        </span>
      </div>
      <ul className="divide-y divide-mist max-h-[26rem] overflow-y-auto">
        {changes.map((change) => (
          <li key={change.key}>
            <button
              type="button"
              onClick={() =>
                document.getElementById(change.section)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
              className="w-full text-left px-4 py-2.5 hover:bg-cloud/50 transition-colors"
            >
              <p className="text-xs font-medium text-zinc uppercase tracking-wide">
                {change.label}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs">
                <span className="text-zinc line-through truncate max-w-[40%]" title={change.before}>
                  {change.before}
                </span>
                <ArrowRight className="w-3 h-3 text-silver shrink-0" />
                <span className="text-ink font-medium truncate" title={change.after}>
                  {change.after}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
