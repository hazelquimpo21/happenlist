'use client';

/**
 * REGENERATE DATES PANEL
 * ======================
 * Series-edit helper: paste/describe a new list of dates, preview the diff
 * against existing instances, one-click apply.
 *
 * Flow:
 *   1. Operator types/pastes a description ("April 5, May 3, June 7").
 *   2. Click "Preview changes" → POST /api/superadmin/series/[id]/regenerate-dates
 *      (action='preview'). Returns { keep, add, drop }.
 *   3. UI renders a three-column diff.
 *   4. Click "Apply" → same endpoint with action='apply' → server inserts new
 *      events + cancels dropped ones (soft-delete), writes audit log.
 *
 * Template: the server clones a "template" instance (first active one) into
 * each new date. Admin edits individual instances post-apply if needed.
 *
 * @module components/superadmin/regenerate-dates-panel
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle,
  CalendarPlus,
  CalendarMinus,
  CalendarCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KeepEntry {
  instance_date: string;
  start_datetime: string;
  existing_event_id: string;
  existing_title: string;
}

interface AddEntry {
  instance_date: string;
  start_datetime: string;
}

interface DropEntry {
  instance_date: string;
  start_datetime: string;
  existing_event_id: string;
  existing_title: string;
  existing_status: string;
}

interface Diff {
  keep: KeepEntry[];
  add: AddEntry[];
  drop: DropEntry[];
}

type Stage = 'idle' | 'preview_loading' | 'preview' | 'applying' | 'done';

interface Props {
  seriesId: string;
}

export function RegenerateDatesPanel({ seriesId }: Props) {
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [diff, setDiff] = useState<Diff | null>(null);

  const preview = async () => {
    setError(null);
    setStage('preview_loading');
    try {
      const res = await fetch(`/api/superadmin/series/${seriesId}/regenerate-dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, action: 'preview' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Preview failed (${res.status})`);
        setStage('idle');
        return;
      }
      setDiff(data.diff as Diff);
      setStage('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setStage('idle');
    }
  };

  const apply = async () => {
    setError(null);
    setStage('applying');
    try {
      const res = await fetch(`/api/superadmin/series/${seriesId}/regenerate-dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, action: 'apply' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Apply failed (${res.status})`);
        setStage('preview');
        return;
      }
      setStage('done');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setStage('preview');
    }
  };

  const startOver = () => {
    setStage('idle');
    setDiff(null);
    setError(null);
  };

  return (
    <div className="bg-pure border border-mist rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-ink">Regenerate dates from text</h3>
        <p className="text-sm text-zinc mt-1">
          Paste a new date list or recurrence description. The scraper parses it, we diff against current instances,
          and you approve the adds / drops before anything writes to the DB. New instances clone template fields from
          an existing instance.
        </p>
      </div>

      {stage === 'idle' && (
        <>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            placeholder="e.g. April 5, May 3, June 7, July 12, August 9&#10;or: every Saturday through July at 10am"
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-1 focus:ring-blue outline-none resize-y font-mono text-sm"
          />
          <div className="flex justify-end">
            <Button onClick={preview} disabled={description.trim().length < 4}>
              <Sparkles className="w-4 h-4" /> Preview changes
            </Button>
          </div>
        </>
      )}

      {stage === 'preview_loading' && (
        <div className="flex items-center gap-2 py-8 justify-center text-zinc">
          <Loader2 className="w-5 h-5 animate-spin text-blue" />
          <span className="text-sm">Parsing dates and diffing…</span>
        </div>
      )}

      {(stage === 'preview' || stage === 'applying') && diff && (
        <div className="space-y-4">
          <DiffColumns diff={diff} />

          <div className="flex items-center justify-between pt-3 border-t border-mist">
            <button
              type="button"
              onClick={startOver}
              className="text-sm text-zinc hover:text-ink underline"
              disabled={stage === 'applying'}
            >
              ← Change description
            </button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={startOver} disabled={stage === 'applying'}>
                Cancel
              </Button>
              <Button
                onClick={apply}
                disabled={stage === 'applying' || (diff.add.length === 0 && diff.drop.length === 0)}
              >
                {stage === 'applying' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</>
                ) : (
                  `Apply ${diff.add.length + diff.drop.length} change${diff.add.length + diff.drop.length === 1 ? '' : 's'}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {stage === 'done' && diff && (
        <div className="flex items-start gap-3 p-4 bg-emerald/10 border border-emerald/30 rounded-md">
          <CheckCircle className="w-5 h-5 text-emerald flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-ink">Schedule regenerated</div>
            <div className="text-sm text-zinc mt-1">
              {diff.add.length} added, {diff.drop.length} cancelled, {diff.keep.length} unchanged.
              New events are in <code>pending_review</code>.
            </div>
            <Button variant="outline" size="sm" onClick={startOver} className="mt-3">
              Regenerate again
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

function DiffColumns({ diff }: { diff: Diff }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <DiffColumn
        label="Keep"
        count={diff.keep.length}
        icon={<CalendarCheck className="w-4 h-4" />}
        tint="green"
        items={diff.keep.map(k => ({ date: k.instance_date, label: k.existing_title }))}
      />
      <DiffColumn
        label="Add"
        count={diff.add.length}
        icon={<CalendarPlus className="w-4 h-4" />}
        tint="blue"
        items={diff.add.map(a => ({ date: a.instance_date, label: 'new instance' }))}
      />
      <DiffColumn
        label="Cancel"
        count={diff.drop.length}
        icon={<CalendarMinus className="w-4 h-4" />}
        tint="red"
        items={diff.drop.map(d => ({ date: d.instance_date, label: d.existing_title }))}
      />
    </div>
  );
}

function DiffColumn({
  label,
  count,
  icon,
  tint,
  items,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  tint: 'green' | 'blue' | 'red';
  items: { date: string; label: string }[];
}) {
  const tintMap = {
    green: { border: 'border-emerald/30', bg: 'bg-emerald/5', text: 'text-emerald' },
    blue: { border: 'border-blue/30', bg: 'bg-blue/5', text: 'text-blue' },
    red: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700' },
  };
  const t = tintMap[tint];
  return (
    <div className={cn('rounded-md border p-3', t.border, t.bg)}>
      <div className={cn('flex items-center gap-2 font-medium text-sm', t.text)}>
        {icon}
        {label} <span className="text-xs font-normal">({count})</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-zinc mt-2 italic">Nothing in this bucket.</p>
      ) : (
        <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto text-xs text-ink">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="font-mono flex-shrink-0">{item.date}</span>
              <span className="text-zinc truncate">— {item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
