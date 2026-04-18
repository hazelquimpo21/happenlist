/**
 * <OrganizerQuote> — pull-quote from organizer_description.
 *
 * Oversized quote glyph + category-accent left rule. No bordered box.
 * Signature only renders when the organizer is a separate entity from the
 * venue (i.e. not organizer_is_venue). Prevents "— Turner Hall" from
 * appearing under a quote that's clearly from Turner Hall already.
 */

import { Quote } from 'lucide-react';
import { SectionLabel } from '@/components/ui';

interface OrganizerQuoteProps {
  body: string;
  accentColor: string;
  organizerName?: string | null;
  organizerIsVenue?: boolean | null;
}

export function OrganizerQuote({
  body,
  accentColor,
  organizerName,
  organizerIsVenue,
}: OrganizerQuoteProps) {
  const showSignature = organizerName && !organizerIsVenue;

  return (
    <figure className="relative pl-6 border-l-4" style={{ borderColor: accentColor }}>
      <Quote
        className="w-8 h-8 mb-3"
        style={{ color: accentColor }}
        aria-hidden="true"
      />
      <SectionLabel className="mb-3">From the organizer</SectionLabel>
      <blockquote className="text-xl md:text-2xl font-medium italic leading-snug text-ink whitespace-pre-wrap">
        {body}
      </blockquote>
      {showSignature && (
        <figcaption className="mt-4 font-mono text-xs font-bold tracking-[0.1em] uppercase text-zinc">
          — {organizerName}
        </figcaption>
      )}
    </figure>
  );
}
