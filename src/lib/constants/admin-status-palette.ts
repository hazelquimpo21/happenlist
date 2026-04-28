/**
 * ADMIN STATUS PALETTE
 * =====================
 * Single source of truth for event/series status visual identity. Replaces
 * the scattered `bg-amber-100 text-amber-800` strings inlined across forms,
 * dropdowns, badges, sidebar, and command bar.
 *
 * Statuses that need the operator's attention (`pending_review`,
 * `changes_requested`) carry a `pulse: true` flag so consumers can render
 * an animated dot.
 *
 * Used by:
 *   - components/admin/form-shell/command-bar.tsx
 *   - components/admin/form-shell/status-pill.tsx
 *   - components/superadmin/event-edit-form helpers (status select)
 *   - admin event/series list rows
 *
 * @module lib/constants/admin-status-palette
 */
import { Pencil, Eye, MessageSquare, CheckCircle2, XCircle, Ban } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type EventStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'published'
  | 'rejected'
  | 'cancelled';

export interface StatusMeta {
  value: EventStatus;
  label: string;
  /** Tailwind class string for the pill (background + text). */
  pill: string;
  /** Stand-alone dot color class for tiny inline indicators. */
  dot: string;
  /** Lucide icon used in the dropdown + history. */
  icon: LucideIcon;
  /** True when the status is "needs attention" — render a pulsing dot. */
  pulse: boolean;
  /** Microcopy shown in tooltip / dropdown subtitle. */
  hint: string;
}

export const STATUS_META: Record<EventStatus, StatusMeta> = {
  draft: {
    value: 'draft',
    label: 'Draft',
    pill: 'bg-mist/80 text-zinc',
    dot: 'bg-zinc',
    icon: Pencil,
    pulse: false,
    hint: 'Not yet visible to the public',
  },
  pending_review: {
    value: 'pending_review',
    label: 'Pending review',
    pill: 'bg-golden/15 text-amber',
    dot: 'bg-amber',
    icon: Eye,
    pulse: true,
    hint: 'Waiting on a moderator',
  },
  changes_requested: {
    value: 'changes_requested',
    label: 'Changes requested',
    pill: 'bg-orange/10 text-orange-dark',
    dot: 'bg-orange',
    icon: MessageSquare,
    pulse: true,
    hint: 'Submitter must address feedback',
  },
  published: {
    value: 'published',
    label: 'Published',
    pill: 'bg-emerald/15 text-emerald',
    dot: 'bg-emerald',
    icon: CheckCircle2,
    pulse: false,
    hint: 'Live on the public site',
  },
  rejected: {
    value: 'rejected',
    label: 'Rejected',
    pill: 'bg-rose/10 text-rose',
    dot: 'bg-rose',
    icon: XCircle,
    pulse: false,
    hint: 'Will not be published',
  },
  cancelled: {
    value: 'cancelled',
    label: 'Cancelled',
    pill: 'bg-zinc/10 text-zinc line-through',
    dot: 'bg-zinc',
    icon: Ban,
    pulse: false,
    hint: 'Event is not happening',
  },
};

/** Display order in dropdowns. */
export const STATUS_ORDER: EventStatus[] = [
  'draft',
  'pending_review',
  'changes_requested',
  'published',
  'rejected',
  'cancelled',
];

export function getStatusMeta(status: string | null | undefined): StatusMeta {
  if (status && status in STATUS_META) {
    return STATUS_META[status as EventStatus];
  }
  return STATUS_META.draft;
}
