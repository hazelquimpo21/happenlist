/**
 * <AboutSection> — editorial body copy with drop-cap on first paragraph.
 *
 * Uses the `prose-event--dropcap` modifier defined in globals.css. The
 * drop-cap color is driven by --drop-cap-color CSS var set inline from the
 * category accent, so each category gets a hint of identity in the copy.
 *
 * Splits on paragraph breaks (\n\n) so the drop-cap selector (first-of-type
 * first-letter) has a real first paragraph to hit. Raw HTML not supported —
 * description is plain text from the DB.
 */

import { SectionLabel } from '@/components/ui';

interface AboutSectionProps {
  description: string;
  accentColor: string;
}

export function AboutSection({ description, accentColor }: AboutSectionProps) {
  const paragraphs = description.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 0) return null;

  return (
    <section>
      <SectionLabel className="mb-4">About this event</SectionLabel>
      <div
        className="prose-event prose-event--dropcap text-lg leading-relaxed whitespace-pre-wrap"
        style={{ ['--drop-cap-color' as string]: accentColor } as React.CSSProperties}
      >
        {paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </section>
  );
}
