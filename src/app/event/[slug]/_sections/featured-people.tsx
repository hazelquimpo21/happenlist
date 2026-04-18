/**
 * <FeaturedPeople> — compact sidebar card listing performers / instructors.
 *
 * The previous "Part I · The people" chapter was too prominent for what is
 * ultimately secondary info (full bios + photos live on the performer page).
 * This compact card keeps the clickable names/avatars/roles reachable in the
 * sidebar without a full chapter.
 *
 * Small avatars (40px), names as links, role as mono tracked caps. Shows up
 * to 5 performers then a "+N more" overflow link to the first performer's
 * page (which tends to be the headliner — a reasonable landing for "see all").
 *
 * Hides entirely when there are no linked performers AND no legacy talent_name.
 * Falls back to the legacy talent_name/talent_bio as a single row.
 *
 * Cross-file coupling:
 *   - src/app/event/[slug]/page.tsx — rendered below <TicketStub>
 */

import Image from 'next/image';
import Link from 'next/link';
import { Mic2 } from 'lucide-react';
import { SectionLabel } from '@/components/ui';
import { getPerformerRoleLabel } from '@/types';

interface Performer {
  id: string;
  role: string | null;
  billing_order?: number | null;
  performer: {
    name: string;
    slug: string;
    image_url?: string | null;
    genre?: string | null;
  };
}

interface FeaturedPeopleProps {
  performers?: Performer[] | null;
  /** Legacy fallback when no linked performers exist */
  legacyTalentName?: string | null;
  accentColor: string;
  /** Label — defaults to "Featured" (works across music/classes/etc). */
  label?: string;
  /** Max performers before overflow. Default 5. */
  max?: number;
}

export function FeaturedPeople({
  performers,
  legacyTalentName,
  accentColor,
  label = 'Featured',
  max = 5,
}: FeaturedPeopleProps) {
  const hasPerformers = !!(performers && performers.length > 0);
  if (!hasPerformers && !legacyTalentName) return null;

  return (
    <section
      aria-label={label}
      className="p-5 bg-pure border border-mist"
    >
      <SectionLabel className="mb-4">{label}</SectionLabel>

      {hasPerformers ? (
        <ul className="space-y-3">
          {performers!.slice(0, max).map((ep) => (
            <li key={ep.id}>
              <Link
                href={`/performer/${ep.performer.slug}`}
                className="flex items-center gap-3 group"
              >
                <span className="flex-shrink-0">
                  {ep.performer.image_url ? (
                    <Image
                      src={ep.performer.image_url}
                      alt={ep.performer.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex items-center justify-center w-10 h-10 rounded-full"
                      style={{ backgroundColor: `${accentColor}15` }}
                    >
                      <Mic2 className="w-4 h-4" style={{ color: accentColor }} />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sm text-ink group-hover:text-blue transition-colors truncate">
                    {ep.performer.name}
                  </span>
                  <span
                    className="block font-mono text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5"
                    style={{ color: accentColor }}
                  >
                    {getPerformerRoleLabel(ep.role ?? '')}
                  </span>
                </span>
              </Link>
            </li>
          ))}
          {performers!.length > max && (
            <li>
              <Link
                href={`/performer/${performers![0].performer.slug}`}
                className="block pt-2 text-xs text-zinc hover:text-blue transition-colors"
              >
                +{performers!.length - max} more
              </Link>
            </li>
          )}
        </ul>
      ) : legacyTalentName ? (
        <p className="flex items-center gap-3">
          <span
            className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <Mic2 className="w-4 h-4" style={{ color: accentColor }} />
          </span>
          <span className="font-bold text-sm text-ink">{legacyTalentName}</span>
        </p>
      ) : null}
    </section>
  );
}
