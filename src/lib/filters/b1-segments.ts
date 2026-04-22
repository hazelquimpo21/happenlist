/**
 * =============================================================================
 * B1 SEGMENTED PICKER — segment config (single source of truth)
 * =============================================================================
 *
 * Declares the 4 segments that appear in the B1 picker, in visual order:
 *   Category · When · Good for · Budget
 *
 * The picker shell (segmented-picker.tsx) renders segments from this config.
 * Each segment has a stable `id` used as the Radix Popover trigger key, and
 * a label/icon pair rendered in the pill's label line.
 *
 * The VALUE line (the bold line below the label) is NOT configured here —
 * it's computed per-segment from the current FilterState, because different
 * segments have different accent-color rules and formatting. See
 * segment-value.ts for the formatters.
 *
 * If you add a segment:
 *   1. Add an entry to SEGMENTS
 *   2. Add a popover component in ./segments/<id>-popover.tsx
 *   3. Add a formatter in segment-value.ts
 *   4. Mirror the rendering switch in segmented-picker.tsx
 * =============================================================================
 */

export type SegmentId = 'category' | 'when' | 'good-for' | 'budget';

export interface SegmentConfig {
  id: SegmentId;
  /** Uppercase label rendered above the value line. */
  label: string;
  /** Placeholder shown on the value line when the segment has no selection. */
  placeholder: string;
  /** Accessibility label for the popover trigger. */
  ariaLabel: string;
}

export const SEGMENTS: readonly SegmentConfig[] = [
  {
    id: 'category',
    label: 'Category',
    placeholder: 'Any category',
    ariaLabel: 'Filter by category',
  },
  {
    id: 'when',
    label: 'When',
    placeholder: 'Anytime',
    ariaLabel: 'Filter by date or time',
  },
  {
    id: 'good-for',
    label: 'Good for',
    placeholder: 'Anything',
    ariaLabel: 'Filter by what it\u2019s good for',
  },
  {
    id: 'budget',
    label: 'Budget',
    placeholder: 'Any price',
    ariaLabel: 'Filter by budget',
  },
] as const;

export const SEGMENT_BY_ID: Record<SegmentId, SegmentConfig> = Object.fromEntries(
  SEGMENTS.map((s) => [s.id, s])
) as Record<SegmentId, SegmentConfig>;
