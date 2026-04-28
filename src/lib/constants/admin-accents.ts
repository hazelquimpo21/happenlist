/**
 * ADMIN FORM SECTION ACCENT PALETTE
 * ==================================
 * Single source of truth for the visual identity of each admin form section.
 *
 * Each accent token bundles the full class set that section uses — stripe
 * color, icon background, focus ring, hover tint. Class strings are
 * enumerated explicitly (NOT dynamically concatenated) so Tailwind's JIT
 * picks them up at build time.
 *
 * Used by:
 *   - components/admin/form-shell/form-section.tsx
 *   - components/admin/form-shell/section-toc.tsx
 *   - constants/admin-form-sections.ts
 *
 * If you add a new accent, add it here and to the SectionAccent union.
 *
 * @module lib/constants/admin-accents
 */

export type SectionAccent =
  | 'blue'
  | 'orange'
  | 'fern'
  | 'magenta'
  | 'golden'
  | 'teal'
  | 'lime'
  | 'plum'
  | 'indigo'
  | 'slate'
  | 'rose';

export interface AccentClasses {
  /** 4px left stripe color */
  stripe: string;
  /** Soft background tint behind the icon (12% opacity) */
  iconBg: string;
  /** Solid icon foreground color */
  iconText: string;
  /** Section title text color (in heading row) */
  titleText: string;
  /** Soft tint used as section card background (~5% opacity) */
  cardBg: string;
  /** Border around section card */
  cardBorder: string;
  /** Hex value (for inline styles where Tailwind cannot reach — e.g. SVG fills) */
  hex: string;
}

export const ACCENT_PALETTE: Record<SectionAccent, AccentClasses> = {
  blue: {
    stripe: 'bg-blue',
    iconBg: 'bg-blue/10',
    iconText: 'text-blue',
    titleText: 'text-ink',
    cardBg: 'bg-blue/[0.03]',
    cardBorder: 'border-blue/20',
    hex: '#008bd2',
  },
  orange: {
    stripe: 'bg-orange',
    iconBg: 'bg-orange/10',
    iconText: 'text-orange',
    titleText: 'text-ink',
    cardBg: 'bg-orange/[0.03]',
    cardBorder: 'border-orange/20',
    hex: '#d95927',
  },
  fern: {
    stripe: 'bg-fern',
    iconBg: 'bg-fern/10',
    iconText: 'text-fern',
    titleText: 'text-ink',
    cardBg: 'bg-fern/[0.03]',
    cardBorder: 'border-fern/20',
    hex: '#6BAD5A',
  },
  magenta: {
    stripe: 'bg-magenta',
    iconBg: 'bg-magenta/10',
    iconText: 'text-magenta',
    titleText: 'text-ink',
    cardBg: 'bg-magenta/[0.03]',
    cardBorder: 'border-magenta/20',
    hex: '#D94B7A',
  },
  golden: {
    stripe: 'bg-golden',
    iconBg: 'bg-golden/15',
    iconText: 'text-amber',
    titleText: 'text-ink',
    cardBg: 'bg-golden/[0.04]',
    cardBorder: 'border-golden/30',
    hex: '#e7b746',
  },
  teal: {
    stripe: 'bg-teal',
    iconBg: 'bg-teal/10',
    iconText: 'text-teal',
    titleText: 'text-ink',
    cardBg: 'bg-teal/[0.03]',
    cardBorder: 'border-teal/20',
    hex: '#008e91',
  },
  lime: {
    stripe: 'bg-lime',
    iconBg: 'bg-lime/20',
    iconText: 'text-emerald',
    titleText: 'text-ink',
    cardBg: 'bg-lime/[0.05]',
    cardBorder: 'border-lime/40',
    hex: '#ace671',
  },
  plum: {
    stripe: 'bg-plum',
    iconBg: 'bg-plum/10',
    iconText: 'text-plum',
    titleText: 'text-ink',
    cardBg: 'bg-plum/[0.03]',
    cardBorder: 'border-plum/20',
    hex: '#7B2D8E',
  },
  indigo: {
    stripe: 'bg-indigo',
    iconBg: 'bg-indigo/10',
    iconText: 'text-indigo',
    titleText: 'text-ink',
    cardBg: 'bg-indigo/[0.03]',
    cardBorder: 'border-indigo/20',
    hex: '#5B4FC4',
  },
  slate: {
    stripe: 'bg-slate',
    iconBg: 'bg-slate/10',
    iconText: 'text-slate',
    titleText: 'text-ink',
    cardBg: 'bg-cloud/40',
    cardBorder: 'border-mist',
    hex: '#2A2A2E',
  },
  rose: {
    stripe: 'bg-rose',
    iconBg: 'bg-rose/10',
    iconText: 'text-rose',
    titleText: 'text-ink',
    cardBg: 'bg-rose/[0.04]',
    cardBorder: 'border-rose/30',
    hex: '#F43F5E',
  },
};

export function getAccent(token: SectionAccent): AccentClasses {
  return ACCENT_PALETTE[token];
}
