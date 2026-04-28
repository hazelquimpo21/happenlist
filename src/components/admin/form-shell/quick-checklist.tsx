/**
 * QuickChecklist
 * ===============
 * Compact row of pass/fail indicators for an event's "publish-readiness".
 * Each item shows ✓ or ✗ + label, and clicking it scrolls to the relevant
 * section anchor so the operator can fix the field immediately.
 *
 * Items are passed in by the parent — the component doesn't know about
 * specific fields. Each item has:
 *   - label (e.g. "Has image")
 *   - ok: boolean
 *   - jumpTo: section id ("basics", "where", etc.)
 *   - hint?: tooltip when failing
 *
 * @module components/admin/form-shell/quick-checklist
 */
'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChecklistItem {
  key: string;
  label: string;
  ok: boolean;
  jumpTo?: string;
  hint?: string;
}

interface Props {
  items: ChecklistItem[];
  className?: string;
}

export function QuickChecklist({ items, className }: Props) {
  if (items.length === 0) return null;

  const passing = items.filter((i) => i.ok).length;
  const total = items.length;

  return (
    <div
      className={cn(
        'flex items-center gap-3 flex-wrap rounded-xl border border-mist bg-pure px-4 py-3',
        className,
      )}
    >
      <div className="text-xs font-semibold text-zinc shrink-0">
        Ready to publish
        <span className={cn(
          'ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-medium',
          passing === total ? 'bg-emerald/15 text-emerald' : 'bg-golden/15 text-amber',
        )}>
          {passing}/{total}
        </span>
      </div>

      <div className="h-4 w-px bg-mist hidden sm:block" />

      <ul className="flex items-center gap-1.5 flex-wrap">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => {
                if (!item.jumpTo) return;
                document.getElementById(item.jumpTo)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }}
              title={item.hint ?? (item.ok ? 'Looks good' : `Fix in ${item.jumpTo ?? 'form'}`)}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-colors',
                item.ok
                  ? 'bg-emerald/10 text-emerald hover:bg-emerald/15'
                  : 'bg-rose/10 text-rose hover:bg-rose/15',
                !item.jumpTo && 'pointer-events-none',
              )}
            >
              {item.ok ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
