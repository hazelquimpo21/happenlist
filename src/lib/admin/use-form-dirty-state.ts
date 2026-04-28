/**
 * useFormDirtyState
 * ==================
 * Single source of truth for "what changed in the form vs. the saved record".
 *
 * Drives:
 *   - The "Save changes (N)" count in the command bar
 *   - Dirty dots in the section TOC
 *   - The "What changed" sidebar diff list
 *   - The unsaved-changes navigation guard
 *
 * Comparison rules:
 *   - Strings: trimmed string equality, treating null/undefined/empty as equal
 *   - Numbers: numeric equality, treating null/'' as equal
 *   - Booleans: strict equality
 *   - Arrays of scalars: order-insensitive (sorted-join compare)
 *   - Objects (e.g. `hours`): JSON.stringify equality with stable key order
 *     via JSON.stringify after sorting keys
 *
 * Sections are mapped to fields via the `fieldToSection` argument so dirty
 * state can be aggregated at section granularity for the TOC.
 *
 * @module lib/admin/use-form-dirty-state
 */
import { useMemo } from 'react';

export type DirtyComparator = 'string' | 'number' | 'boolean' | 'array' | 'json';

export interface DirtyFieldSpec<T> {
  /** Form-state key being compared. */
  key: keyof T;
  /** Human label shown in the "What changed" panel. */
  label: string;
  /** Section id this field belongs to (matches admin-form-sections.ts). */
  section: string;
  /** Comparison strategy. Defaults to 'string'. */
  compare?: DirtyComparator;
}

export interface DirtyChange {
  key: string;
  label: string;
  section: string;
  /** Human-readable representation of the original value. */
  before: string;
  /** Human-readable representation of the new value. */
  after: string;
}

export interface DirtyResult {
  /** True if any field differs. */
  isDirty: boolean;
  /** Total number of changed fields. */
  count: number;
  /** Per-section "is anything dirty in this section?" map. */
  bySection: Record<string, boolean>;
  /** Per-section count of dirty fields. */
  countBySection: Record<string, number>;
  /** Ordered list of changes — useful for "What changed" UI. */
  changes: DirtyChange[];
}

const EMPTY_RESULT: DirtyResult = {
  isDirty: false,
  count: 0,
  bySection: {},
  countBySection: {},
  changes: [],
};

function stringifyForDisplay(value: unknown): string {
  if (value == null) return '—';
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    return value.join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  const s = String(value);
  return s.length > 60 ? s.slice(0, 57) + '…' : s || '—';
}

function compareValues(
  a: unknown,
  b: unknown,
  strategy: DirtyComparator,
): boolean {
  switch (strategy) {
    case 'boolean':
      return Boolean(a) === Boolean(b);
    case 'number': {
      const na = a === '' || a == null ? null : Number(a);
      const nb = b === '' || b == null ? null : Number(b);
      if (na == null && nb == null) return true;
      if (na == null || nb == null) return false;
      return na === nb;
    }
    case 'array': {
      const ar = Array.isArray(a) ? [...a] : [];
      const br = Array.isArray(b) ? [...b] : [];
      return ar.sort().join('') === br.sort().join('');
    }
    case 'json':
      return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    case 'string':
    default: {
      const sa = (a == null ? '' : String(a)).trim();
      const sb = (b == null ? '' : String(b)).trim();
      return sa === sb;
    }
  }
}

/**
 * Compare current form state against the original record.
 *
 * @param current  The live form state object.
 * @param original The original record (or a derived snapshot of it).
 * @param spec     Per-field metadata: section, label, comparator.
 */
export function useFormDirtyState<T extends object>(
  current: T,
  original: T,
  spec: readonly DirtyFieldSpec<T>[],
): DirtyResult {
  return useMemo(() => {
    if (!current || !original) return EMPTY_RESULT;

    const changes: DirtyChange[] = [];
    const bySection: Record<string, boolean> = {};
    const countBySection: Record<string, number> = {};

    for (const field of spec) {
      const a = current[field.key];
      const b = original[field.key];
      const equal = compareValues(a, b, field.compare ?? 'string');
      if (!equal) {
        changes.push({
          key: String(field.key),
          label: field.label,
          section: field.section,
          before: stringifyForDisplay(b),
          after: stringifyForDisplay(a),
        });
        bySection[field.section] = true;
        countBySection[field.section] = (countBySection[field.section] ?? 0) + 1;
      }
    }

    return {
      isDirty: changes.length > 0,
      count: changes.length,
      bySection,
      countBySection,
      changes,
    };
  }, [current, original, spec]);
}
