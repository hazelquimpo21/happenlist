/**
 * <StampedRow> — monospace quick-hits bar under the PosterHero.
 *
 * Replaces the old bordered "Price & audience" box. Typographic, no border.
 * Inline chips separated by pale slash dividers. Linked good-for tags send
 * visitors back to filtered /events results.
 */

import Link from 'next/link';
import { AccessBadge } from '@/components/events';
import type { GoodForTag } from '@/types';

interface StampedRowProps {
  priceSummary: string | null;
  ageSummary: string | null;
  accessType: string | null;
  isFree: boolean;
  goodForTags: GoodForTag[];
}

function Divider() {
  return (
    <span className="opacity-25" aria-hidden="true">
      /
    </span>
  );
}

export function StampedRow({
  priceSummary,
  ageSummary,
  accessType,
  isFree,
  goodForTags,
}: StampedRowProps) {
  const chips: React.ReactNode[] = [];

  if (priceSummary) {
    chips.push(
      <span key="price" className={priceSummary === 'FREE' ? 'text-emerald' : ''}>
        {priceSummary}
      </span>,
    );
  }
  if (ageSummary) chips.push(<span key="age">{ageSummary}</span>);
  if (accessType) {
    chips.push(
      <span key="access">
        <AccessBadge accessType={accessType} isFree={isFree} />
      </span>,
    );
  }
  goodForTags.slice(0, 3).forEach((tag) => {
    chips.push(
      <Link
        key={`gf-${tag.slug}`}
        href={`/events?goodFor=${tag.slug}`}
        className="hover:text-blue transition-colors"
      >
        {tag.label}
      </Link>,
    );
  });

  if (chips.length === 0) return null;

  // Interleave dividers
  const interleaved: React.ReactNode[] = [];
  chips.forEach((chip, i) => {
    if (i > 0) interleaved.push(<Divider key={`div-${i}`} />);
    interleaved.push(chip);
  });

  return (
    <div className="w-full bg-cream border-b border-mist">
      <div className="container mx-auto px-4 md:px-6 py-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] font-bold tracking-[0.12em] uppercase text-ink">
        {interleaved}
      </div>
    </div>
  );
}
