/**
 * CompactToggle
 * ==============
 * Two-state pill toggle between "Compact" and "Full edit" modes on admin
 * Edit pages. Compact mode hides everything below the hero + checklist —
 * for the quick "glance, publish, done" path.
 *
 * Persisted to localStorage so the operator's preference survives page
 * reloads.
 *
 * @module components/admin/form-shell/compact-toggle
 */
'use client';

import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EditMode = 'compact' | 'full';

const STORAGE_KEY = 'happenlist:admin-edit-mode';

interface Props {
  value: EditMode;
  onChange: (next: EditMode) => void;
  className?: string;
}

export function CompactToggle({ value, onChange, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Edit mode"
      className={cn(
        'inline-flex items-center p-0.5 rounded-lg bg-cloud border border-mist',
        className,
      )}
    >
      <ModeButton
        active={value === 'compact'}
        onClick={() => onChange('compact')}
        icon={<Minimize2 className="w-3.5 h-3.5" />}
        label="Compact"
      />
      <ModeButton
        active={value === 'full'}
        onClick={() => onChange('full')}
        icon={<Maximize2 className="w-3.5 h-3.5" />}
        label="Full edit"
      />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
        active
          ? 'bg-pure text-ink shadow-sm'
          : 'text-zinc hover:text-ink',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Read+write localStorage. Default to 'full' on first visit.
 */
export function useEditMode(): [EditMode, (next: EditMode) => void] {
  const [mode, setMode] = useState<EditMode>('full');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'compact' || stored === 'full') setMode(stored);
    } catch {
      // ignore
    }
  }, []);

  const update = (next: EditMode) => {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  return [mode, update];
}
