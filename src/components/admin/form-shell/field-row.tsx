/**
 * FieldRow + input primitives
 * ============================
 * Standardizes the label / input / hint / counter pattern used in every
 * admin form section. Replaces the inlined `<label> + <input className="w-full px-4 py-2 border ...">`
 * pattern repeated 25+ times.
 *
 * Inputs use a single `inputClass` token so we never type the same Tailwind
 * cocktail twice and the focus ring stays consistent (blue, no leftover
 * coral).
 *
 * @module components/admin/form-shell/field-row
 */
'use client';

export const inputClass =
  'w-full px-3.5 py-2 border border-mist rounded-lg text-sm bg-pure text-ink ' +
  'placeholder:text-silver focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none ' +
  'transition-shadow disabled:bg-cloud disabled:text-zinc';

interface FieldRowProps {
  label: string;
  htmlFor?: string;
  /** Optional muted suffix to the label, e.g. "(optional)". */
  hint?: React.ReactNode;
  /** Optional adornment rendered to the right of the label (e.g. heuristic flag). */
  labelRight?: React.ReactNode;
  /** Helper line under the input. */
  helper?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function FieldRow({
  label,
  htmlFor,
  hint,
  labelRight,
  helper,
  className,
  children,
}: FieldRowProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
          {label}
          {hint && <span className="text-zinc font-normal ml-1.5">{hint}</span>}
        </label>
        {labelRight && <span className="ml-2">{labelRight}</span>}
      </div>
      {children}
      {helper && <p className="text-xs text-zinc mt-1">{helper}</p>}
    </div>
  );
}
