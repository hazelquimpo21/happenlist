/**
 * CATEGORY COLOR MAP — v3 Redesign
 * =================================
 * Maps event category slugs to their visual identity colors.
 * City festival poster palette: bold, multi-chromatic, all unique.
 *
 * Usage:
 *   import { getCategoryColor } from '@/lib/constants/category-colors';
 *   const colors = getCategoryColor('music');
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

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  music: {
    bg: '#008bd2',
    text: '#FFFFFF',
    accent: '#008bd2',
    light: 'rgba(0,139,210,0.12)',
  },
  arts: {
    bg: '#008e91',
    text: '#FFFFFF',
    accent: '#008e91',
    light: 'rgba(0,142,145,0.12)',
  },
  food: {
    bg: '#d95927',
    text: '#FFFFFF',
    accent: '#d95927',
    light: 'rgba(217,89,39,0.12)',
  },
  family: {
    bg: '#e7b746',
    text: '#020203',
    accent: '#e7b746',
    light: 'rgba(231,183,70,0.12)',
  },
  sports: {
    bg: '#E85D45',
    text: '#FFFFFF',
    accent: '#E85D45',
    light: 'rgba(232,93,69,0.12)',
  },
  community: {
    bg: '#D94B7A',
    text: '#FFFFFF',
    accent: '#D94B7A',
    light: 'rgba(217,75,122,0.12)',
  },
  nightlife: {
    bg: '#7B2D8E',
    text: '#FFFFFF',
    accent: '#7B2D8E',
    light: 'rgba(123,45,142,0.12)',
  },
  classes: {
    bg: '#009768',
    text: '#FFFFFF',
    accent: '#009768',
    light: 'rgba(0,151,104,0.12)',
  },
  festivals: {
    bg: '#d48700',
    text: '#FFFFFF',
    accent: '#d48700',
    light: 'rgba(212,135,0,0.12)',
  },
  workshops: {
    bg: '#5B4FC4',
    text: '#FFFFFF',
    accent: '#5B4FC4',
    light: 'rgba(91,79,196,0.12)',
  },
  markets: {
    bg: '#ace671',
    text: '#020203',
    accent: '#ace671',
    light: 'rgba(172,230,113,0.12)',
  },
  talks: {
    bg: '#008bd2',
    text: '#FFFFFF',
    accent: '#008bd2',
    light: 'rgba(0,139,210,0.12)',
  },
  outdoors: {
    bg: '#6BAD5A',
    text: '#FFFFFF',
    accent: '#6BAD5A',
    light: 'rgba(107,173,90,0.12)',
  },
  charity: {
    bg: '#D94B7A',
    text: '#FFFFFF',
    accent: '#D94B7A',
    light: 'rgba(217,75,122,0.12)',
  },
  holiday: {
    bg: '#e7b746',
    text: '#020203',
    accent: '#e7b746',
    light: 'rgba(231,183,70,0.12)',
  },
  default: {
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
