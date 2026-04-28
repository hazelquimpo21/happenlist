/**
 * Shared section-prop shape
 * ==========================
 * Every event-edit-form section component receives the same surface:
 *   - formState   — the live FormState
 *   - setFormState — full setter (for nested updates)
 *   - resetStatus — clears the saved/error status banner on dirty
 *   - heuristicEvent — derived live event for FieldHeuristicFlag checks
 *
 * Section-specific extras (categories, event id, selected venue, etc.)
 * are added via per-section interfaces that extend this base.
 *
 * @module components/superadmin/event-edit-form/sections/types
 */

import type { FormState } from '../helpers';
import type { useHeuristicEvent } from '../use-heuristic-event';

export interface SectionBaseProps {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  resetStatus: () => void;
  heuristicEvent: ReturnType<typeof useHeuristicEvent>;
}
