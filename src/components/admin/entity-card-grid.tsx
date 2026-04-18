/**
 * ADMIN ENTITY CARD GRID
 * ======================
 * Generic card grid for the four Directory entities
 * (organizers, venues, performers, membership_orgs).
 *
 * Pure presentation — no bulk-select / merge in v1. If the user asks for
 * those later, mirror admin-series-grid.tsx.
 *
 * Each card links to `/admin/<urlSlug>/<id>/edit`.
 */

import Link from 'next/link';
import { Image as ImageIcon, Calendar, ShieldCheck, Ticket, EyeOff } from 'lucide-react';
import { ADMIN_ENTITIES, type AdminEntityKind } from '@/lib/constants/admin-entities';
import type { AdminEntityCard } from '@/data/admin/get-admin-entities';

interface EntityCardGridProps {
  kind: AdminEntityKind;
  entities: AdminEntityCard[];
}

const BADGE_STYLE: Record<string, { className: string; label: string; icon?: React.ReactNode }> = {
  verified: {
    className: 'bg-emerald/10 text-emerald',
    label: 'Verified',
    icon: <ShieldCheck className="w-3 h-3" />,
  },
  membership_org: {
    className: 'bg-violet-100 text-violet-700',
    label: 'Membership',
    icon: <Ticket className="w-3 h-3" />,
  },
  // Venue types — fall through to a generic style.
};

function renderBadge(rawBadge: string) {
  const preset = BADGE_STYLE[rawBadge];
  if (preset) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${preset.className}`}>
        {preset.icon}
        {preset.label}
      </span>
    );
  }
  // Generic fallback for venue_type etc.
  return (
    <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium bg-stone/10 text-zinc">
      {rawBadge}
    </span>
  );
}

export function EntityCardGrid({ kind, entities }: EntityCardGridProps) {
  const meta = ADMIN_ENTITIES[kind];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {entities.map((entity) => (
        <Link
          key={entity.id}
          href={`/admin/${meta.urlSlug}/${entity.id}/edit`}
          className={`group relative bg-pure border rounded-xl p-4 transition-all block ${
            entity.is_active
              ? 'border-mist hover:shadow-card-lifted hover:-translate-y-0.5'
              : 'border-mist/60 opacity-70 hover:opacity-100'
          }`}
        >
          {/* Inactive banner */}
          {!entity.is_active && (
            <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700">
              <EyeOff className="w-3 h-3" />
              Inactive
            </div>
          )}

          <div className="flex items-start gap-3 mb-3">
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-lg bg-cloud flex-shrink-0 overflow-hidden flex items-center justify-center">
              {entity.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entity.image_url}
                  alt={entity.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-5 h-5 text-zinc" />
              )}
            </div>

            {/* Title + subtitle */}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-ink group-hover:text-blue transition-colors line-clamp-1">
                {entity.name}
              </h3>
              {entity.subtitle && (
                <p className="text-xs text-zinc line-clamp-1 mt-0.5">{entity.subtitle}</p>
              )}
            </div>
          </div>

          {/* Badges */}
          {entity.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {entity.badges.map((b) => (
                <span key={b}>{renderBadge(b)}</span>
              ))}
            </div>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between pt-2 border-t border-mist/50 text-[11px] text-zinc">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {entity.event_count} event{entity.event_count !== 1 ? 's' : ''}
            </span>
            <span className="font-mono">{entity.slug}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
