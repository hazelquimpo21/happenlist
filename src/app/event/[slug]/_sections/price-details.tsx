/**
 * <PriceDetails> — free-form pricing notes (price_details field).
 *
 * Often empty. When populated, organizers write things like "kids under 5
 * free, $5 at door, cash only" — worth showing verbatim in a small section
 * since the short price summary in the stamped row can't capture it.
 */

import { SectionLabel } from '@/components/ui';

interface PriceDetailsProps {
  details: string;
}

export function PriceDetails({ details }: PriceDetailsProps) {
  return (
    <section>
      <SectionLabel className="mb-2">Pricing details</SectionLabel>
      <p className="text-zinc leading-relaxed">{details}</p>
    </section>
  );
}
