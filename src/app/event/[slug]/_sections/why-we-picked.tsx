/**
 * <WhyWePicked> — editorial pull-quote for happenlist_summary.
 *
 * Replaces the old "Happenlist Highlights" bordered card. Double ink rule
 * above + below, no box, italic editorial voice. The label takes its color
 * from the category accent so each page has a hint of identity.
 */

import { Sparkles } from 'lucide-react';
import { SectionLabel } from '@/components/ui';

interface WhyWePickedProps {
  summary: string;
  accentColor: string;
}

export function WhyWePicked({ summary, accentColor }: WhyWePickedProps) {
  return (
    <section className="border-t-2 border-b-2 border-ink py-8">
      <SectionLabel icon={Sparkles} color={accentColor} className="mb-4">
        Why we picked this
      </SectionLabel>
      <p className="text-2xl md:text-[26px] font-medium italic leading-snug tracking-tight text-ink">
        {summary}
      </p>
    </section>
  );
}
