/**
 * ADMIN FORM SECTION CATALOG
 * ===========================
 * The canonical list of sections rendered on the admin Edit Event and Edit
 * Series pages. Drives the section TOC, the FormSection wrappers, the
 * default-collapsed behavior, and the keyboard shortcuts.
 *
 * Each entry is the section's full identity in one place — change a label,
 * accent, or icon here and every consumer (form, sidebar, TOC, dirty state)
 * stays in sync.
 *
 * Sections reference accent tokens defined in admin-accents.ts.
 *
 * Used by:
 *   - components/admin/form-shell/section-toc.tsx
 *   - components/superadmin/event-edit-form/* (each section is rendered with
 *     its corresponding entry's metadata)
 *   - components/superadmin/series-edit-form/* (tabs reuse the same shape)
 *
 * @module lib/constants/admin-form-sections
 */
import {
  Sparkles,
  CalendarClock,
  MapPin,
  Users,
  Heart,
  Wand2,
  Tag,
  Layers,
  Settings2,
  AlertTriangle,
  Repeat,
  ListChecks,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SectionAccent } from './admin-accents';

export interface FormSectionMeta {
  /** Anchor id, used by TOC scroll-spy and `Cmd+N` jump shortcuts. */
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  accent: SectionAccent;
  /** Initial open state if the user has no stored preference. */
  defaultOpen: boolean;
  /** Optional keyboard shortcut digit, 1-9. Cmd+digit jumps to the section. */
  shortcut?: number;
}

// ============================================================================
// EVENT EDIT FORM SECTIONS
// ============================================================================

export const EVENT_FORM_SECTIONS: readonly FormSectionMeta[] = [
  {
    id: 'basics',
    label: 'Basics',
    description: 'Title, image, descriptions, category',
    icon: Sparkles,
    accent: 'blue',
    defaultOpen: true,
    shortcut: 1,
  },
  {
    id: 'when',
    label: 'When',
    description: 'Date, time, all-day, weekly hours',
    icon: CalendarClock,
    accent: 'orange',
    defaultOpen: true,
    shortcut: 2,
  },
  {
    id: 'where',
    label: 'Where',
    description: 'Venue selection',
    icon: MapPin,
    accent: 'fern',
    defaultOpen: true,
    shortcut: 3,
  },
  {
    id: 'who',
    label: 'Who',
    description: 'Organizer',
    icon: Users,
    accent: 'magenta',
    defaultOpen: false,
    shortcut: 4,
  },
  {
    id: 'audience',
    label: 'Audience',
    description: 'Good for, age groups',
    icon: Heart,
    accent: 'golden',
    defaultOpen: false,
    shortcut: 5,
  },
  {
    id: 'vibe',
    label: 'Vibe signals',
    description: 'Accessibility, sensory, leave with, music, social, energy',
    icon: Wand2,
    accent: 'teal',
    defaultOpen: false,
    shortcut: 6,
  },
  {
    id: 'money',
    label: 'Money & links',
    description: 'Pricing, ticket URL, external links',
    icon: Tag,
    accent: 'lime',
    defaultOpen: false,
    shortcut: 7,
  },
  {
    id: 'series',
    label: 'Series & collection',
    description: 'Recurrence, parent event, children',
    icon: Layers,
    accent: 'indigo',
    defaultOpen: false,
    shortcut: 8,
  },
  {
    id: 'system',
    label: 'System',
    description: 'Status, audit notes',
    icon: Settings2,
    accent: 'slate',
    defaultOpen: false,
    shortcut: 9,
  },
  {
    id: 'danger',
    label: 'Danger zone',
    description: 'Delete or restore',
    icon: AlertTriangle,
    accent: 'rose',
    defaultOpen: false,
  },
] as const;

// ============================================================================
// SERIES EDIT FORM SECTIONS (tabs)
// ============================================================================
//
// Series page uses tabs rather than collapsibles. Each tab is one of these
// entries. The same metadata shape is reused.

export const SERIES_FORM_TABS: readonly FormSectionMeta[] = [
  {
    id: 'details',
    label: 'Details',
    description: 'Title, descriptions, status, pricing, links, SEO',
    icon: Sparkles,
    accent: 'blue',
    defaultOpen: true,
    shortcut: 1,
  },
  {
    id: 'recurrence',
    label: 'Recurrence',
    description: 'Schedule rule and date regeneration',
    icon: Repeat,
    accent: 'indigo',
    defaultOpen: false,
    shortcut: 2,
  },
  {
    id: 'events',
    label: 'Events',
    description: 'Events attached to this series',
    icon: ListChecks,
    accent: 'orange',
    defaultOpen: false,
    shortcut: 3,
  },
  {
    id: 'danger',
    label: 'Danger zone',
    description: 'Cancel or delete the series',
    icon: AlertTriangle,
    accent: 'rose',
    defaultOpen: false,
    shortcut: 4,
  },
] as const;

/** Lookup helper — id → meta, with a forgiving fallback. */
export function findSection(
  catalog: readonly FormSectionMeta[],
  id: string,
): FormSectionMeta | undefined {
  return catalog.find((s) => s.id === id);
}
