/**
 * =============================================================================
 * MORE DRAWER — B1 long-tail filter drawer
 * =============================================================================
 *
 * Sibling to the B1 segmented picker. The 4 picker segments (Category / When
 * / Good for / Budget) cover the high-frequency filters; this drawer covers
 * EVERYTHING ELSE that used to live in the old FilterDrawer:
 *   - Neighborhood + distance
 *   - Fine-grained price tiers (beyond the 4 Budget tiles)
 *   - Age groups
 *   - Accessibility, Sensory, Leave-with
 *   - Social mode + Energy needed
 *   - Quick toggles (Solo-friendly, Curious minds, No tickets, Drop-in, Family)
 *   - Vibe / Noise / Access (legacy)
 *   - Membership benefits
 *
 * Layout: Radix Dialog, right-side panel on desktop (420px wide), bottom
 * sheet on mobile — same behavior as the old drawer.
 *
 * Why a new file instead of extending FilterDrawer?
 *   - FilterDrawer had "Category" + "Good for" sections that duplicated the
 *     picker's segments; removing those without breaking the old bar required
 *     a clean rewrite. Killing FilterDrawer gives us a sharper file.
 *   - The old drawer used the word "filters" in its trigger; the new one uses
 *     "More" to echo the picker spec.
 *
 * Cross-file coupling:
 *   - src/components/events/filters/b1/picker-bar.tsx — mounts this drawer
 *     to the right of the picker
 *   - Shared primitives: filter-chip, filter-section, collapsible-filter-section,
 *     neighborhood-picker — still in src/components/events/filters/
 *   - Shared state: use-filter-state.ts
 * =============================================================================
 */

'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { PRICE_TIERS } from '@/lib/constants/price-tiers';
import { AGE_GROUPS } from '@/lib/constants/age-groups';
import {
  VIBE_TAGS,
  NOISE_LEVELS,
  ACCESSIBILITY_TAGS,
  ACCESSIBILITY_TAG_LABELS,
  SENSORY_TAGS,
  SENSORY_TAG_LABELS,
  LEAVE_WITH,
  LEAVE_WITH_LABELS,
  SOCIAL_MODES,
  SOCIAL_MODE_LABELS,
  ENERGY_NEEDED,
  ENERGY_NEEDED_LABELS,
} from '@/lib/constants/vocabularies';
import { FilterChip } from '../filter-chip';
import { FilterSection } from '../filter-section';
import { CollapsibleFilterSection } from '../collapsible-filter-section';
import { NeighborhoodPicker } from '../neighborhood-picker';
import { useFilterState } from '../use-filter-state';
import { cn } from '@/lib/utils/cn';
import { IconChevronDown } from './picker-icons';

export interface MoreDrawerMembershipOrg {
  id: string;
  name: string;
  event_count: number;
}

interface MoreDrawerProps {
  membershipOrgs: readonly MoreDrawerMembershipOrg[];
  /** Active filter count — renders as a badge on the More button. */
  activeCount: number;
}

function slugToLabel(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function MoreDrawer({ membershipOrgs, activeCount }: MoreDrawerProps) {
  const { state, toggleArrayValue, setSingle, toggleBool, clearAll } = useFilterState();

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-2.5',
            'font-body text-[13px] font-semibold transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-1',
            activeCount > 0
              ? 'border-blue bg-blue text-pure hover:bg-blue-dark'
              : 'border-mist bg-pure text-ink hover:border-ink/40'
          )}
          aria-label={`Open more filters${activeCount > 0 ? `, ${activeCount} active` : ''}`}
        >
          More
          <IconChevronDown size={14} />
          {activeCount > 0 && (
            <span
              className={cn(
                'ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                activeCount > 0 ? 'bg-pure text-blue' : 'bg-blue text-pure'
              )}
            >
              {activeCount}
            </span>
          )}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-[60] bg-ink/50 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in data-[state=closed]:fade-out'
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed z-[60] flex flex-col bg-pure shadow-2xl',
            'inset-x-0 bottom-0 h-[85vh] rounded-t-2xl',
            'md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:h-full md:w-[420px] md:rounded-none md:rounded-l-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
            'md:data-[state=open]:slide-in-from-right md:data-[state=closed]:slide-out-to-right'
          )}
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-mist px-5 py-4">
            <Dialog.Title className="font-body text-h4 font-semibold text-ink">
              More filters
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close filters"
                className="-mr-2 rounded-full p-2 text-zinc hover:bg-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5">
            {/* Accessibility FIRST — most load-bearing for users who need it */}
            <FilterSection
              label="Access"
              hint="Multi-select — events match if the listing states any selected feature"
              showClear={state.accessibility.length > 0}
              onClear={() => setSingle('accessibility', [])}
            >
              {ACCESSIBILITY_TAGS.map((tag) => (
                <FilterChip
                  key={tag}
                  label={ACCESSIBILITY_TAG_LABELS[tag]}
                  active={state.accessibility.includes(tag)}
                  size="sm"
                  onClick={() => toggleArrayValue('accessibility', tag)}
                />
              ))}
            </FilterSection>

            <NeighborhoodPicker />

            <FilterSection
              label="Price (fine-grained)"
              hint="Use the Budget picker above for quick picks. This is for custom tiers."
              showClear={state.priceTier.length > 0}
              onClear={() => setSingle('priceTier', [])}
            >
              {PRICE_TIERS.map((tier) => (
                <FilterChip
                  key={tier.slug}
                  label={tier.label}
                  title={tier.description}
                  active={state.priceTier.includes(tier.slug)}
                  size="sm"
                  onClick={() => toggleArrayValue('priceTier', tier.slug)}
                />
              ))}
            </FilterSection>

            <FilterSection
              label="Ages"
              hint="Multi-select — events match if they fit any selected age group"
              showClear={state.ageGroup.length > 0}
              onClear={() => setSingle('ageGroup', [])}
            >
              {AGE_GROUPS.map((group) => (
                <FilterChip
                  key={group.slug}
                  label={group.label}
                  title={group.description}
                  active={state.ageGroup.includes(group.slug)}
                  size="sm"
                  onClick={() => toggleArrayValue('ageGroup', group.slug)}
                />
              ))}
            </FilterSection>

            <FilterSection
              label="Vibe"
              showClear={!!state.vibeTag}
              onClear={() => setSingle('vibeTag', undefined)}
            >
              {VIBE_TAGS.map((tag) => (
                <FilterChip
                  key={tag}
                  label={slugToLabel(tag)}
                  active={state.vibeTag === tag}
                  size="sm"
                  onClick={() => setSingle('vibeTag', state.vibeTag === tag ? undefined : tag)}
                />
              ))}
            </FilterSection>

            <FilterSection
              label="Noise level"
              showClear={!!state.noiseLevel}
              onClear={() => setSingle('noiseLevel', undefined)}
            >
              {NOISE_LEVELS.map((level) => (
                <FilterChip
                  key={level}
                  label={slugToLabel(level)}
                  active={state.noiseLevel === level}
                  size="sm"
                  onClick={() =>
                    setSingle('noiseLevel', state.noiseLevel === level ? undefined : level)
                  }
                />
              ))}
            </FilterSection>

            <CollapsibleFilterSection
              id="sensory"
              label="Sensory"
              hint="Multi-select — events match if they share any selected sensory signal"
              showClear={state.sensory.length > 0}
              onClear={() => setSingle('sensory', [])}
            >
              {SENSORY_TAGS.map((tag) => (
                <FilterChip
                  key={tag}
                  label={SENSORY_TAG_LABELS[tag]}
                  active={state.sensory.includes(tag)}
                  size="sm"
                  onClick={() => toggleArrayValue('sensory', tag)}
                />
              ))}
            </CollapsibleFilterSection>

            <CollapsibleFilterSection
              id="leave_with"
              label="Leave with"
              hint="Multi-select — events match if they produce any selected outcome"
              showClear={state.leaveWith.length > 0}
              onClear={() => setSingle('leaveWith', [])}
            >
              {LEAVE_WITH.map((tag) => (
                <FilterChip
                  key={tag}
                  label={LEAVE_WITH_LABELS[tag]}
                  active={state.leaveWith.includes(tag)}
                  size="sm"
                  onClick={() => toggleArrayValue('leaveWith', tag)}
                />
              ))}
            </CollapsibleFilterSection>

            <CollapsibleFilterSection
              id="social_energy"
              label="Social + Energy"
              hint="Pick one of each, or leave blank to skip"
              showClear={!!state.socialMode || !!state.energyNeeded}
              onClear={() => {
                setSingle('socialMode', undefined);
                setSingle('energyNeeded', undefined);
              }}
            >
              <div className="w-full">
                <p className="mb-2 text-xs text-zinc">Social style</p>
                <div className="flex flex-wrap gap-2">
                  {SOCIAL_MODES.map((mode) => (
                    <FilterChip
                      key={mode}
                      label={SOCIAL_MODE_LABELS[mode]}
                      active={state.socialMode === mode}
                      size="sm"
                      onClick={() =>
                        setSingle('socialMode', state.socialMode === mode ? undefined : mode)
                      }
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 w-full">
                <p className="mb-2 text-xs text-zinc">Energy needed</p>
                <div className="flex flex-wrap gap-2">
                  {ENERGY_NEEDED.map((energy) => (
                    <FilterChip
                      key={energy}
                      label={ENERGY_NEEDED_LABELS[energy]}
                      active={state.energyNeeded === energy}
                      size="sm"
                      onClick={() =>
                        setSingle('energyNeeded', state.energyNeeded === energy ? undefined : energy)
                      }
                    />
                  ))}
                </div>
              </div>
            </CollapsibleFilterSection>

            <FilterSection label="Quick filters">
              <FilterChip
                label="Solo-friendly"
                active={state.soloFriendly}
                size="sm"
                onClick={() => toggleBool('soloFriendly')}
              />
              <FilterChip
                label="Curious minds"
                active={state.curiousMinds}
                size="sm"
                onClick={() => toggleBool('curiousMinds')}
              />
              <FilterChip
                label="No tickets needed"
                active={state.noTicketsNeeded}
                size="sm"
                onClick={() => toggleBool('noTicketsNeeded')}
              />
              <FilterChip
                label="Drop-in OK"
                active={state.dropInOk}
                size="sm"
                onClick={() => toggleBool('dropInOk')}
              />
              <FilterChip
                label="Family-friendly"
                active={state.familyFriendly}
                size="sm"
                onClick={() => toggleBool('familyFriendly')}
              />
            </FilterSection>

            {membershipOrgs.length > 0 && (
              <FilterSection
                label="Membership benefits"
                showClear={state.hasMemberBenefits || !!state.membershipOrgId}
                onClear={() => {
                  setSingle('hasMemberBenefits', false);
                  setSingle('membershipOrgId', undefined);
                }}
              >
                <FilterChip
                  label="Has member pricing"
                  active={state.hasMemberBenefits}
                  size="sm"
                  onClick={() => toggleBool('hasMemberBenefits')}
                />
                {membershipOrgs
                  .filter((o) => o.event_count > 0)
                  .slice(0, 8)
                  .map((org) => (
                    <FilterChip
                      key={org.id}
                      label={org.name}
                      active={state.membershipOrgId === org.id}
                      size="sm"
                      onClick={() =>
                        setSingle(
                          'membershipOrgId',
                          state.membershipOrgId === org.id ? undefined : org.id
                        )
                      }
                    />
                  ))}
              </FilterSection>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-mist bg-pure px-5 py-4">
            <button
              type="button"
              onClick={clearAll}
              className="text-body-sm font-medium text-zinc hover:text-ink focus-visible:outline-none focus-visible:underline"
            >
              Clear all
            </button>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full bg-blue px-6 py-2.5 text-body-sm font-semibold text-pure hover:bg-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                Done
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
