/**
 * CATEGORY COLOR MAP
 * ==================
 * Maps event category slugs to their visual identity colors.
 * Used across EventCard, SeriesCard, category pages, and badges
 * to give each category a distinct, recognizable look.
 *
 * Usage:
 *   import { getCategoryColor } from '@/lib/constants/category-colors';
 *   const colors = getCategoryColor('music');
 *   // -> { bg: '#7C3AED', text: '#FFFFFF', accent: '#7C3AED', light: 'rgba(124,58,237,0.1)' }
 */

export interface CategoryColor {
  /** Saturated color for badge backgrounds */
  bg: string;
  /** Text color for contrast on bg (white or dark) */
  text: string;
  /** Border/stripe accent color */
  accent: string;
  /** 10% opacity tint for card backgrounds */
  light: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  music: {
    bg: '#7C3AED',
    text: '#FFFFFF',
    accent: '#7C3AED',
    light: 'rgba(124,58,237,0.1)',
  },
  arts: {
    bg: '#0D9488',
    text: '#FFFFFF',
    accent: '#0D9488',
    light: 'rgba(13,148,136,0.1)',
  },
  food: {
    bg: '#EA580C',
    text: '#FFFFFF',
    accent: '#EA580C',
    light: 'rgba(234,88,12,0.1)',
  },
  family: {
    bg: '#F59E0B',
    text: '#2D2A26',
    accent: '#F59E0B',
    light: 'rgba(245,158,11,0.1)',
  },
  sports: {
    bg: '#3B82F6',
    text: '#FFFFFF',
    accent: '#3B82F6',
    light: 'rgba(59,130,246,0.1)',
  },
  community: {
    bg: '#E07A5F',
    text: '#FFFFFF',
    accent: '#E07A5F',
    light: 'rgba(224,122,95,0.1)',
  },
  nightlife: {
    bg: '#6366F1',
    text: '#FFFFFF',
    accent: '#6366F1',
    light: 'rgba(99,102,241,0.1)',
  },
  classes: {
    bg: '#059669',
    text: '#FFFFFF',
    accent: '#059669',
    light: 'rgba(5,150,105,0.1)',
  },
  festivals: {
    bg: '#BE185D',
    text: '#FFFFFF',
    accent: '#BE185D',
    light: 'rgba(190,24,93,0.1)',
  },
  workshops: {
    bg: '#8B5CF6',
    text: '#FFFFFF',
    accent: '#8B5CF6',
    light: 'rgba(139,92,246,0.1)',
  },
  default: {
    bg: '#E07A5F',
    text: '#FFFFFF',
    accent: '#E07A5F',
    light: 'rgba(224,122,95,0.1)',
  },
};

/**
 * Get the color object for a category slug.
 * Returns the default (coral) color if the slug is null or not found.
 *
 * @param slug - The category slug (e.g. 'music', 'food') or null
 * @returns The CategoryColor object with bg, text, accent, and light values
 */
export function getCategoryColor(slug: string | null): CategoryColor {
  if (!slug) return CATEGORY_COLORS.default;
  return CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.default;
}
