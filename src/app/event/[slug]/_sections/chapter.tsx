/**
 * <Chapter> — narrative break in the event-detail main column.
 *
 * The detail page is structured as four parts:
 *   I   · The pitch       (why this, editorial)
 *   II  · The lineup      (who's performing, dark aside)
 *   III · The details     (practical info, default)
 *   IV  · How it feels    (signals — its own full-bleed section, see
 *         HowItFeelsSection — uses its own chapter banner, not <Chapter>)
 *
 * This component renders a chapter header (PART N + title) and an optional
 * tinted container around the children.
 *
 * Variants:
 *   - 'default' → no background, no padding, chapter header only
 *   - 'cream'   → cream tinted background with padding (for "aside" moments)
 *   - 'dark'    → ink/night background with cream text (for the lineup —
 *                 feels like the back of a concert ticket)
 *
 * Children inherit the container's color scheme via Tailwind class context.
 * If a child component uses hard-coded text-ink it needs a variant prop of
 * its own (see LineupSection's `variant="dark"`).
 */

import { cn } from '@/lib/utils';

type Variant = 'default' | 'cream' | 'dark';

interface ChapterProps {
  /** Roman numeral, e.g. "I" / "II" / "III" */
  number: string;
  /** Chapter title, e.g. "The pitch" */
  title: string;
  /** Category accent — used on the "PART N" eyebrow */
  accentColor: string;
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<Variant, { bg: string; padding: string }> = {
  default: { bg: '', padding: '' },
  cream: {
    bg: 'bg-cream border border-mist',
    padding: 'p-6 md:p-8 rounded-lg',
  },
  dark: {
    bg: 'bg-night text-cream',
    padding: 'p-6 md:p-10 rounded-lg',
  },
};

export function Chapter({
  number,
  title,
  accentColor,
  variant = 'default',
  children,
  className,
}: ChapterProps) {
  const { bg, padding } = VARIANT_CLASSES[variant];

  return (
    <section className={cn(bg, padding, className)}>
      <header className="mb-8">
        <p
          className="font-mono text-[10px] font-bold tracking-[0.25em] uppercase mb-2"
          style={{ color: variant === 'dark' ? accentColor : accentColor }}
        >
          Part {number}
        </p>
        <h2
          className={cn(
            'font-body text-2xl md:text-3xl font-extrabold tracking-tight leading-none',
            variant === 'dark' ? 'text-cream' : 'text-ink',
          )}
        >
          {title}
        </h2>
      </header>
      <div className="space-y-10 md:space-y-14">{children}</div>
    </section>
  );
}
