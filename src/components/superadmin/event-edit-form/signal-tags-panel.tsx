/**
 * EVENT EDIT FORM — SIGNAL TAGS PANEL
 * ====================================
 * Tagging-expansion (Stage 4) manual editing surface. Accessibility / sensory /
 * leave_with / music_genres render as multi-chip toggles; social_mode +
 * energy_needed render as native selects.
 *
 * Sliders intentionally NOT here — they go through SignalsReviewPanel's
 * override flow so each slider change is attributed to a reviewer.
 *
 * Receives the parent's full FormState updater so each toggle/select can
 * patch a single field while reusing the parent's resetStatus side-effect.
 *
 * Extracted from the original monolithic event-edit-form.tsx (2026-04-22 split).
 *
 * @module components/superadmin/event-edit-form/signal-tags-panel
 */

'use client';

import { ChipToggleGroup } from '../chip-toggle-group';
import {
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
  MUSIC_GENRES,
  MUSIC_GENRE_LABELS,
} from '@/lib/constants/vocabularies';
import type { FormState } from './helpers';

interface SignalTagsPanelProps {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  resetStatus: () => void;
}

export function SignalTagsPanel({ formState, setFormState, resetStatus }: SignalTagsPanelProps) {
  return (
    <div className="p-4 bg-white/50 rounded-lg border border-mist/50 space-y-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-ink">Signal tags</p>
        <p className="text-[11px] text-zinc">
          Manual edits go straight to the events table; sliders use the review panel.
        </p>
      </div>

      <ChipToggleGroup
        label="Accessibility"
        options={ACCESSIBILITY_TAGS}
        optionLabels={ACCESSIBILITY_TAG_LABELS}
        selected={formState.accessibility_tags}
        onChange={(next) =>
          setFormState((prev) => ({ ...prev, accessibility_tags: next }))
        }
        onAfterToggle={resetStatus}
        selectedClassName="bg-blue text-white"
      />

      <ChipToggleGroup
        label="Sensory"
        options={SENSORY_TAGS}
        optionLabels={SENSORY_TAG_LABELS}
        selected={formState.sensory_tags}
        onChange={(next) =>
          setFormState((prev) => ({ ...prev, sensory_tags: next }))
        }
        onAfterToggle={resetStatus}
        selectedClassName="bg-stone-700 text-white"
      />

      <ChipToggleGroup
        label="Leave with"
        options={LEAVE_WITH}
        optionLabels={LEAVE_WITH_LABELS}
        selected={formState.leave_with}
        onChange={(next) =>
          setFormState((prev) => ({ ...prev, leave_with: next }))
        }
        onAfterToggle={resetStatus}
        selectedClassName="bg-emerald-600 text-white"
      />

      <ChipToggleGroup
        label="Music genres"
        options={MUSIC_GENRES}
        optionLabels={MUSIC_GENRE_LABELS}
        selected={formState.music_genres}
        onChange={(next) =>
          setFormState((prev) => ({ ...prev, music_genres: next }))
        }
        onAfterToggle={resetStatus}
        selectedClassName="bg-blue text-white"
      />


      {/* Social mode + energy needed (single-value enums) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="social_mode" className="block text-xs font-medium text-zinc mb-1">
            Social mode
          </label>
          <select
            id="social_mode"
            value={formState.social_mode}
            onChange={(e) => {
              setFormState((prev) => ({ ...prev, social_mode: e.target.value }));
              resetStatus();
            }}
            className="w-full px-3 py-2 border border-mist rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          >
            <option value="">— unset —</option>
            {SOCIAL_MODES.map((m) => (
              <option key={m} value={m}>
                {SOCIAL_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="energy_needed" className="block text-xs font-medium text-zinc mb-1">
            Energy needed
          </label>
          <select
            id="energy_needed"
            value={formState.energy_needed}
            onChange={(e) => {
              setFormState((prev) => ({ ...prev, energy_needed: e.target.value }));
              resetStatus();
            }}
            className="w-full px-3 py-2 border border-mist rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          >
            <option value="">— unset —</option>
            {ENERGY_NEEDED.map((e) => (
              <option key={e} value={e}>
                {ENERGY_NEEDED_LABELS[e]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
