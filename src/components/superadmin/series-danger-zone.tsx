'use client';

/**
 * SERIES DANGER ZONE
 * ==================
 * Soft-cancel actions on the series edit page. Two buttons:
 *
 *   1. "Cancel series only" — sets series.status='cancelled'. Child events
 *      keep their series_id and stay published. Useful when the series row
 *      itself is wrong but the events should remain on the calendar.
 *
 *   2. "Cancel series + N attached events" — cascades. Sets status='cancelled'
 *      on the series AND every non-cancelled child event. Used when the
 *      whole thing should disappear (mistaken series, organizer cancelled
 *      the whole run, etc.).
 *
 * Both are SOFT — rows stay in DB, restored via SQL flipping status. No
 * UI restore yet; build that pattern when the use case shows up.
 *
 * The cascade button requires a typed "DELETE" confirmation and a non-empty
 * reason. The non-cascade button still requires a reason but no typed guard.
 *
 * Coupling:
 *   - DELETE /api/superadmin/series/[id] dispatches on body.cascadeEvents.
 *   - Cancelled rows are excluded from the events_series_start_datetime_uniq
 *     partial index, so re-creating the same series + dates works after.
 *
 * @module components/superadmin/series-danger-zone
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  seriesId: string;
  seriesTitle: string;
  seriesStatus: string;
  totalEventsCount: number;
  activeEventsCount: number;
}

type Mode = 'idle' | 'series_only' | 'cascade';

export function SeriesDangerZone({
  seriesId,
  seriesTitle,
  seriesStatus,
  totalEventsCount,
  activeEventsCount,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('idle');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (seriesStatus === 'cancelled') {
    return (
      <Card padding="lg" className="border border-mist bg-cloud/40">
        <h3 className="font-medium text-ink flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-zinc" />
          Series cancelled
        </h3>
        <p className="text-sm text-zinc mt-1">
          {totalEventsCount === 0
            ? 'This series is cancelled and has no attached events.'
            : `This series is cancelled. ${activeEventsCount} attached event${activeEventsCount === 1 ? '' : 's'} still active${
                totalEventsCount > activeEventsCount
                  ? `, ${totalEventsCount - activeEventsCount} cancelled`
                  : ''
              }.`}
        </p>
      </Card>
    );
  }

  const closeModal = () => {
    if (busy) return;
    setMode('idle');
    setReason('');
    setConfirmText('');
    setError(null);
  };

  const handleConfirm = async () => {
    if (mode === 'idle') return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/superadmin/series/${seriesId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason.trim(),
          cascadeEvents: mode === 'cascade',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || `Failed (${res.status})`);
      }
      router.push('/admin/series');
      router.refresh();
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : 'Network error');
    }
  };

  const isCascade = mode === 'cascade';
  const requiredConfirm = 'DELETE';
  const reasonOk = reason.trim().length > 0;
  const cascadeConfirmOk = !isCascade || confirmText === requiredConfirm;
  const canConfirm = reasonOk && cascadeConfirmOk && !busy;

  return (
    <>
      <Card padding="lg" className="border border-red-200 bg-red-50/40">
        <h3 className="font-medium text-red-800 flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4" />
          Danger zone
        </h3>
        <p className="text-sm text-red-700 mb-4">
          Cancelling is reversible (rows stay in the DB with{' '}
          <code className="text-xs bg-red-100 px-1 rounded">status=cancelled</code>
          ), but there&rsquo;s no UI undo yet — restore via SQL if needed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            onClick={() => setMode('series_only')}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Cancel series only
          </Button>
          <Button
            onClick={() => setMode('cascade')}
            disabled={activeEventsCount === 0}
            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300"
          >
            {activeEventsCount === 0
              ? 'Cancel series + events (none active)'
              : `Cancel series + ${activeEventsCount} attached event${activeEventsCount === 1 ? '' : 's'}`}
          </Button>
        </div>

        <p className="text-xs text-zinc mt-3">
          &ldquo;Cancel series only&rdquo; leaves attached events visible on the
          calendar; they stay linked to this (cancelled) series.
        </p>
      </Card>

      {mode !== 'idle' && (
        <div
          className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-pure rounded-xl shadow-xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-body text-xl text-ink flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                {isCascade ? 'Cancel series + attached events' : 'Cancel series only'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-cloud/50 rounded-lg"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-zinc" />
              </button>
            </div>

            <p className="text-zinc mb-4">
              {isCascade ? (
                <>
                  This will set <strong className="text-ink">{seriesTitle}</strong>{' '}
                  and its <strong className="text-ink">{activeEventsCount}</strong>{' '}
                  active attached event{activeEventsCount === 1 ? '' : 's'} to{' '}
                  <code className="text-xs bg-cloud px-1 rounded">cancelled</code>.
                  Everything disappears from the public calendar.
                </>
              ) : (
                <>
                  This will set <strong className="text-ink">{seriesTitle}</strong>{' '}
                  to <code className="text-xs bg-cloud px-1 rounded">cancelled</code>.{' '}
                  Its {activeEventsCount} attached event
                  {activeEventsCount === 1 ? '' : 's'} stay published.
                </>
              )}
            </p>

            <div className="mb-4">
              <label htmlFor="dangerReason" className="block text-sm font-medium text-ink mb-2">
                Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                id="dangerReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                disabled={busy}
                className="w-full px-4 py-2 border border-mist rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none disabled:bg-cloud"
                placeholder="Why are you cancelling?"
              />
            </div>

            {isCascade && (
              <div className="mb-4">
                <label htmlFor="dangerConfirm" className="block text-sm font-medium text-ink mb-2">
                  Type <code className="text-xs bg-cloud px-1 rounded">{requiredConfirm}</code>{' '}
                  to confirm
                </label>
                <input
                  id="dangerConfirm"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={busy}
                  className="w-full px-4 py-2 border border-mist rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none font-mono text-sm disabled:bg-cloud"
                  placeholder={requiredConfirm}
                  autoComplete="off"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-700 mb-3" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={closeModal} disabled={busy}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300"
              >
                {busy
                  ? 'Cancelling…'
                  : isCascade
                  ? `Cancel series + ${activeEventsCount} event${activeEventsCount === 1 ? '' : 's'}`
                  : 'Cancel series only'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
