/**
 * =============================================================================
 * AccessibilityBadges + AccessibilityIconRow
 * =============================================================================
 *
 * Two surfaces for the events.accessibility_tags field, sharing the icon map.
 *
 * Why a dedicated component (not folded into VibeProfileSection)?
 * --------------------------------------------------------------
 * Accessibility tags are EXPLICIT-ONLY — the scraper only writes them when a
 * page literally states the feature. They are the most trustworthy field in
 * the new tagging set and the most load-bearing for users who actually need
 * them. They earn a dedicated section above the vibe block, with a different
 * visual treatment (blue pills + icons) so they're not lost in vibe-tag soup.
 *
 * Empty-state rule:
 *   If accessibility_tags is empty → render NOTHING. Do not render an empty
 *   "no accessibility info" placeholder. Silence is honest. A wheelchair user
 *   reading "no accessibility info" would reasonably assume inaccessibility,
 *   which is wrong — most pages just don't say.
 *
 * Cross-file coupling:
 *   - src/lib/constants/vocabularies.ts — ACCESSIBILITY_TAGS, *_LABELS, isX
 *   - src/app/event/[slug]/page.tsx — renders <AccessibilityBadges/>
 *   - src/components/events/event-card.tsx — renders <AccessibilityIconRow/>
 * =============================================================================
 */

'use client';

import {
  Accessibility,
  Ear,
  Captions,
  Volume2,
  Sparkles,
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
  type AccessibilityTag,
} from '@/lib/constants/vocabularies';
import { cn } from '@/lib/utils';

// -----------------------------------------------------------------------------
// ICON MAP (single source for both surfaces)
// -----------------------------------------------------------------------------
// Picked for visual recognition at small sizes. Matches the icons named in
// TAGGING_UI_PROMPT.md Stage 2 where it specified them; substituted close
// alternatives (UserCircle2 for restroom, Heart for nursing space, Wind for
// scent-free) for tags it didn't.
const ACCESSIBILITY_ICONS: Record<AccessibilityTag, LucideIcon> = {
  step_free: Accessibility,
  asl_interpreted: Ear,
  captioned: Captions,
  audio_description: Volume2,
  sensory_friendly_session: Sparkles,
  service_dog_welcome: Dog,
  gender_neutral_restroom: UserCircle2,
  large_print_materials: Type,
  reserved_accessible_seating: Armchair,
  childcare_on_site: Baby,
  nursing_friendly: Heart,
  scent_free_policy: Wind,
};

/**
 * Defensive narrowing — accepts the loose `string[]` shape that comes off
 * EventWithDetails / EventCard (TS sees them as wider arrays because the
 * scraper might have written values we since removed from the vocab) and
 * returns only known tags.
 */
function narrowTags(tags: readonly string[] | null | undefined): AccessibilityTag[] {
  if (!tags || tags.length === 0) return [];
  const out: AccessibilityTag[] = [];
  const seen = new Set<string>();
  for (const t of tags) {
    if (typeof t === 'string' && !seen.has(t) && isAccessibilityTag(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// DETAIL-PAGE BADGES
// -----------------------------------------------------------------------------

interface AccessibilityBadgesProps {
  tags: readonly string[] | null | undefined;
  className?: string;
}

/**
 * Detail-page accessibility surface. Header + pill row + a single muted
 * footnote pointing the user to the organizer for anything not listed.
 *
 * Returns null when there are no known tags. Empty intentionally renders
 * nothing — see file header for why.
 */
export function AccessibilityBadges({ tags, className }: AccessibilityBadgesProps) {
  const known = narrowTags(tags);
  if (known.length === 0) return null;

  return (
    <section
      className={cn('space-y-3', className)}
      aria-labelledby="accessibility-badges-heading"
    >
      <h2
        id="accessibility-badges-heading"
        className="font-body text-h4 text-ink"
      >
        What the organizer said about access
      </h2>

      <ul className="flex flex-wrap gap-2" role="list">
        {known.map((tag) => {
          const Icon = ACCESSIBILITY_ICONS[tag];
          const label = ACCESSIBILITY_TAG_LABELS[tag];
          return (
            <li key={tag}>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                  'bg-blue/10 text-blue border border-blue/20'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-zinc">
        These come directly from the event listing. If you need something not
        listed, contact the organizer.
      </p>
    </section>
  );
}

// -----------------------------------------------------------------------------
// CARD ICON ROW
// -----------------------------------------------------------------------------

interface AccessibilityIconRowProps {
  tags: readonly string[] | null | undefined;
  /** Max icons before collapsing to "+N" overflow chip. Default 3. */
  max?: number;
  className?: string;
}

/**
 * Compact card surface — icon-only chips, max 3, with a "+N" overflow chip.
 * The whole row carries one aria-label that names every feature so screen
 * readers don't have to read 3 individual icon labels.
 *
 * `title` on each icon span gives sighted-mouse users a hover tooltip; the
 * overflow chip's title lists everything past the visible cap.
 *
 * Returns null when there are no known tags.
 */
export function AccessibilityIconRow({
  tags,
  max = 3,
  className,
}: AccessibilityIconRowProps) {
  const known = narrowTags(tags);
  if (known.length === 0) return null;

  const visible = known.slice(0, max);
  const overflow = known.slice(max);
  const allLabels = known.map((t) => ACCESSIBILITY_TAG_LABELS[t]);
  const overflowLabels = overflow.map((t) => ACCESSIBILITY_TAG_LABELS[t]);

  return (
    <div
      className={cn('inline-flex items-center gap-1', className)}
      role="group"
      aria-label={`Accessibility features: ${allLabels.join(', ')}`}
    >
      {visible.map((tag) => {
        const Icon = ACCESSIBILITY_ICONS[tag];
        const label = ACCESSIBILITY_TAG_LABELS[tag];
        return (
          <span
            key={tag}
            title={label}
            className={cn(
              'inline-flex items-center justify-center w-5 h-5 rounded-full',
              'bg-blue/10 text-blue'
            )}
          >
            <Icon className="w-3 h-3" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </span>
        );
      })}
      {overflow.length > 0 && (
        <span
          title={overflowLabels.join(', ')}
          className={cn(
            'inline-flex items-center justify-center h-5 px-1.5 rounded-full',
            'bg-blue/10 text-blue text-[10px] font-semibold'
          )}
          aria-label={`${overflow.length} more: ${overflowLabels.join(', ')}`}
        >
          +{overflow.length}
        </span>
      )}
    </div>
  );
}
