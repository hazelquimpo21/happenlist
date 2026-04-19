'use client';

/**
 * CHIP TOGGLE GROUP
 * =================
 * Shared multi-select chip UI used across superadmin forms for editing
 * controlled-vocabulary array fields (accessibility_tags, sensory_tags,
 * leave_with, music_genres, …). Extracted from event-edit-form.tsx where
 * the same render block was duplicated 3× and drifting.
 *
 * Keeps palette per-field via the `selectedClassName` prop so each dimension
 * stays visually distinct (e.g. sensory uses stone, leave_with uses emerald).
 *
 * If you add another tag-array field, use this component — don't paste a new
 * chip block. Engineering standards (CLAUDE.md): modular, centralized.
 */

interface ChipToggleGroupProps<T extends string> {
  /** Field label shown above the chip row. */
  label: string;
  /** Vocabulary to render as chips. Order matters — render order = array order. */
  options: readonly T[];
  /** Human-readable label for each slug. */
  optionLabels: Record<T, string>;
  /** Currently selected values from form state. */
  selected: string[];
  /** Called with the new selection when a chip is toggled. */
  onChange: (next: T[]) => void;
  /**
   * Tailwind classes for the selected (pressed) state. Lets each field keep
   * its own palette — `bg-blue text-white` for accessibility, `bg-stone-700`
   * for sensory, `bg-emerald-600` for leave_with, etc.
   */
  selectedClassName: string;
  /**
   * Optional side-effect run after every toggle — e.g. resetStatus() to clear
   * a "Saved!" banner in the parent form. Kept explicit so this component
   * stays pure otherwise.
   */
  onAfterToggle?: () => void;
}

export function ChipToggleGroup<T extends string>({
  label,
  options,
  optionLabels,
  selected,
  onChange,
  selectedClassName,
  onAfterToggle,
}: ChipToggleGroupProps<T>) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc mb-2">
        {label} {selected.length > 0 && `(${selected.length})`}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                const next = isSelected
                  ? (selected.filter((s) => s !== tag) as T[])
                  : ([...selected, tag] as T[]);
                onChange(next);
                onAfterToggle?.();
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? selectedClassName
                  : 'bg-cloud/50 text-zinc hover:bg-cloud'
              }`}
            >
              {optionLabels[tag]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
