/**
 * =============================================================================
 * <Sticker> — rotated callout primitive
 * =============================================================================
 *
 * Part of the event-detail "ticket stub" redesign language (2026-04-18).
 * Replaces the generic rose/amber/violet timing pills and tinted category
 * badges with a single rotated, drop-shadowed sticker vocabulary.
 *
 * Where this shows up:
 *   - PosterHero: category + timing stickers on the hero image
 *   - page.tsx: personality_badges render as a sticker row
 *   - page.tsx: SOLD OUT treatment
 *
 * If you add a new variant, keep the set small. The sticker is supposed to
 * feel like a gesture, not a chip system.
 * =============================================================================
 */

import { cn } from '@/lib/utils';

type Variant =
  | 'category' // category accent bg, white text — pass bgColor
  | 'timing' // brand blue
  | 'warning' // rose — sensory strobe, sold-out
  | 'dark' // ink bg, cream text
  | 'cream' // cream bg, ink text
  | 'pure'; // white bg, ink text (for use on dark fields)

type Rotate = -5 | -3 | -2 | 0 | 2 | 3 | 5;

interface StickerProps {
  children: React.ReactNode;
  variant?: Variant;
  rotate?: Rotate;
  /** Override bg (used with variant='category' to inject the event's category accent). */
  bgColor?: string;
  /** Override text color when bgColor is passed. */
  textColor?: string;
  className?: string;
  'aria-hidden'?: boolean;
}

const ROTATE_MAP: Record<Rotate, string> = {
  '-5': '-rotate-[5deg]',
  '-3': '-rotate-[3deg]',
  '-2': '-rotate-[2deg]',
  '0': 'rotate-0',
  '2': 'rotate-[2deg]',
  '3': 'rotate-[3deg]',
  '5': 'rotate-[5deg]',
};

const VARIANT_CLASSES: Record<Variant, string> = {
  category: 'bg-blue text-pure', // default fallback; override via bgColor
  timing: 'bg-blue text-pure',
  warning: 'bg-rose text-pure',
  dark: 'bg-ink text-cream',
  cream: 'bg-cream text-ink border border-ink/10',
  pure: 'bg-pure text-ink',
};

export function Sticker({
  children,
  variant = 'dark',
  rotate = -3,
  bgColor,
  textColor,
  className,
  'aria-hidden': ariaHidden,
}: StickerProps) {
  const useInlineColor = bgColor != null;
  return (
    <span
      aria-hidden={ariaHidden}
      style={
        useInlineColor
          ? { backgroundColor: bgColor, color: textColor ?? '#FFFFFF' }
          : undefined
      }
      className={cn(
        'inline-flex items-center px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.15em]',
        'shadow-[0_4px_12px_rgba(0,0,0,0.2)]',
        ROTATE_MAP[rotate],
        !useInlineColor && VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
