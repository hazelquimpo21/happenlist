/**
 * <OrganizerQuote> — collapsible pastel box with organizer_description.
 *
 * Pastel background tinted from the category accent color (~10% alpha).
 * Collapsed by default via native <details>; expand to read. Smaller body
 * font, non-italic, relaxed leading for readability.
 *
 * Signature only renders when the organizer is a separate entity from the
 * venue (i.e. not organizer_is_venue).
 */

import { ChevronDown, Quote } from 'lucide-react';
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
    <details
      className="group rounded-2xl p-5 md:p-6 [&_summary::-webkit-details-marker]:hidden"
      style={{ backgroundColor: `${accentColor}15` }}
    >
      <summary className="flex items-center gap-3 cursor-pointer list-none">
        <Quote
          className="w-5 h-5 shrink-0"
          style={{ color: accentColor }}
          aria-hidden="true"
        />
        <SectionLabel className="flex-1">From the organizer</SectionLabel>
        <ChevronDown
          className="w-4 h-4 text-zinc transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="mt-4">
        <blockquote className="text-body-sm md:text-body text-slate leading-relaxed whitespace-pre-wrap">
          {body}
        </blockquote>
        {showSignature && (
          <figcaption className="mt-3 font-mono text-[11px] font-bold tracking-[0.1em] uppercase text-zinc">
            — {organizerName}
          </figcaption>
        )}
      </div>
    </details>
  );
}
