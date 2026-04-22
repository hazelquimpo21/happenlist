'use client';

/**
 * RECHECK PANEL
 * =============
 * "Re-fetch from source" button + diff modal for the superadmin event editor.
 *
 * Flow:
 *   1. Operator clicks the button → POST /api/superadmin/events/[id]/recheck.
 *   2. Scraper returns { event, diff, unchanged }.
 *   3. We render a modal listing each changed field with before/after + a
 *      checkbox. Operator toggles which to apply.
 *   4. "Apply" → PATCH /api/superadmin/events/[id] with the selected updates.
 *
 * Coupling notes:
 *   - Uses lib/scraper/types for the response shape.
 *   - Apply path is the existing superadmin PATCH route — same audit trail
 *     as any manual edit.
 *
 * @module components/superadmin/recheck-panel
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Loader2, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ScraperRecheckResponse } from '@/lib/scraper/types';

// Fields from the scraper diff → corresponding editable event column names.
// Most are identical, but we keep this map explicit so a rename in one repo
// doesn't silently drop fields on the other side.
const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  short_description: 'Short description',
  description: 'Description',
  tagline: 'Tagline',
  start_datetime: 'Start',
  end_datetime: 'End',
  price_type: 'Price type',
  price_low: 'Price low',
  price_high: 'Price high',
  price_details: 'Price details',
  ticket_url: 'Ticket URL',
  sold_out: 'Sold out',
  sold_out_details: 'Sold-out details',
  category_slug: 'Category',
  age_low: 'Age low',
  age_high: 'Age high',
  age_restriction: 'Age restriction',
  is_family_friendly: 'Family-friendly',
  organizer_name: 'Organizer (name)',
  website_url: 'Website URL',
  registration_url: 'Registration URL',
  image_url: 'Image URL',
};

// Fields that don't correspond to a simple event column — we skip them when
// building the PATCH payload. `category_slug` and `organizer_name` need
// resolution against their own tables; don't try to write them raw.
const UNMAPPED_FIELDS = new Set(['category_slug', 'organizer_name']);

interface RecheckPanelProps {
  eventId: string;
  hasSourceUrl: boolean;
}

type Stage = 'idle' | 'checking' | 'review' | 'applying' | 'done';

export function RecheckPanel({ eventId, hasSourceUrl }: RecheckPanelProps) {
  const router = useRouter();

  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [diff, setDiff] = useState<ScraperRecheckResponse['diff']>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const runRecheck = useCallback(async () => {
    setStage('checking');
    setError(null);
    try {
      const res = await fetch(`/api/superadmin/events/${eventId}/recheck`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Recheck failed (${res.status})`);
        setStage('idle');
        return;
      }
      const rr = data as ScraperRecheckResponse;
      setDiff(rr.diff);
      const applicable = Object.keys(rr.diff).filter(f => !UNMAPPED_FIELDS.has(f));
      setSelected(new Set(applicable));
      setStage('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      setStage('idle');
    }
  }, [eventId]);

  const apply = useCallback(async () => {
    const updates: Record<string, unknown> = {};
    for (const field of selected) {
      if (UNMAPPED_FIELDS.has(field)) continue;
      updates[field] = diff[field].after;
    }
    if (Object.keys(updates).length === 0) {
      setStage('done');
      return;
    }
    setStage('applying');
    setError(null);
    try {
      const res = await fetch(`/api/superadmin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, notes: 'Applied via recheck' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Apply failed (${res.status})`);
        setStage('review');
        return;
      }
      setStage('done');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      setStage('review');
    }
  }, [diff, selected, eventId, router]);

  const toggle = (field: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const close = () => {
    setStage('idle');
    setError(null);
    setDiff({});
    setSelected(new Set());
  };

  // --- Button (inline trigger) ---
  if (stage === 'idle' || stage === 'checking') {
    return (
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={runRecheck}
          disabled={!hasSourceUrl || stage === 'checking'}
        >
          {stage === 'checking' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking…
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Re-fetch from source
            </>
          )}
        </Button>
        {error && (
          <div className="text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>
    );
  }

  // --- Modal (review / applying / done) ---
  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled>
        <RefreshCw className="w-4 h-4" /> Re-fetch from source
      </Button>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recheck-modal-title"
      >
        <div className="bg-pure rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-mist">
            <h2 id="recheck-modal-title" className="text-lg font-semibold text-ink">
              {stage === 'done' ? 'Changes applied' : 'Review changes from source'}
            </h2>
            <button
              type="button"
              onClick={close}
              className="text-zinc hover:text-ink"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {stage === 'done' ? (
              <DoneBlock count={selected.size} />
            ) : Object.keys(diff).length === 0 ? (
              <div className="text-center py-8 text-zinc">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald" />
                <p className="font-medium text-ink">No changes detected</p>
                <p className="text-sm mt-1">The source page matches the current event.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc">
                  {Object.keys(diff).length} field{Object.keys(diff).length === 1 ? '' : 's'} changed.
                  Pick which to apply — each goes through the normal audit trail.
                </p>
                {Object.entries(diff).map(([field, change]) => (
                  <DiffRow
                    key={field}
                    field={field}
                    before={change.before}
                    after={change.after}
                    selected={selected.has(field)}
                    disabled={UNMAPPED_FIELDS.has(field)}
                    onToggle={() => toggle(field)}
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-mist bg-cloud">
            {stage === 'done' ? (
              <Button type="button" onClick={close} className="ml-auto">
                Done
              </Button>
            ) : (
              <>
                <div className="text-sm text-zinc">
                  {selected.size} of {Object.keys(diff).filter(f => !UNMAPPED_FIELDS.has(f)).length} applicable selected
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={close}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={apply}
                    disabled={selected.size === 0 || stage === 'applying'}
                  >
                    {stage === 'applying' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Applying…
                      </>
                    ) : (
                      `Apply ${selected.size} change${selected.size === 1 ? '' : 's'}`
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

function DiffRow({
  field,
  before,
  after,
  selected,
  disabled,
  onToggle,
}: {
  field: string;
  before: unknown;
  after: unknown;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const label = FIELD_LABELS[field] ?? field;
  return (
    <label
      className={cn(
        'flex gap-3 p-3 rounded-lg border transition-colors',
        disabled
          ? 'bg-cloud border-mist cursor-not-allowed'
          : selected
          ? 'bg-blue/5 border-blue cursor-pointer'
          : 'bg-pure border-mist cursor-pointer hover:border-silver'
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled}
        onChange={onToggle}
        className="mt-1 w-4 h-4 accent-blue flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink text-sm">{label}</span>
          <code className="text-xs text-zinc">{field}</code>
          {disabled && (
            <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              not auto-applied
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
          <DiffCell label="Before" value={before} variant="before" />
          <DiffCell label="After" value={after} variant="after" />
        </div>
      </div>
    </label>
  );
}

function DiffCell({
  label,
  value,
  variant,
}: {
  label: string;
  value: unknown;
  variant: 'before' | 'after';
}) {
  const display = formatValue(value);
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc mb-1">{label}</div>
      <div
        className={cn(
          'text-sm rounded px-2 py-1 break-words whitespace-pre-wrap',
          variant === 'before'
            ? 'bg-red-50 text-red-900 line-through'
            : 'bg-emerald/10 text-ink'
        )}
      >
        {display}
      </div>
    </div>
  );
}

function DoneBlock({ count }: { count: number }) {
  return (
    <div className="text-center py-8">
      <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald" />
      <p className="font-medium text-ink">Applied {count} change{count === 1 ? '' : 's'}</p>
      <p className="text-sm text-zinc mt-1">The form will refresh with the new values.</p>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatValue(value: unknown): string {
  if (value == null || value === '') return '(empty)';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}
