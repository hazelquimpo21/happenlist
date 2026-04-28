/**
 * Vibe section
 * =============
 * Wraps the existing SignalTagsPanel. The panel itself stays self-contained
 * (chip toggles for accessibility / sensory / leave_with / music + selects
 * for social_mode + energy_needed) but loses its top "Signal tags" caption
 * since the section title now provides that context.
 *
 * Preserves the original behavior — manual edits write directly to the
 * events table; sliders flow through the SignalsReviewPanel override path.
 *
 * @module components/superadmin/event-edit-form/sections/vibe-section
 */
'use client';

import { SignalTagsPanel } from '../signal-tags-panel';
import type { SectionBaseProps } from './types';

export function VibeSection({ formState, setFormState, resetStatus }: SectionBaseProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc">
        Manual edits go straight to the events table. Sliders are reviewed via
        the override panel on the side, not here.
      </p>
      <SignalTagsPanel
        formState={formState}
        setFormState={setFormState}
        resetStatus={resetStatus}
      />
    </div>
  );
}
