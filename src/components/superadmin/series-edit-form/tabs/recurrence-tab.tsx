/**
 * Recurrence tab — schedule rule and date regeneration
 * ======================================================
 * Two surfaces stacked:
 *
 *   1. Recurrence rule editor (NL parser → preview → save). Saves via
 *      PATCH /api/superadmin/series/[id] with `updates.recurrence_rule`.
 *   2. RegenerateDatesPanel — paste a fresh schedule and apply a diff.
 *
 * Each owns its own save action — they hit different surfaces of the API
 * and the diff between them is non-trivial.
 *
 * @module components/superadmin/series-edit-form/tabs/recurrence-tab
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { buildRecurrenceLabel } from '@/lib/events/collapse';
import { RecurrenceNaturalInput } from '../../recurrence-natural-input';
import { RegenerateDatesPanel } from '../../regenerate-dates-panel';
import type { RecurrenceRule } from '@/lib/supabase/types';

interface ExtendOutcome {
  status: string;
  generated: number;
  futureCount: number;
  reason: string | null;
}

function describeExtendOutcome(o: ExtendOutcome): string {
  switch (o.status) {
    case 'extended':
      return `Generated ${o.generated} new instance${o.generated === 1 ? '' : 's'}.`;
    case 'sufficient':
      return o.generated > 0
        ? `Generated ${o.generated} new instance${o.generated === 1 ? '' : 's'}.`
        : 'No new instances needed — schedule is already filled out.';
    case 'exhausted_count':
      return 'No new instances — series has reached its end_count.';
    case 'exhausted_date':
      return 'No new instances — series has reached its end_date.';
    case 'at_max_cap':
      return o.generated > 0
        ? `Generated ${o.generated}; further extension blocked by the 52-instance cap.`
        : 'No new instances — series is at the 52-instance cap.';
    case 'no_template':
      return 'No new instances — this series has no existing events to clone fields from. Add at least one event first, then re-save the rule.';
    case 'no_rule':
      return 'No new instances — recurrence_rule was empty.';
    case 'error':
      return `Materialization error: ${o.reason ?? 'unknown'}`;
    default:
      return `Status: ${o.status}.`;
  }
}

interface Props {
  seriesId: string;
  seriesType: string | null;
  currentRule: RecurrenceRule | null;
  startDate: string | null;
  onSaved: () => void;
}

export function RecurrenceTab({
  seriesId,
  seriesType,
  currentRule,
  startDate,
  onSaved,
}: Props) {
  const [pendingRule, setPendingRule] = useState<RecurrenceRule | null>(null);
  const [pendingLabel, setPendingLabel] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extendOutcome, setExtendOutcome] = useState<ExtendOutcome | null>(null);

  const currentLabel = currentRule
    ? buildRecurrenceLabel(currentRule as unknown as Record<string, unknown>, seriesType)
    : null;

  const applyPending = async () => {
    if (!pendingRule) return;
    setSaveStatus('saving');
    setErrorMsg(null);
    setExtendOutcome(null);
    try {
      const response = await fetch(`/api/superadmin/series/${seriesId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { recurrence_rule: pendingRule },
          notes: `Recurrence updated via NL parser: "${pendingLabel}"`,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Failed (${response.status})`);
      setSaveStatus('saved');
      setExtendOutcome(data.extend ?? null);
      setPendingRule(null);
      setPendingLabel('');
      onSaved();
    } catch (err) {
      setSaveStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-ink">Recurrence rule</h3>
          <p className="text-sm text-zinc mt-1">
            {currentLabel ? (
              <>
                Currently: <strong className="text-ink">{currentLabel}</strong>
              </>
            ) : (
              <span className="italic text-silver">No rule set</span>
            )}
          </p>
        </div>

        <RecurrenceNaturalInput
          startDate={startDate}
          onParsed={({ rule, description }) => {
            setPendingRule(rule);
            setPendingLabel(description);
            setSaveStatus('idle');
            setErrorMsg(null);
          }}
        />

        {pendingRule && (
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-mist">
            <div className="text-sm text-zinc">
              Ready to save: <strong className="text-ink">{pendingLabel}</strong>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setPendingRule(null);
                  setPendingLabel('');
                }}
                disabled={saveStatus === 'saving'}
              >
                Discard
              </Button>
              <Button onClick={applyPending} disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? 'Saving…' : 'Save recurrence'}
              </Button>
            </div>
          </div>
        )}

        {saveStatus === 'saved' && (
          <div className="space-y-1">
            <p className="text-sm text-emerald">Recurrence saved.</p>
            {extendOutcome && (
              <p
                className={`text-xs ${
                  extendOutcome.status === 'extended' || extendOutcome.generated > 0
                    ? 'text-emerald'
                    : extendOutcome.status === 'error'
                    ? 'text-rose'
                    : 'text-zinc'
                }`}
              >
                {describeExtendOutcome(extendOutcome)}
              </p>
            )}
          </div>
        )}
        {saveStatus === 'error' && errorMsg && (
          <p className="text-sm text-rose">{errorMsg}</p>
        )}
      </div>

      <div className="pt-4 border-t border-mist">
        <RegenerateDatesPanel seriesId={seriesId} />
      </div>
    </div>
  );
}
