/**
 * VIBE PROFILE COMPONENTS
 * =======================
 * Editorial "What's It Actually Like?" section for event detail pages.
 * Includes dimension bars, vibe/subculture tags, crowd profile, noise indicator.
 */

'use client';

import {
  Hammer,
  GraduationCap,
  Users,
  UtensilsCrossed,
  Camera,
  Wind,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventRow } from '@/types';
import {
  SENSORY_TAG_LABELS,
  SENSORY_TAG_PRIORITY,
  LEAVE_WITH_LABELS,
  SOCIAL_MODE_LABELS,
  ENERGY_NEEDED_LABELS,
  isSensoryTag,
  isLeaveWith,
  isSocialMode,
  isEnergyNeeded,
  type SensoryTag,
  type LeaveWith,
  type SocialMode,
  type EnergyNeeded,
} from '@/lib/constants/vocabularies';

// =============================================================================
// CONSTANTS
// =============================================================================

const VIBE_TAG_COLORS: Record<string, { bg: string; text: string }> = {
  // Warm tones (high energy)
  hype: { bg: 'bg-amber-100', text: 'text-amber-800' },
  rowdy: { bg: 'bg-red-100', text: 'text-red-800' },
  'festival-energy': { bg: 'bg-orange-100', text: 'text-orange-800' },
  competitive: { bg: 'bg-rose-100', text: 'text-rose-800' },
  // Cool tones (calm)
  chill: { bg: 'bg-sky-100', text: 'text-sky-800' },
  cozy: { bg: 'bg-blue-100', text: 'text-blue-800' },
  intimate: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  spiritual: { bg: 'bg-violet-100', text: 'text-violet-800' },
  romantic: { bg: 'bg-pink-100', text: 'text-pink-800' },
  // Neutral / creative
  artsy: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
  underground: { bg: 'bg-zinc-200', text: 'text-zinc-800' },
  bougie: { bg: 'bg-amber-50', text: 'text-amber-900' },
  'family-chaos': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  nerdy: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  diy: { bg: 'bg-lime-100', text: 'text-lime-800' },
  corporate: { bg: 'bg-slate-100', text: 'text-slate-700' },
  nostalgic: { bg: 'bg-amber-100', text: 'text-amber-700' },
  experimental: { bg: 'bg-purple-100', text: 'text-purple-800' },
};

const SUBCULTURE_COLORS: Record<string, { bg: string; text: string }> = {
  'indie-music': { bg: 'bg-violet-50', text: 'text-violet-700' },
  'hip-hop': { bg: 'bg-amber-50', text: 'text-amber-700' },
  edm: { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  'punk-diy': { bg: 'bg-red-50', text: 'text-red-700' },
  jazz: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  country: { bg: 'bg-orange-50', text: 'text-orange-700' },
  'craft-beer': { bg: 'bg-amber-50', text: 'text-amber-700' },
  wine: { bg: 'bg-rose-50', text: 'text-rose-700' },
  foodie: { bg: 'bg-orange-50', text: 'text-orange-700' },
  fitness: { bg: 'bg-green-50', text: 'text-green-700' },
  'yoga-wellness': { bg: 'bg-teal-50', text: 'text-teal-700' },
  tech: { bg: 'bg-blue-50', text: 'text-blue-700' },
  startup: { bg: 'bg-sky-50', text: 'text-sky-700' },
  queer: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700' },
  latinx: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  'art-scene': { bg: 'bg-purple-50', text: 'text-purple-700' },
  'theater-kids': { bg: 'bg-pink-50', text: 'text-pink-700' },
  outdoorsy: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  gaming: { bg: 'bg-slate-100', text: 'text-slate-700' },
  sneakerhead: { bg: 'bg-zinc-100', text: 'text-zinc-700' },
  vintage: { bg: 'bg-stone-100', text: 'text-zinc-700' },
  academia: { bg: 'bg-neutral-100', text: 'text-neutral-700' },
  maker: { bg: 'bg-lime-50', text: 'text-lime-700' },
};

const NOISE_LEVELS = {
  quiet: { label: 'Quiet', waves: 1, icon: '🔇' },
  conversational: { label: 'Conversational', waves: 2, icon: '💬' },
  loud: { label: 'Loud', waves: 3, icon: '🔊' },
  deafening: { label: 'Deafening', waves: 4, icon: '📢' },
} as const;

const DIMENSION_CONFIG = [
  { key: 'energy_level', label: 'Energy', low: 'Zen', high: 'Mosh Pit' },
] as const;

// =============================================================================
// DIMENSION BAR
// =============================================================================

function VibeDimensionBar({
  label,
  value,
  lowLabel,
  highLabel,
  accentColor,
}: {
  label: string;
  value: number;
  lowLabel: string;
  highLabel: string;
  accentColor: string;
}) {
  // Convert 1-5 to 0-100 percentage
  const pct = ((value - 1) / 4) * 100;

  // Derive a human-readable description for screen readers
  const srDescription = `${label}: ${value} out of 5, between ${lowLabel} and ${highLabel}`;

  return (
    <div className="space-y-1" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={1} aria-valuemax={5} aria-valuetext={srDescription}>
      <div className="flex items-center justify-between text-xs text-zinc">
        <span className="font-medium text-ink">{label}</span>
        <span className="text-[11px] text-zinc">{value}/5</span>
      </div>
      <div className="relative h-2 bg-cloud rounded-full">
        {/* Filled track for better visual cue */}
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-20"
          style={{ width: `${pct}%`, backgroundColor: accentColor }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full shadow-sm border-2 border-white"
          style={{
            left: `calc(${pct}% - 7px)`,
            backgroundColor: accentColor,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-zinc">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

// =============================================================================
// VIBE TAG PILL
// =============================================================================

export function VibeTagPill({
  tag,
  size = 'sm',
  className,
}: {
  tag: string;
  size?: 'sm' | 'xs';
  className?: string;
}) {
  const colors = VIBE_TAG_COLORS[tag] ?? { bg: 'bg-stone/10', text: 'text-zinc' };
  const label = tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium capitalize',
        colors.bg,
        colors.text,
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[10px]',
        className
      )}
    >
      {label}
    </span>
  );
}

// =============================================================================
// SUBCULTURE TAG PILL
// =============================================================================

function SubculturePill({ tag }: { tag: string }) {
  const colors = SUBCULTURE_COLORS[tag] ?? { bg: 'bg-stone/5', text: 'text-zinc' };
  const label = tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
        colors.bg,
        colors.text,
        'border-current/10'
      )}
    >
      {label}
    </span>
  );
}

// =============================================================================
// NOISE LEVEL INDICATOR
// =============================================================================

export function NoiseLevelIndicator({
  level,
  variant = 'full',
  className,
}: {
  level: string;
  variant?: 'full' | 'icon';
  className?: string;
}) {
  const config = NOISE_LEVELS[level as keyof typeof NOISE_LEVELS];
  if (!config) return null;

  if (variant === 'icon') {
    return (
      <span className={cn('text-xs', className)} title={`Noise: ${config.label}`}>
        {config.icon}
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-end gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'w-1 rounded-full transition-colors',
              i <= config.waves ? 'bg-ink' : 'bg-cloud'
            )}
            style={{ height: `${8 + i * 3}px` }}
          />
        ))}
      </div>
      <span className="text-sm text-ink">{config.label}</span>
    </div>
  );
}

// =============================================================================
// ACCESS BADGE (for event cards)
// =============================================================================

const ACCESS_DISPLAY: Record<string, { label: string; color: string }> = {
  open: { label: 'Just Show Up', color: 'bg-emerald-100 text-emerald-800' },
  ticketed: { label: 'Tickets', color: 'bg-amber-100 text-amber-800' },
  rsvp: { label: 'RSVP Required', color: 'bg-sky-100 text-sky-800' },
  pay_at_door: { label: 'Pay at Door', color: 'bg-amber-50 text-amber-700' },
  registration: { label: 'Register', color: 'bg-sky-100 text-sky-800' },
  membership: { label: 'Members Only', color: 'bg-purple-100 text-purple-800' },
  invite_only: { label: 'Invite Only', color: 'bg-gray-100 text-gray-700' },
};

export function AccessBadge({
  accessType,
  isFree,
  className,
}: {
  accessType: string;
  isFree?: boolean;
  className?: string;
}) {
  const display = ACCESS_DISPLAY[accessType];
  if (!display) return null;

  // Special: free + open
  if (isFree && accessType === 'open') {
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800', className)}>
        Free — Just Show Up
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold', display.color, className)}>
      {display.label}
    </span>
  );
}

// =============================================================================
// SENSORY TAG PILL
// =============================================================================
// Neutral-stone palette — sensory signals are about what the room feels like,
// not how it's vibed. Distinct from VibeTagPill so users don't conflate
// "loud_music" with vibe colors. Strobe gets an amber tint because it's the
// only seizure-relevant signal and earns visual emphasis.

export function SensoryTagPill({
  tag,
  size = 'sm',
  className,
}: {
  tag: SensoryTag;
  size?: 'sm' | 'xs';
  className?: string;
}) {
  const isCritical = tag === 'strobe_lights';
  const colorClasses = isCritical
    ? 'bg-amber-100 text-amber-900'
    : 'bg-stone-100 text-stone-700';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        colorClasses,
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[10px]',
        className
      )}
    >
      {SENSORY_TAG_LABELS[tag]}
    </span>
  );
}

// =============================================================================
// LEAVE-WITH PILL
// =============================================================================

const LEAVE_WITH_ICONS: Record<LeaveWith, LucideIcon> = {
  a_thing_you_made: Hammer,
  a_new_skill: GraduationCap,
  a_new_connection: Users,
  a_full_belly: UtensilsCrossed,
  a_photo_or_memory: Camera,
  a_shifted_mood: Wind,
  just_an_experience: Sparkles,
};

export function LeaveWithPill({
  tag,
  size = 'sm',
  className,
}: {
  tag: LeaveWith;
  size?: 'sm' | 'xs';
  className?: string;
}) {
  const Icon = LEAVE_WITH_ICONS[tag];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        'bg-emerald-50 text-emerald-800',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[10px]',
        className
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-2.5 h-2.5'} aria-hidden="true" />
      <span>{LEAVE_WITH_LABELS[tag]}</span>
    </span>
  );
}

// =============================================================================
// SOCIAL-MODE / ENERGY-NEEDED PILL (single value, used on cards + detail page)
// =============================================================================

export function SocialModePill({
  mode,
  size = 'sm',
  className,
}: {
  mode: SocialMode;
  size?: 'sm' | 'xs';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        'bg-indigo-50 text-indigo-800',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[10px]',
        className
      )}
    >
      {SOCIAL_MODE_LABELS[mode]}
    </span>
  );
}

export function EnergyNeededPill({
  energy,
  size = 'sm',
  className,
}: {
  energy: EnergyNeeded;
  size?: 'sm' | 'xs';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        'bg-orange-50 text-orange-800',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[10px]',
        className
      )}
    >
      {ENERGY_NEEDED_LABELS[energy]}
    </span>
  );
}

// =============================================================================
// HELPERS — pick the highest-priority sensory tag for limited card real estate
// =============================================================================

/**
 * Returns the highest-priority sensory tag from the input, or null.
 * Order is defined by SENSORY_TAG_PRIORITY (strobe_lights wins because it's
 * the only seizure-relevant signal). Unknown values are dropped silently.
 */
export function pickTopSensoryTag(
  tags: readonly string[] | null | undefined
): SensoryTag | null {
  if (!tags || tags.length === 0) return null;
  const valid = new Set<SensoryTag>();
  for (const t of tags) if (typeof t === 'string' && isSensoryTag(t)) valid.add(t);
  if (valid.size === 0) return null;
  for (const candidate of SENSORY_TAG_PRIORITY) {
    if (valid.has(candidate)) return candidate;
  }
  return null;
}

// =============================================================================
// FULL VIBE PROFILE SECTION (for event detail page)
// =============================================================================

// Custom type rather than Pick<EventRow, ...> because the new tagging-expansion
// columns (sensory_tags, leave_with, social_mode, energy_needed) aren't in the
// generated Database types yet. The runtime payload comes from
// EventWithDetails which carries them as TS-only overlays.
type VibeEvent = Pick<
  EventRow,
  | 'energy_level'
  | 'vibe_tags'
  | 'subcultures'
  | 'noise_level'
  | 'expected_crowd'
> & {
  sensory_tags?: readonly string[] | null;
  leave_with?: readonly string[] | null;
  social_mode?: string | null;
  energy_needed?: string | null;
};

export function VibeProfileSection({
  event,
  accentColor,
  className,
}: {
  event: VibeEvent;
  accentColor: string;
  className?: string;
}) {
  const hasDimensions = DIMENSION_CONFIG.some(
    (d) => event[d.key as keyof VibeEvent] != null
  );
  const hasTags = (event.vibe_tags?.length ?? 0) > 0 || (event.subcultures?.length ?? 0) > 0;
  const hasCrowd = event.expected_crowd || event.noise_level;

  // Narrow the new tagging-expansion arrays + enums defensively. Stale rows
  // could carry vocab values we since removed; the *_LABELS lookup would
  // return undefined and the pill would render blank.
  const sensoryTags: SensoryTag[] = (event.sensory_tags ?? []).filter(
    (t): t is SensoryTag => typeof t === 'string' && isSensoryTag(t)
  );
  const leaveWithTags: LeaveWith[] = (event.leave_with ?? []).filter(
    (t): t is LeaveWith => typeof t === 'string' && isLeaveWith(t)
  );
  const socialMode =
    event.social_mode && isSocialMode(event.social_mode) ? event.social_mode : null;
  const energyNeeded =
    event.energy_needed && isEnergyNeeded(event.energy_needed)
      ? event.energy_needed
      : null;

  const hasSensory = sensoryTags.length > 0;
  const hasLeaveWith = leaveWithTags.length > 0;
  const hasSocialEnergy = socialMode != null || energyNeeded != null;

  if (
    !hasDimensions &&
    !hasTags &&
    !hasCrowd &&
    !hasSensory &&
    !hasLeaveWith &&
    !hasSocialEnergy
  )
    return null;

  return (
    <div className={cn('space-y-6', className)}>
      <h2 className="font-body text-h4 text-ink">
        What&apos;s It Actually Like?
      </h2>

      {/* Dimension bars */}
      {hasDimensions && (
        <div className="space-y-4">
          {DIMENSION_CONFIG.map((dim) => {
            const value = event[dim.key as keyof VibeEvent] as number | null;
            if (value == null) return null;
            return (
              <VibeDimensionBar
                key={dim.key}
                label={dim.label}
                value={value}
                lowLabel={dim.low}
                highLabel={dim.high}
                accentColor={accentColor}
              />
            );
          })}
        </div>
      )}

      {/* Vibe + subculture tags */}
      {hasTags && (
        <div className="space-y-3">
          {event.vibe_tags && event.vibe_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.vibe_tags.map((tag) => (
                <VibeTagPill key={tag} tag={tag} />
              ))}
            </div>
          )}
          {event.subcultures && event.subcultures.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.subcultures.map((tag) => (
                <SubculturePill key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Crowd profile — insider tips style */}
      {hasCrowd && (
        <div className="space-y-3 p-4 bg-white rounded-lg">
          {event.noise_level && (
            <NoiseLevelIndicator level={event.noise_level} />
          )}
          {event.expected_crowd && (
            <div>
              <p className="text-xs font-medium text-zinc uppercase tracking-wide mb-1">
                Who&apos;ll Be There
              </p>
              <p className="text-sm text-zinc italic leading-relaxed">
                {event.expected_crowd}
              </p>
            </div>
          )}
        </div>
      )}

      {/* How the room feels — sensory_tags. Hides when empty. Pill row uses
          the neutral-stone palette so it's distinct from vibe colors above. */}
      {hasSensory && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-zinc uppercase tracking-wide">
            How the Room Feels
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {sensoryTags.map((tag) => (
              <SensoryTagPill key={tag} tag={tag} />
            ))}
          </div>
        </div>
      )}

      {/* What you'll leave with — leave_with. Each pill carries an icon for
          quick scanning. Hides when empty. */}
      {hasLeaveWith && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-zinc uppercase tracking-wide">
            What You&apos;ll Leave With
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {leaveWithTags.map((tag) => (
              <LeaveWithPill key={tag} tag={tag} />
            ))}
          </div>
        </div>
      )}

      {/* Who it's for — social_mode + energy_needed. Two labeled rows so the
          dimension is unambiguous (a single pill saying "Comfortable solo"
          out of context could read as a vibe). Hides when both are null. */}
      {hasSocialEnergy && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-zinc uppercase tracking-wide">
            Who It&apos;s For
          </h3>
          <dl className="space-y-1.5">
            {socialMode && (
              <div className="flex items-center gap-2">
                <dt className="text-sm text-zinc">Social style:</dt>
                <dd>
                  <SocialModePill mode={socialMode} />
                </dd>
              </div>
            )}
            {energyNeeded && (
              <div className="flex items-center gap-2">
                <dt className="text-sm text-zinc">Energy needed:</dt>
                <dd>
                  <EnergyNeededPill energy={energyNeeded} />
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
