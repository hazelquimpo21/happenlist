/**
 * CommandBar
 * ===========
 * Sticky top action bar for admin Edit pages. Holds the controls used 90%
 * of the time so the operator never has to scroll to find Save or Status.
 *
 * Layout (left → right):
 *   [back link] [title slot] [shape badge slot] [status slot]
 *                                    ... actions cluster (right-aligned) ...
 *
 * The actions cluster is composed by the parent — this component keeps the
 * layout/scroll behavior generic so Edit Event and Edit Series can render
 * different action sets (Re-fetch vs. Add event vs. Regenerate dates).
 *
 * Sticky beneath the page header (top-16 on desktop, top-14 on mobile).
 * Uses `z-sticky` (20) to layer above content but below modals (z-40).
 *
 * @module components/admin/form-shell/command-bar
 */
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Where the "Back" arrow links to. */
  backHref: string;
  backLabel?: string;
  /** Text shown next to the back arrow — usually the entity title. */
  title: string;
  /** Pre-rendered shape/category/status badges shown after the title. */
  badges?: React.ReactNode;
  /** Right-aligned action buttons (Re-fetch, Status select, Save, etc.). */
  actions: React.ReactNode;
  className?: string;
}

export function CommandBar({
  backHref,
  backLabel = 'Back',
  title,
  badges,
  actions,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'sticky top-0 z-sticky bg-pure/95 backdrop-blur border-b border-mist',
        className,
      )}
    >
      <div className="flex items-center gap-3 px-6 py-3 min-h-[60px]">
        <Link
          href={backHref}
          className="shrink-0 inline-flex items-center gap-1.5 text-sm text-zinc hover:text-ink transition-colors"
          title={backLabel}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>

        <div className="h-5 w-px bg-mist shrink-0 hidden sm:block" />

        <h1 className="font-semibold text-ink text-base sm:text-lg truncate min-w-0 flex-1">
          {title}
        </h1>

        {badges && <div className="flex items-center gap-2 shrink-0">{badges}</div>}

        <div className="flex items-center gap-2 shrink-0 ml-auto">{actions}</div>
      </div>
    </div>
  );
}
