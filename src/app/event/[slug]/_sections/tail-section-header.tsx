/**
 * <TailSectionHeader> — page-local editorial header for the sections below
 * the HowItFeelsSection (Schedule / Siblings / Similar events).
 *
 * The shared <SectionHeader> component is tuned for homepage lists and
 * doesn't match the event detail's poster-editorial voice. This one does —
 * mono eyebrow + bold display headline, same pattern used in HowItFeels and
 * WhyWePicked.
 */

import { SectionLabel } from '@/components/ui';

interface TailSectionHeaderProps {
  /** Mono uppercase eyebrow, e.g. "MORE LIKE THIS" */
  eyebrow: string;
  /** Bold display headline, e.g. "If you liked this, look at…" */
  headline: string;
  accentColor?: string;
  className?: string;
}

export function TailSectionHeader({
  eyebrow,
  headline,
  accentColor,
  className,
}: TailSectionHeaderProps) {
  return (
    <header className={`mb-6 ${className ?? ''}`}>
      <SectionLabel color={accentColor} className="mb-2">
        {eyebrow}
      </SectionLabel>
      <h2 className="font-body text-3xl md:text-4xl font-extrabold tracking-tight text-ink leading-[1.05]">
        {headline}
      </h2>
    </header>
  );
}
