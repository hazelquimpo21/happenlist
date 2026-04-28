/**
 * CommandBarStatusSelect
 * =======================
 * Compact status dropdown for use inside CommandBar. Renders the current
 * status as a colored pill and reveals a popover of options on click. Each
 * option shows its icon, label, and hint from STATUS_META.
 *
 * Selecting an option calls onChange — does NOT save by itself. The parent
 * decides whether the change is committed immediately or as part of a save.
 *
 * @module components/admin/form-shell/command-bar-status-select
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STATUS_ORDER,
  getStatusMeta,
  type EventStatus,
} from '@/lib/constants/admin-status-palette';

interface Props {
  value: string;
  onChange: (status: EventStatus) => void;
  /** Limit the dropdown to a subset of statuses. Defaults to all. */
  options?: readonly EventStatus[];
  disabled?: boolean;
  className?: string;
}

export function CommandBarStatusSelect({
  value,
  onChange,
  options = STATUS_ORDER,
  disabled,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const meta = getStatusMeta(value);
  const Icon = meta.icon;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-mist hover:border-zinc/40',
          'text-sm transition-colors disabled:opacity-50',
          meta.pill,
        )}
      >
        {meta.pulse && (
          <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', meta.dot)} />
        )}
        <Icon className="w-3.5 h-3.5" />
        <span className="font-medium">{meta.label}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1 w-64 bg-pure border border-mist rounded-xl shadow-dropdown z-dropdown overflow-hidden"
        >
          {options.map((statusValue) => {
            const optMeta = getStatusMeta(statusValue);
            const OptIcon = optMeta.icon;
            const isCurrent = statusValue === value;
            return (
              <button
                key={statusValue}
                type="button"
                role="option"
                aria-selected={isCurrent}
                onClick={() => {
                  onChange(statusValue);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-start gap-2.5 px-3 py-2 text-left text-sm',
                  'hover:bg-cloud/60 transition-colors',
                  isCurrent && 'bg-cloud/40',
                )}
              >
                <span
                  className={cn(
                    'inline-flex w-7 h-7 rounded-md items-center justify-center shrink-0',
                    optMeta.pill,
                  )}
                >
                  <OptIcon className="w-3.5 h-3.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium text-ink">{optMeta.label}</span>
                  <span className="block text-xs text-zinc truncate">{optMeta.hint}</span>
                </span>
                {isCurrent && (
                  <span className="text-xs text-blue font-medium pt-0.5">Current</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
