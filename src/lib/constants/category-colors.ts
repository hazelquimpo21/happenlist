/**
 * CATEGORY COLOR MAP — v3 Redesign
 * =================================
 * Maps event category slugs to their visual identity colors.
 * City festival poster palette: bold, multi-chromatic, all unique.
 *
 * Keyed by the canonical DB `category.slug` (long form like 'food-drink'),
 * NOT the short 'food'. Every consumer calls `getCategoryColor` with whatever
 * comes off `event.category_slug`, which is the DB value — so the map MUST
 * match those values or cards silently fall back to default blue.
 *
 * Short-form aliases (e.g. 'food' → food-drink) are kept at the bottom of
 * the map for backwards compatibility with any call-site that hand-writes
 * a short slug. New code should always use the DB slug.
 *
 * Usage:
 *   import { getCategoryColor } from '@/lib/constants/category-colors';
 *   const colors = getCategoryColor(event.category_slug);
 */

export interface CategoryColor {
  /** Saturated color for badge backgrounds & full-color tiles */
  bg: string;
  /** Text color for contrast on bg (typically white) */
  text: string;
  /** Border/stripe accent color (same as bg) */
  accent: string;
  /** 12% opacity tint for card backgrounds */
  light: string;
}

// Canonical colors by DB category slug. The full 15 live-data slugs are
// documented in docs/CHROME-EXTENSION.md and match the `categories.slug`
// column in Supabase. Theater & Film is its own DB category (was missing
// from the original short-key map, so cards defaulted to blue).
export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  'music': {
    bg: '#008bd2',
    text: '#FFFFFF',
    accent: '#008bd2',
    light: 'rgba(0,139,210,0.12)',
  },
  'arts-culture': {
    bg: '#008e91',
    text: '#FFFFFF',
    accent: '#008e91',
    light: 'rgba(0,142,145,0.12)',
  },
  'food-drink': {
    bg: '#d95927',
    text: '#FFFFFF',
    accent: '#d95927',
    light: 'rgba(217,89,39,0.12)',
  },
  'family': {
    bg: '#e7b746',
    text: '#020203',
    accent: '#e7b746',
    light: 'rgba(231,183,70,0.12)',
  },
  'sports-fitness': {
    bg: '#E85D45',
    text: '#FFFFFF',
    accent: '#E85D45',
    light: 'rgba(232,93,69,0.12)',
  },
  'community': {
    bg: '#D94B7A',
    text: '#FFFFFF',
    accent: '#D94B7A',
    light: 'rgba(217,75,122,0.12)',
  },
  'nightlife': {
    bg: '#7B2D8E',
    text: '#FFFFFF',
    accent: '#7B2D8E',
    light: 'rgba(123,45,142,0.12)',
  },
  'classes-workshops': {
    bg: '#009768',
    text: '#FFFFFF',
    accent: '#009768',
    light: 'rgba(0,151,104,0.12)',
  },
  'festivals': {
    bg: '#d48700',
    text: '#FFFFFF',
    accent: '#d48700',
    light: 'rgba(212,135,0,0.12)',
  },
  // Theater & Film — new, distinct color; missing from the original map so
  // all theater/film cards previously rendered default blue.
  'theater-film': {
    bg: '#B03A56',
    text: '#FFFFFF',
    accent: '#B03A56',
    light: 'rgba(176,58,86,0.12)',
  },
  'markets-shopping': {
    bg: '#ace671',
    text: '#020203',
    accent: '#ace671',
    light: 'rgba(172,230,113,0.12)',
  },
  'talks-lectures': {
    bg: '#5B4FC4',
    text: '#FFFFFF',
    accent: '#5B4FC4',
    light: 'rgba(91,79,196,0.12)',
  },
  'outdoors-nature': {
    bg: '#6BAD5A',
    text: '#FFFFFF',
    accent: '#6BAD5A',
    light: 'rgba(107,173,90,0.12)',
  },
  'charity-fundraising': {
    bg: '#C64B6B',
    text: '#FFFFFF',
    accent: '#C64B6B',
    light: 'rgba(198,75,107,0.12)',
  },
  'holiday-seasonal': {
    bg: '#e7b746',
    text: '#020203',
    accent: '#e7b746',
    light: 'rgba(231,183,70,0.12)',
  },

  // ── Short-key aliases (backwards compat for old call sites) ────────────────
  // Any code that hand-wrote 'food', 'arts', etc. still works. New code should
  // pass the DB slug directly so we don't need to maintain this.
  'arts': {
    bg: '#008e91',
    text: '#FFFFFF',
    accent: '#008e91',
    light: 'rgba(0,142,145,0.12)',
  },
  'food': {
    bg: '#d95927',
    text: '#FFFFFF',
    accent: '#d95927',
    light: 'rgba(217,89,39,0.12)',
  },
  'sports': {
    bg: '#E85D45',
    text: '#FFFFFF',
    accent: '#E85D45',
    light: 'rgba(232,93,69,0.12)',
  },
  'classes': {
    bg: '#009768',
    text: '#FFFFFF',
    accent: '#009768',
    light: 'rgba(0,151,104,0.12)',
  },
  'workshops': {
    bg: '#5B4FC4',
    text: '#FFFFFF',
    accent: '#5B4FC4',
    light: 'rgba(91,79,196,0.12)',
  },
  'markets': {
    bg: '#ace671',
    text: '#020203',
    accent: '#ace671',
    light: 'rgba(172,230,113,0.12)',
  },
  'talks': {
    bg: '#5B4FC4',
    text: '#FFFFFF',
    accent: '#5B4FC4',
    light: 'rgba(91,79,196,0.12)',
  },
  'outdoors': {
    bg: '#6BAD5A',
    text: '#FFFFFF',
    accent: '#6BAD5A',
    light: 'rgba(107,173,90,0.12)',
  },
  'charity': {
    bg: '#C64B6B',
    text: '#FFFFFF',
    accent: '#C64B6B',
    light: 'rgba(198,75,107,0.12)',
  },
  'holiday': {
    bg: '#e7b746',
    text: '#020203',
    accent: '#e7b746',
    light: 'rgba(231,183,70,0.12)',
  },

  'default': {
    bg: '#008bd2',
    text: '#FFFFFF',
    accent: '#008bd2',
    light: 'rgba(0,139,210,0.12)',
  },
};

/**
 * Get the color object for a category slug.
 * Returns the default (blue) color if the slug is null or not found.
 */
export function getCategoryColor(slug: string | null): CategoryColor {
  if (!slug) return CATEGORY_COLORS.default;
  return CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.default;
}
