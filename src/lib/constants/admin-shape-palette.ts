/**
 * ADMIN EVENT SHAPE PALETTE
 * ==========================
 * Recolor for ShapeBadge that aligns with the canonical event shapes.
 * Replaces the prior arbitrary pink/purple/teal/blue mapping.
 *
 * Mapping rationale:
 *   - Single        → blue (default brand)
 *   - Single·Ongoing → teal (matches "arts" — always-on cultural feel)
 *   - Recurring     → indigo (matches "workshops" — repeating cohort feel)
 *   - Collection    → amber/festivals gold (matches the festival category)
 *
 * Used by: components/admin/shape-badge.tsx
 *
 * @module lib/constants/admin-shape-palette
 */
import { Calendar, Clock, Repeat, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type EventShape = 'single' | 'single_ongoing' | 'recurring' | 'collection';

export interface ShapeMeta {
  shape: EventShape;
  label: string;
  /** One-liner description shown in the non-compact badge variant. */
  defaultSub: string;
  /** Tailwind classes for the pill background + text. */
  pill: string;
  /** Border class for outlined variants. */
  border: string;
  icon: LucideIcon;
  /** Hex (for inline SVG fills if needed). */
  hex: string;
}

export const SHAPE_META: Record<EventShape, ShapeMeta> = {
  single: {
    shape: 'single',
    label: 'Single',
    defaultSub: 'One date, one event',
    pill: 'bg-blue/10 text-blue',
    border: 'border-blue/30',
    icon: Calendar,
    hex: '#008bd2',
  },
  single_ongoing: {
    shape: 'single_ongoing',
    label: 'Single · Ongoing',
    defaultSub: 'Always-on with weekly hours',
    pill: 'bg-teal/10 text-teal',
    border: 'border-teal/30',
    icon: Clock,
    hex: '#008e91',
  },
  recurring: {
    shape: 'recurring',
    label: 'Recurring',
    defaultSub: 'Part of a series',
    pill: 'bg-indigo/10 text-indigo',
    border: 'border-indigo/30',
    icon: Repeat,
    hex: '#5B4FC4',
  },
  collection: {
    shape: 'collection',
    label: 'Collection',
    defaultSub: 'Umbrella event with sub-events',
    pill: 'bg-amber/15 text-amber',
    border: 'border-amber/30',
    icon: Layers,
    hex: '#d48700',
  },
};

export function getShapeMeta(shape: EventShape): ShapeMeta {
  return SHAPE_META[shape];
}
