'use client';

/**
 * =============================================================================
 * SignalsReviewPanel — admin audit + override surface for Stage 4
 * =============================================================================
 *
 * Renders the four sliders (social_intensity / structure / commitment /
 * spend_level), the per-tag evidence quotes for accessibility / sensory /
 * leave_with, and the social_mode + energy_needed enums. Each dimension
 * gets a row of three buttons:
 *   - Looks right → POST /api/admin/signal-reviews (verdict='looks_right')
 *   - Flag        → POST /api/admin/signal-reviews (verdict='flagged')
 *   - Override    → opens an inline form, POST /api/superadmin/events/[id]/signal-override
 *
 * Looks-right / Flag are open to any admin. Override is superadmin-only.
 *
 * What this DOESN'T do (by design):
 * - No public-facing slider filters. Sliders are admin-only in v1; this panel
 *   exists so a human can audit them before we expose any to filters.
 * - No revert button. To "undo" an override, set it to null via the override
 *   form (the helper deletes the key from signal_overrides).
 *
 * Cross-file coupling:
 *   - src/data/admin/signal-reviews.ts — types + read helpers
 *   - src/lib/constants/vocabularies.ts — SLIDER_RUBRICS, label maps, vocabs
 *   - src/app/admin/events/[id]/page.tsx — host page
 *   - API routes: /api/admin/signal-reviews, /api/superadmin/events/[id]/signal-override
 * =============================================================================
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Flag, PencilLine, X, Loader2 } from 'lucide-react';
import {
  SLIDER_DIMENSIONS,
  SLIDER_RUBRICS,
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
  type SliderDimension,
} from '@/lib/constants/vocabularies';
import type { InferredSignals, SliderReading } from '@/types/event';
import type {
  ReviewDimension,
  ReviewVerdict,
  SignalReview,
  SignalOverrideValue,
} from '@/data/admin/signal-reviews-types';
import { latestVerdictByDimension } from '@/data/admin/signal-reviews-types';
import { cn } from '@/lib/utils';

// -----------------------------------------------------------------------------
// PROP TYPES
// -----------------------------------------------------------------------------

interface SignalsReviewPanelProps {
  eventId: string;
  /** AI-extracted payload from events.inferred_signals. */
  inferred: InferredSignals | null | undefined;
  /** Reviewer-set values from events.signal_overrides (mirrors inferred shape). */
  overrides: InferredSignals | null | undefined;
  /** Pre-fetched reviews for this event (newest first). */
  reviews: readonly SignalReview[];
  /** Whether the current viewer can use the Override flow. */
  canOverride: boolean;
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

const CONFIDENCE_STYLES: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-red-100 text-red-800',
};

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
        CONFIDENCE_STYLES[confidence],
      )}
    >
      {confidence}
    </span>
  );
}

function VerdictPill({ verdict, reviewer }: { verdict: ReviewVerdict; reviewer: string }) {
  const palette: Record<ReviewVerdict, string> = {
    looks_right: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    flagged: 'bg-amber-50 text-amber-800 border-amber-200',
    override: 'bg-blue-50 text-blue-800 border-blue-200',
  };
  const label: Record<ReviewVerdict, string> = {
    looks_right: '✓ Looks right',
    flagged: '⚑ Flagged',
    override: '✎ Overridden',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
        palette[verdict],
      )}
      title={`Latest verdict by ${reviewer}`}
    >
      {label[verdict]}
    </span>
  );
}

/** Quote-style render for evidence strings — italic, muted, monospace-ish. */
function EvidenceQuote({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p className="text-xs text-zinc font-mono italic leading-relaxed border-l-2 border-stone-200 pl-3">
      &ldquo;{text}&rdquo;
    </p>
  );
}

// -----------------------------------------------------------------------------
// VERDICT BUTTONS (Looks-right / Flag / Override)
// -----------------------------------------------------------------------------

function VerdictButtons({
  eventId,
  dimension,
  canOverride,
  onOverrideClick,
  onReviewSaved,
  busy,
  setBusy,
}: {
  eventId: string;
  dimension: ReviewDimension;
  canOverride: boolean;
  onOverrideClick: () => void;
  onReviewSaved: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const post = async (verdict: 'looks_right' | 'flagged') => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/signal-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, dimension, verdict }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Request failed');
      }
      onReviewSaved();
    } catch (e) {
      console.error('[signals-review] verdict failed', e);
      alert(e instanceof Error ? e.message : 'Failed to save verdict');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => post('looks_right')}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <CheckCircle className="w-3 h-3" aria-hidden="true" />
        Looks right
      </button>
      <button
        type="button"
        onClick={() => post('flagged')}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <Flag className="w-3 h-3" aria-hidden="true" />
        Flag
      </button>
      {canOverride ? (
        <button
          type="button"
          onClick={onOverrideClick}
          disabled={busy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <PencilLine className="w-3 h-3" aria-hidden="true" />
          Override
        </button>
      ) : (
        <span className="text-[10px] text-zinc/70">(superadmin to override)</span>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// OVERRIDE FORM (per-dimension)
// -----------------------------------------------------------------------------

interface OverrideFormProps {
  eventId: string;
  dimension: ReviewDimension;
  currentValue: SignalOverrideValue;
  onClose: () => void;
  onSaved: () => void;
}

function OverrideForm({ eventId, dimension, currentValue, onClose, onSaved }: OverrideFormProps) {
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState<SignalOverrideValue>(currentValue);
  const [note, setNote] = useState('');

  const isArray = ['accessibility', 'sensory', 'leave_with'].includes(dimension);
  const isEnum = dimension === 'social_mode' || dimension === 'energy_needed';
  const isSlider = SLIDER_DIMENSIONS.includes(dimension as SliderDimension);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/superadmin/events/${eventId}/signal-override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dimension, value, note: note || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Request failed');
      }
      onSaved();
      onClose();
    } catch (e) {
      console.error('[signals-review] override failed', e);
      alert(e instanceof Error ? e.message : 'Failed to save override');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 p-3 rounded-md border border-blue-200 bg-blue-50/50 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-blue-900">
          Override {dimension}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close override form"
          className="text-zinc hover:text-ink"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Body — varies by dimension shape. */}
      {isArray && (
        <ArrayOverrideEditor
          dimension={dimension}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(next) => setValue(next)}
        />
      )}

      {isEnum && (
        <EnumOverrideEditor
          dimension={dimension as 'social_mode' | 'energy_needed'}
          value={typeof value === 'string' ? value : null}
          onChange={(next) => setValue(next)}
        />
      )}

      {isSlider && (
        <SliderOverrideEditor
          dimension={dimension as SliderDimension}
          value={
            value && typeof value === 'object' && !Array.isArray(value)
              ? (value as SliderReading)
              : null
          }
          onChange={(next) => setValue(next)}
        />
      )}

      <div>
        <label
          htmlFor={`note-${dimension}`}
          className="block text-xs font-medium text-zinc mb-1"
        >
          Note (optional)
        </label>
        <input
          id={`note-${dimension}`}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why this override?"
          className="w-full px-2 py-1 text-sm border border-mist rounded focus:outline-none focus:ring-2 focus:ring-blue"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 text-xs font-medium text-zinc hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-blue text-white hover:bg-blue-dark disabled:opacity-50"
        >
          {busy && <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />}
          Save override
        </button>
      </div>
    </div>
  );
}

// ── Editors per dimension shape ─────────────────────────────────────────────

function ArrayOverrideEditor({
  dimension,
  value,
  onChange,
}: {
  dimension: ReviewDimension;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const vocab =
    dimension === 'accessibility'
      ? (ACCESSIBILITY_TAGS as readonly string[])
      : dimension === 'sensory'
      ? (SENSORY_TAGS as readonly string[])
      : (LEAVE_WITH as readonly string[]);
  const labels =
    dimension === 'accessibility'
      ? (ACCESSIBILITY_TAG_LABELS as Record<string, string>)
      : dimension === 'sensory'
      ? (SENSORY_TAG_LABELS as Record<string, string>)
      : (LEAVE_WITH_LABELS as Record<string, string>);
  const set = new Set(value);

  return (
    <div className="flex flex-wrap gap-1.5">
      {vocab.map((tag) => {
        const active = set.has(tag);
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={active}
            onClick={() => {
              const next = new Set(set);
              if (active) next.delete(tag);
              else next.add(tag);
              onChange([...next]);
            }}
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-medium border',
              active
                ? 'bg-blue text-white border-blue'
                : 'bg-white text-ink border-mist hover:border-blue hover:text-blue',
            )}
          >
            {labels[tag]}
          </button>
        );
      })}
    </div>
  );
}

function EnumOverrideEditor({
  dimension,
  value,
  onChange,
}: {
  dimension: 'social_mode' | 'energy_needed';
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const vocab =
    dimension === 'social_mode'
      ? (SOCIAL_MODES as readonly string[])
      : (ENERGY_NEEDED as readonly string[]);
  const labels =
    dimension === 'social_mode'
      ? (SOCIAL_MODE_LABELS as Record<string, string>)
      : (ENERGY_NEEDED_LABELS as Record<string, string>);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {vocab.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : option)}
              className={cn(
                'px-2 py-0.5 rounded-full text-[11px] font-medium border',
                active
                  ? 'bg-blue text-white border-blue'
                  : 'bg-white text-ink border-mist hover:border-blue hover:text-blue',
              )}
            >
              {labels[option]}
            </button>
          );
        })}
      </div>
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[10px] text-zinc underline hover:text-ink"
        >
          Clear (unset override)
        </button>
      )}
    </div>
  );
}

function SliderOverrideEditor({
  dimension,
  value,
  onChange,
}: {
  dimension: SliderDimension;
  value: SliderReading | null;
  onChange: (next: SliderReading | null) => void;
}) {
  const rubric = SLIDER_RUBRICS[dimension];
  const current: SliderReading = value ?? { value: 3, confidence: 'medium', evidence: '' };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-medium text-ink mb-1">{rubric.label}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = current.value === n;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={active}
                aria-label={`${rubric.label} = ${n}: ${rubric.points[n as 1 | 2 | 3 | 4 | 5]}`}
                title={rubric.points[n as 1 | 2 | 3 | 4 | 5]}
                onClick={() =>
                  onChange({ ...current, value: n as 1 | 2 | 3 | 4 | 5 })
                }
                className={cn(
                  'w-8 h-8 rounded-full text-xs font-semibold border',
                  active
                    ? 'bg-blue text-white border-blue'
                    : 'bg-white text-ink border-mist hover:border-blue',
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc mb-1">Confidence</label>
        <select
          value={current.confidence}
          onChange={(e) =>
            onChange({ ...current, confidence: e.target.value as SliderReading['confidence'] })
          }
          className="px-2 py-1 text-xs border border-mist rounded"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc mb-1">Evidence (optional)</label>
        <textarea
          value={current.evidence}
          onChange={(e) => onChange({ ...current, evidence: e.target.value })}
          rows={2}
          className="w-full px-2 py-1 text-xs border border-mist rounded font-mono"
          placeholder="Quote or rationale"
        />
      </div>
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[10px] text-zinc underline hover:text-ink"
        >
          Clear (unset override)
        </button>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// DIMENSION ROW (one section per signal)
// -----------------------------------------------------------------------------

interface DimensionRowProps {
  eventId: string;
  dimension: ReviewDimension;
  title: string;
  description?: string;
  /** Whatever the AI / override decided — rendered above the buttons. */
  body: React.ReactNode;
  evidence?: string | null;
  /** Current override value, fed to the form when opened. */
  currentOverride: SignalOverrideValue;
  latestVerdict?: SignalReview;
  canOverride: boolean;
  onChanged: () => void;
}

function DimensionRow({
  eventId,
  dimension,
  title,
  description,
  body,
  evidence,
  currentOverride,
  latestVerdict,
  canOverride,
  onChanged,
}: DimensionRowProps) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="border border-mist rounded-lg p-4 space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-ink">{title}</h4>
          {description && <p className="text-xs text-zinc">{description}</p>}
        </div>
        {latestVerdict && (
          <VerdictPill verdict={latestVerdict.verdict} reviewer={latestVerdict.reviewer} />
        )}
      </div>

      <div>{body}</div>
      {evidence && <EvidenceQuote text={evidence} />}

      <VerdictButtons
        eventId={eventId}
        dimension={dimension}
        canOverride={canOverride}
        onOverrideClick={() => setEditing(true)}
        onReviewSaved={onChanged}
        busy={busy}
        setBusy={setBusy}
      />

      {editing && (
        <OverrideForm
          eventId={eventId}
          dimension={dimension}
          currentValue={currentOverride}
          onClose={() => setEditing(false)}
          onSaved={onChanged}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// MAIN PANEL
// -----------------------------------------------------------------------------

export function SignalsReviewPanel({
  eventId,
  inferred,
  overrides,
  reviews,
  canOverride,
}: SignalsReviewPanelProps) {
  const router = useRouter();
  const [localReviews, setLocalReviews] = useState<SignalReview[]>([...reviews]);

  // After any verdict / override save, refresh both the local optimistic
  // verdict map AND the server payload (so the override body re-renders
  // with the new value).
  const onChanged = () => {
    router.refresh();
  };

  // Use the up-to-date prop reviews when the parent re-fetches; fall back
  // to local optimistic list during in-flight requests.
  useMemoSyncReviews(reviews, setLocalReviews);

  const verdictMap = useMemo(
    () => latestVerdictByDimension(localReviews),
    [localReviews],
  );

  const sliderReadings = inferred?.sliders ?? {};
  const sliderOverrides = overrides?.sliders ?? {};

  return (
    <section
      aria-labelledby="signals-review-panel-heading"
      className="space-y-4"
    >
      <div className="flex items-baseline justify-between">
        <h3
          id="signals-review-panel-heading"
          className="text-base font-semibold text-ink"
        >
          AI Signals Review
        </h3>
        <p className="text-[11px] text-zinc">
          Audit AI-extracted tagging signals. Sliders are admin-only in v1.
        </p>
      </div>

      {/* ── Vocab dimensions (arrays + enums) ─────────────────────────── */}
      <DimensionRow
        eventId={eventId}
        dimension="accessibility"
        title="Accessibility"
        description="Explicit-only — should be quoted from the page."
        body={
          <ArrayBody
            tags={overrides?.accessibility?.evidence ? Object.keys(overrides.accessibility.evidence) : (inferred?.accessibility?.evidence ? Object.keys(inferred.accessibility.evidence) : [])}
            labels={ACCESSIBILITY_TAG_LABELS as Record<string, string>}
            evidence={overrides?.accessibility?.evidence ?? inferred?.accessibility?.evidence ?? null}
            isOverride={!!overrides?.accessibility}
          />
        }
        currentOverride={
          overrides?.accessibility?.evidence
            ? Object.keys(overrides.accessibility.evidence)
            : []
        }
        latestVerdict={verdictMap.accessibility}
        canOverride={canOverride}
        onChanged={onChanged}
      />

      <DimensionRow
        eventId={eventId}
        dimension="sensory"
        title="Sensory"
        description="May be inferred from event type — evidence should say so."
        body={
          <ArrayBody
            tags={overrides?.sensory?.evidence ? Object.keys(overrides.sensory.evidence) : (inferred?.sensory?.evidence ? Object.keys(inferred.sensory.evidence) : [])}
            labels={SENSORY_TAG_LABELS as Record<string, string>}
            evidence={overrides?.sensory?.evidence ?? inferred?.sensory?.evidence ?? null}
            isOverride={!!overrides?.sensory}
          />
        }
        currentOverride={
          overrides?.sensory?.evidence ? Object.keys(overrides.sensory.evidence) : []
        }
        latestVerdict={verdictMap.sensory}
        canOverride={canOverride}
        onChanged={onChanged}
      />

      <DimensionRow
        eventId={eventId}
        dimension="leave_with"
        title="Leave with"
        body={
          <ArrayBody
            tags={overrides?.leave_with?.evidence ? Object.keys(overrides.leave_with.evidence) : (inferred?.leave_with?.evidence ? Object.keys(inferred.leave_with.evidence) : [])}
            labels={LEAVE_WITH_LABELS as Record<string, string>}
            evidence={overrides?.leave_with?.evidence ?? inferred?.leave_with?.evidence ?? null}
            isOverride={!!overrides?.leave_with}
          />
        }
        currentOverride={
          overrides?.leave_with?.evidence ? Object.keys(overrides.leave_with.evidence) : []
        }
        latestVerdict={verdictMap.leave_with}
        canOverride={canOverride}
        onChanged={onChanged}
      />

      {/* ── Sliders (all four) ──────────────────────────────────────── */}
      {SLIDER_DIMENSIONS.map((dim) => {
        const reading = (sliderOverrides as Record<string, SliderReading>)[dim] ??
          (sliderReadings as Record<string, SliderReading>)[dim] ??
          null;
        const isOverride = !!(sliderOverrides as Record<string, unknown>)[dim];
        return (
          <DimensionRow
            key={dim}
            eventId={eventId}
            dimension={dim}
            title={SLIDER_RUBRICS[dim].label}
            description={SLIDER_RUBRICS[dim].description}
            body={<SliderBody dimension={dim} reading={reading} isOverride={isOverride} />}
            evidence={reading?.evidence ?? null}
            currentOverride={reading}
            latestVerdict={verdictMap[dim]}
            canOverride={canOverride}
            onChanged={onChanged}
          />
        );
      })}
    </section>
  );
}

// -----------------------------------------------------------------------------
// BODY RENDERERS
// -----------------------------------------------------------------------------

function ArrayBody({
  tags,
  labels,
  evidence,
  isOverride,
}: {
  tags: string[];
  labels: Record<string, string>;
  evidence: Record<string, string> | null;
  isOverride: boolean;
}) {
  if (tags.length === 0) {
    return <p className="text-xs text-zinc/70 italic">No tags extracted.</p>;
  }
  return (
    <div className="space-y-2">
      {isOverride && (
        <p className="text-[10px] uppercase tracking-wide text-blue-700 font-semibold">
          Showing reviewer override
        </p>
      )}
      <ul className="space-y-1.5">
        {tags.map((tag) => (
          <li key={tag}>
            <p className="text-xs font-medium text-ink">
              {labels[tag] ?? tag}
            </p>
            {evidence?.[tag] && <EvidenceQuote text={evidence[tag]} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SliderBody({
  dimension,
  reading,
  isOverride,
}: {
  dimension: SliderDimension;
  reading: SliderReading | null;
  isOverride: boolean;
}) {
  if (!reading) {
    return <p className="text-xs text-zinc/70 italic">No reading recorded.</p>;
  }
  const rubric = SLIDER_RUBRICS[dimension];
  const pct = ((reading.value - 1) / 4) * 100;
  return (
    <div className="space-y-2">
      {isOverride && (
        <p className="text-[10px] uppercase tracking-wide text-blue-700 font-semibold">
          Showing reviewer override
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-ink">{reading.value} / 5</span>
        <ConfidenceBadge confidence={reading.confidence} />
      </div>
      <div
        className="relative h-2 bg-cloud rounded-full"
        role="meter"
        aria-label={`${rubric.label} reading`}
        aria-valuenow={reading.value}
        aria-valuemin={1}
        aria-valuemax={5}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue border-2 border-white shadow"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      <dl className="grid grid-cols-3 gap-2 text-[10px] text-zinc">
        <div>
          <dt className="font-semibold">1</dt>
          <dd>{rubric.points[1]}</dd>
        </div>
        <div className="text-center">
          <dt className="font-semibold">3</dt>
          <dd>{rubric.points[3]}</dd>
        </div>
        <div className="text-right">
          <dt className="font-semibold">5</dt>
          <dd>{rubric.points[5]}</dd>
        </div>
      </dl>
    </div>
  );
}

// -----------------------------------------------------------------------------
// HOOKS
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

/**
 * Sync the local optimistic reviews list with the server-fetched prop after
 * router.refresh() resolves. Keeps the verdict pills accurate without an
 * extra fetch from the panel itself.
 */
function useMemoSyncReviews(
  reviews: readonly SignalReview[],
  setLocal: (next: SignalReview[]) => void,
) {
  useEffect(() => {
    setLocal([...reviews]);
  }, [reviews, setLocal]);
}
