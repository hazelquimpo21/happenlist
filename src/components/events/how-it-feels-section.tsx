/**
 * =============================================================================
 * <HowItFeelsSection> — the signals moment
 * =============================================================================
 *
 * Full-bleed editorial section on the event detail page that surfaces the
 * tagging-expansion data (sensory, leave_with, social_mode, energy_needed,
 * accessibility_tags) as a single named moment rather than pills hiding
 * inside a bordered card.
 *
 * Layout:
 *   - Full-width dark band (break out of the page Container in page.tsx by
 *     rendering this section OUTSIDE the Container wrapper).
 *   - Top: 6px accent bar in the event's category color.
 *   - Headline: "How it feels." with "feels" colored by the category accent.
 *   - Four blocks: The Room / The Crowd / You'll Leave With / Built For.
 *
 * Silence-is-honest rule:
 *   - Entire section hides when ALL five signal sources are empty.
 *   - Each individual block hides when its own signal source is empty.
 *   - Critically: "Built for" (accessibility) hides when there are no tags —
 *     rendering an empty "no accessibility info" block would wrongly imply
 *     inaccessibility. Same rule as AccessibilityBadges.
 *
 * This component replaces what <AccessibilityBadges> + the new-signals blocks
 * inside <VibeProfileSection> used to render on event/[slug]. Those
 * components still exist and are used elsewhere (EventCard icon row); we
 * just don't render their detail-page surfaces anymore — <HowItFeelsSection>
 * is the single detail-page home for these signals now.
 *
 * Cross-file coupling:
 *   - src/lib/constants/vocabularies.ts — all enums + type guards
 *   - src/lib/utils/signals-copy.ts — sentence builders + icon map
 *   - src/app/event/[slug]/page.tsx — rendered full-bleed, outside Container
 *   - src/components/events/accessibility-badges.tsx — no longer rendered on
 *     the detail page; kept for EventCard <AccessibilityIconRow> usage.
 * =============================================================================
 */

import {
  Accessibility,
  Ear,
  Captions,
  Volume2,
  Sparkles as SparklesIcon,
  Dog,
  UserCircle2,
  Type,
  Armchair,
  Baby,
  Heart,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import {
  ACCESSIBILITY_TAG_LABELS,
  isAccessibilityTag,
  isSensoryTag,
  isLeaveWith,
  isSocialMode,
  isEnergyNeeded,
  SENSORY_TAG_LABELS,
  LEAVE_WITH_LABELS,
  SOCIAL_MODE_LABELS,
  ENERGY_NEEDED_LABELS,
  type AccessibilityTag,
  type SensoryTag,
  type LeaveWith,
  type SocialMode,
  type EnergyNeeded,
} from '@/lib/constants/vocabularies';
import {
  LEAVE_WITH_ICON_MAP,
  buildCrowdSentence,
  buildSensorySentence,
} from '@/lib/utils/signals-copy';

// Duplicated from accessibility-badges.tsx — kept in sync manually. The
// lucide icons don't need to be client-only, so rebuilding here avoids
// a client-boundary import from a server component.
const ACCESSIBILITY_ICONS: Record<AccessibilityTag, LucideIcon> = {
  step_free: Accessibility,
  asl_interpreted: Ear,
  captioned: Captions,
  audio_description: Volume2,
  sensory_friendly_session: SparklesIcon,
  service_dog_welcome: Dog,
  gender_neutral_restroom: UserCircle2,
  large_print_materials: Type,
  reserved_accessible_seating: Armchair,
  childcare_on_site: Baby,
  nursing_friendly: Heart,
  scent_free_policy: Wind,
};

interface HowItFeelsSectionProps {
  event: {
    sensory_tags?: readonly string[] | null;
    leave_with?: readonly string[] | null;
    social_mode?: string | null;
    energy_needed?: string | null;
    accessibility_tags?: readonly string[] | null;
  };
  /** Category accent color for the top bar + "feels" word + eyebrow text. */
  accentColor: string;
}

export function HowItFeelsSection({ event, accentColor }: HowItFeelsSectionProps) {
  // ── Narrow every input defensively — stale DB rows can still carry values
  //    the vocab has since dropped. The pill / sentence surfaces must not
  //    render stale values as blanks.
  const sensoryTags: SensoryTag[] = (event.sensory_tags ?? []).filter(
    (t): t is SensoryTag => typeof t === 'string' && isSensoryTag(t),
  );
  const leaveWithTags: LeaveWith[] = (event.leave_with ?? []).filter(
    (t): t is LeaveWith => typeof t === 'string' && isLeaveWith(t),
  );
  const socialMode: SocialMode | null =
    event.social_mode && isSocialMode(event.social_mode)
      ? event.social_mode
      : null;
  const energyNeeded: EnergyNeeded | null =
    event.energy_needed && isEnergyNeeded(event.energy_needed)
      ? event.energy_needed
      : null;
  const accessibilityTags: AccessibilityTag[] = (event.accessibility_tags ?? []).filter(
    (t): t is AccessibilityTag => typeof t === 'string' && isAccessibilityTag(t),
  );

  const hasSensory = sensoryTags.length > 0;
  const hasLeaveWith = leaveWithTags.length > 0;
  const hasCrowd = socialMode != null || energyNeeded != null;
  const hasAccessibility = accessibilityTags.length > 0;

  // Silence-is-honest — if every source is empty, the whole section hides.
  if (!hasSensory && !hasLeaveWith && !hasCrowd && !hasAccessibility) return null;

  const sensorySentence = hasSensory ? buildSensorySentence(sensoryTags) : null;
  const crowdSentence = hasCrowd ? buildCrowdSentence(socialMode, energyNeeded) : null;
  const hasStrobe = sensoryTags.includes('strobe_lights');

  return (
    <section className="relative w-full bg-night text-cream">
      {/* ── Chapter-break banner ──
         A tall category-colored band acts as the bridge between the light
         page above and the dark editorial section below. The eyebrow lives
         here, so the reader sees "this is a new chapter" before the dark
         background starts. Without this the dark section reads as a
         detached footer. */}
      <div
        className="w-full py-5 md:py-6"
        style={{ backgroundColor: accentColor, color: '#FFFFFF' }}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-block w-8 h-px bg-current opacity-60"
          />
          <p className="font-mono text-[11px] md:text-xs font-bold uppercase tracking-[0.25em]">
            Part IV · The thing nobody tells you
          </p>
          <span
            aria-hidden="true"
            className="inline-block flex-1 h-px bg-current opacity-20"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <h2 className="font-body text-4xl md:text-6xl font-extrabold leading-[0.95] tracking-tight mb-4">
          How it{' '}
          <span style={{ color: accentColor }}>feels</span>.
        </h2>
        <p className="text-base text-cream/70 max-w-xl mb-12 leading-relaxed">
          The details organizers don&apos;t always put in the description — pulled
          from the room, the crowd, and what people remember afterward.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {/* ── The Room ── */}
          {hasSensory && (
            <div className="border-t border-cream/20 pt-6">
              <h3
                className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
                style={{ color: accentColor }}
              >
                The room
              </h3>
              {sensorySentence ? (
                <p className="text-lg font-medium leading-snug tracking-tight">
                  {sensorySentence}
                </p>
              ) : (
                // Fallback when no sentence maps — show labeled tags
                <p className="text-lg font-medium leading-snug">
                  {sensoryTags.map((t) => SENSORY_TAG_LABELS[t]).join(' · ')}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-5">
                {sensoryTags.map((tag) => (
                  <span
                    key={tag}
                    className={`font-mono text-[10px] tracking-[0.1em] uppercase font-bold px-2.5 py-1 rounded-full border ${
                      tag === 'strobe_lights'
                        ? 'bg-rose border-rose text-pure'
                        : 'border-cream/25 text-cream/85'
                    }`}
                  >
                    {tag === 'strobe_lights' ? 'Strobes possible' : SENSORY_TAG_LABELS[tag]}
                  </span>
                ))}
              </div>
              {hasStrobe && (
                <p className="text-xs text-cream/60 mt-3">
                  Seizure-relevant — confirm with organizer if you are photosensitive.
                </p>
              )}
            </div>
          )}

          {/* ── The Crowd ── */}
          {hasCrowd && (
            <div className="border-t border-cream/20 pt-6">
              <h3
                className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
                style={{ color: accentColor }}
              >
                The crowd
              </h3>
              {crowdSentence ? (
                <p className="text-lg font-medium leading-snug tracking-tight">
                  {crowdSentence}
                </p>
              ) : (
                <dl className="space-y-3 text-sm">
                  {socialMode && (
                    <div>
                      <dt className="text-cream/60 text-[11px] uppercase tracking-wider font-medium mb-0.5">
                        Social style
                      </dt>
                      <dd className="text-lg font-semibold">
                        {SOCIAL_MODE_LABELS[socialMode]}
                      </dd>
                    </div>
                  )}
                  {energyNeeded && (
                    <div>
                      <dt className="text-cream/60 text-[11px] uppercase tracking-wider font-medium mb-0.5">
                        Energy needed
                      </dt>
                      <dd className="text-lg font-semibold">
                        {ENERGY_NEEDED_LABELS[energyNeeded]}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          )}

          {/* ── You'll Leave With ── */}
          {hasLeaveWith && (
            <div className="border-t border-cream/20 pt-6">
              <h3
                className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
                style={{ color: accentColor }}
              >
                You&apos;ll leave with
              </h3>
              <div className="flex flex-wrap gap-5">
                {leaveWithTags.map((tag) => {
                  const Icon = LEAVE_WITH_ICON_MAP[tag];
                  return (
                    <div
                      key={tag}
                      className="flex flex-col items-center text-center gap-2 w-20"
                    >
                      <div
                        className="w-12 h-12 rounded-full bg-cream/10 flex items-center justify-center"
                        style={{ color: accentColor }}
                      >
                        <Icon className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
                      </div>
                      <span className="text-xs font-semibold leading-tight text-cream/90">
                        {LEAVE_WITH_LABELS[tag]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Built For (accessibility) ── */}
        {/*
          Full-width row beneath the three-column grid. Keeps each a11y tag
          on its own line with an icon, which reads more trustworthy than a
          pill row for users who actually need this info.
        */}
        {hasAccessibility && (
          <div className="border-t border-cream/20 pt-6 mt-10 md:mt-14">
            <h3
              className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: accentColor }}
            >
              Built for
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
              {accessibilityTags.map((tag) => {
                const Icon = ACCESSIBILITY_ICONS[tag];
                return (
                  <li key={tag} className="flex items-center gap-3 text-base">
                    <span
                      className="w-8 h-8 rounded-full bg-cream/10 flex items-center justify-center flex-shrink-0"
                      style={{ color: accentColor }}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="font-medium">{ACCESSIBILITY_TAG_LABELS[tag]}</span>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-cream/50 mt-4 max-w-xl">
              These come directly from the event listing. If you need something
              not listed, contact the organizer.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
