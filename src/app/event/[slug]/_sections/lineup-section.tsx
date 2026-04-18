/**
 * <LineupSection> — festival-bill typography for linked performers.
 *
 * Headliner gets oversized display type; support acts descend in size.
 * Role labels rendered in mono tracked uppercase. Each performer is a
 * clickable avatar → performer page.
 *
 * Does NOT handle the legacy `talent_name / talent_bio` fallback — that
 * case renders inline in page.tsx because it's much simpler and doesn't
 * need the bill composition.
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
    bio?: string | null;
  };
}

interface LineupSectionProps {
  performers: Performer[];
  accentColor: string;
}

export function LineupSection({ performers, accentColor }: LineupSectionProps) {
  if (performers.length === 0) return null;

  return (
    <section>
      <SectionLabel className="mb-4">
        {performers.length === 1 ? 'Featured artist' : 'Lineup'}
      </SectionLabel>
      <ul className="space-y-5">
        {performers.map((ep) => {
          const isHeadliner = ep.role === 'headliner' || ep.billing_order === 1;
          return (
            <li key={ep.id} className="flex items-start gap-4">
              <Link href={`/performer/${ep.performer.slug}`} className="flex-shrink-0">
                {ep.performer.image_url ? (
                  <Image
                    src={ep.performer.image_url}
                    alt={ep.performer.name}
                    width={isHeadliner ? 72 : 52}
                    height={isHeadliner ? 72 : 52}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`rounded-full flex items-center justify-center ${isHeadliner ? 'w-[72px] h-[72px]' : 'w-[52px] h-[52px]'}`}
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <Mic2
                      className={isHeadliner ? 'w-7 h-7' : 'w-5 h-5'}
                      style={{ color: accentColor }}
                    />
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Link
                    href={`/performer/${ep.performer.slug}`}
                    className={`font-extrabold text-ink hover:text-blue transition-colors leading-none tracking-tight ${
                      isHeadliner ? 'text-3xl md:text-4xl' : 'text-lg md:text-xl'
                    }`}
                  >
                    {ep.performer.name}
                  </Link>
                  <span
                    className="font-mono text-[9px] font-bold tracking-[0.25em] uppercase"
                    style={{ color: accentColor }}
                  >
                    {getPerformerRoleLabel(ep.role ?? '')}
                  </span>
                </div>
                {ep.performer.genre && (
                  <p className="mt-1 text-sm text-zinc">{ep.performer.genre}</p>
                )}
                {isHeadliner && ep.performer.bio && (
                  <p className="mt-2 text-sm text-zinc leading-relaxed line-clamp-3">
                    {ep.performer.bio}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
