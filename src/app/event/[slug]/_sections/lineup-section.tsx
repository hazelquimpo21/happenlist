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
  /** 'dark' flips text colors to cream for rendering on dark-bg chapter asides. */
  variant?: 'default' | 'dark';
}

export function LineupSection({ performers, accentColor, variant = 'default' }: LineupSectionProps) {
  const isDark = variant === 'dark';
  const nameClass = isDark ? 'text-cream hover:text-cream/80' : 'text-ink hover:text-blue';
  const metaClass = isDark ? 'text-cream/60' : 'text-zinc';
  const avatarBgClass = isDark ? 'bg-cream/10' : '';
  const avatarBgStyle = isDark
    ? undefined
    : { backgroundColor: `${accentColor}15` };
  if (performers.length === 0) return null;

  return (
    <section>
      {/* When rendered inside a Chapter (dark variant), the Chapter already
          carries the eyebrow. Hide the redundant internal label. */}
      {variant !== 'dark' && (
        <SectionLabel className="mb-4">
          {performers.length === 1 ? 'Featured artist' : 'Lineup'}
        </SectionLabel>
      )}
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
                    className={`rounded-full flex items-center justify-center ${isHeadliner ? 'w-[72px] h-[72px]' : 'w-[52px] h-[52px]'} ${avatarBgClass}`}
                    style={avatarBgStyle}
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
                    className={`font-extrabold ${nameClass} transition-colors leading-none tracking-tight ${
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
                  <p className={`mt-1 text-sm ${metaClass}`}>{ep.performer.genre}</p>
                )}
                {isHeadliner && ep.performer.bio && (
                  <p className={`mt-2 text-sm ${metaClass} leading-relaxed line-clamp-3`}>
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
