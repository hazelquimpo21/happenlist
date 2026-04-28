/**
 * SectionTOC
 * ===========
 * Left-rail navigation for the admin Edit pages. Each entry maps to a
 * FormSection on the page — clicking jumps to it, and the dirty-dot
 * indicates "this section has unsaved changes".
 *
 * Scroll-spy: as the user scrolls, the entry whose anchor is currently
 * within the upper third of the viewport is highlighted. Implemented with
 * IntersectionObserver against `[data-section-anchor]` targets.
 *
 * Keyboard: `Cmd/Ctrl + 1..9` jumps to the matching section by `shortcut`
 * digit. Avoids hijacking inputs (skips when an input/textarea is focused).
 *
 * Sticky on `lg+`. Collapses to a horizontal scroll on smaller widths.
 *
 * @module components/admin/form-shell/section-toc
 */
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getAccent } from '@/lib/constants/admin-accents';
import type { FormSectionMeta } from '@/lib/constants/admin-form-sections';
import { DirtyDot } from './dirty-dot';

interface Props {
  sections: readonly FormSectionMeta[];
  /** Per-section dirty flag: section.id → boolean. */
  dirtyBySection: Record<string, boolean>;
  /** Optional title above the list. */
  title?: string;
}

export function SectionTOC({ sections, dirtyBySection, title = 'Sections' }: Props) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');

  // Scroll-spy via IntersectionObserver on each section anchor.
  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting entry.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      {
        // Trigger when the section enters the upper third of the viewport.
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      },
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [sections]);

  // Cmd/Ctrl + N keyboard shortcut.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const digit = Number(e.key);
      if (!Number.isInteger(digit) || digit < 1 || digit > 9) return;
      const target = sections.find((s) => s.shortcut === digit);
      if (!target) return;
      e.preventDefault();
      const el = document.getElementById(target.id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(target.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sections]);

  return (
    <nav
      aria-label={title}
      className="lg:sticky lg:top-24 bg-pure border border-mist rounded-xl p-3"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc px-2 mb-2">
        {title}
      </p>
      <ul className="space-y-0.5">
        {sections.map((s) => {
          const accent = getAccent(s.accent);
          const Icon = s.icon;
          const isActive = activeId === s.id;
          const isDirty = !!dirtyBySection[s.id];
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(s.id)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                  setActiveId(s.id);
                }}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-cloud text-ink'
                    : 'text-zinc hover:bg-cloud/50 hover:text-ink',
                )}
              >
                <span
                  className={cn(
                    'inline-flex w-6 h-6 rounded-md items-center justify-center shrink-0',
                    isActive ? accent.iconBg : 'bg-transparent',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5',
                      isActive ? accent.iconText : 'text-zinc',
                    )}
                  />
                </span>
                <span className="flex-1 truncate">{s.label}</span>
                <DirtyDot active={isDirty} />
                {s.shortcut && (
                  <kbd className="hidden lg:inline-flex items-center px-1 h-4 text-[10px] font-mono text-silver border border-mist rounded">
                    ⌘{s.shortcut}
                  </kbd>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
