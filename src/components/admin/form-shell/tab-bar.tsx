/**
 * TabBar
 * =======
 * Horizontal tab strip used by the series Edit page. Each tab maps to a
 * FormSectionMeta entry from admin-form-sections.ts, so accent colors and
 * icons stay consistent with the rest of the form-shell.
 *
 * Active tab gets the accent stripe under its label and the section's
 * icon color. Dirty dot floats next to the label when the tab has
 * unsaved changes.
 *
 * Keyboard: same Cmd+1..9 shortcut convention as SectionTOC.
 *
 * @module components/admin/form-shell/tab-bar
 */
'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getAccent } from '@/lib/constants/admin-accents';
import type { FormSectionMeta } from '@/lib/constants/admin-form-sections';
import { DirtyDot } from './dirty-dot';

interface Props {
  tabs: readonly FormSectionMeta[];
  activeId: string;
  onChange: (id: string) => void;
  /** Per-tab dirty flag. Tabs not in the map default to clean. */
  dirtyByTab?: Record<string, boolean>;
  className?: string;
}

export function TabBar({ tabs, activeId, onChange, dirtyByTab = {}, className }: Props) {
  // Cmd/Ctrl + N keyboard shortcut.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const digit = Number(e.key);
      if (!Number.isInteger(digit) || digit < 1 || digit > 9) return;
      const target = tabs.find((t) => t.shortcut === digit);
      if (!target) return;
      e.preventDefault();
      onChange(target.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tabs, onChange]);

  return (
    <div
      role="tablist"
      aria-label="Form tabs"
      className={cn(
        'flex items-end gap-1 border-b border-mist overflow-x-auto',
        className,
      )}
    >
      {tabs.map((t) => {
        const accent = getAccent(t.accent);
        const Icon = t.icon;
        const isActive = activeId === t.id;
        const dirty = !!dirtyByTab[t.id];

        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${t.id}`}
            onClick={() => onChange(t.id)}
            className={cn(
              'group relative inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors',
              'border-b-2 -mb-px',
              isActive
                ? cn('text-ink', accent.cardBorder.replace('border-', 'border-'))
                : 'border-transparent text-zinc hover:text-ink',
            )}
            style={isActive ? { borderColor: accent.hex } : undefined}
          >
            <span
              className={cn(
                'inline-flex w-6 h-6 rounded-md items-center justify-center',
                isActive ? accent.iconBg : 'bg-transparent',
              )}
            >
              <Icon
                className={cn('w-3.5 h-3.5', isActive ? accent.iconText : 'text-zinc')}
              />
            </span>
            <span className="whitespace-nowrap">{t.label}</span>
            <DirtyDot active={dirty} />
            {t.shortcut && (
              <kbd className="hidden md:inline-flex items-center px-1 h-4 text-[10px] font-mono text-silver border border-mist rounded">
                ⌘{t.shortcut}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}
