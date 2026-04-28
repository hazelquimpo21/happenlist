'use client';

/**
 * SERIES DANGER ZONE
 * ==================
 * Three destructive actions on the series edit page:
 *
 *   1. **Cancel series only** — sets series.status='cancelled'. Attached
 *      events keep their series_id and stay published. Communicates "this
 *      series isn't happening" without erasing it.
 *
 *   2. **Cancel series + N attached events** — same status flip cascaded
 *      to every non-cancelled child. Public archives still show them with
 *      a cancelled treatment.
 *
 *   3. **Delete series + N attached events** — sets deleted_at on both.
 *      Soft-erases — public + admin queries filter deleted_at IS NULL,
 *      so the series and its children disappear from every surface.
 *      Use when the series shouldn't have existed (duplicate, hallucinated
 *      scrape, etc.).
 *
 * All three are SOFT — rows stay in DB. Restore via SQL (no UI undo yet).
 *
 * Cancel vs Delete is the user-facing distinction the user asked for:
 *   "sometimes it's not cancelled, but deleted. those are different things"
 *
 * The two cascading actions require a typed confirmation. The cancel-only
 * action only requires a reason.
 *
 * Coupling:
 *   - DELETE /api/superadmin/series/[id] dispatches on body.mode +
 *     body.cascadeEvents.
 *   - The events_series_start_datetime_uniq partial index excludes
 *     status='cancelled' rows, so re-creating the same series + dates
 *     after a cancel still works.
 *
 * @module components/superadmin/series-danger-zone
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X, Trash2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  seriesId: string;
  seriesTitle: string;
  seriesStatus: string;
  /** True if series.deleted_at is non-null. */
  seriesDeleted: boolean;
  totalEventsCount: number;
  activeEventsCount: number;
}

type Mode =
  | 'idle'
  | 'cancel_only'
  | 'cancel_cascade'
  | 'delete_cascade';

interface ModeMeta {
  /** Headline shown in the modal. */
  title: string;
  /** Body intro shown in the modal. */
  description: (ctx: { title: string; activeEvents: number }) => React.ReactNode;
  /** Button label inside the modal. */
  confirmLabel: (ctx: { activeEvents: number }) => string;
  /** Body sent to the DELETE endpoint. */
  payload: { mode: 'cancel' | 'delete'; cascadeEvents: boolean };
  /** Require typed DELETE/CANCEL confirmation? */
  requireTypedConfirm: boolean;
  /** What the operator types when typed-confirm is required. */
  typedConfirm?: string;
}

const MODE_META: Record<Exclude<Mode, 'idle'>, ModeMeta> = {
  cancel_only: {
    title: 'Cancel series only',
    description: ({ title, activeEvents }) => (
      <>
        Sets <strong>{title}</strong> to{' '}
        <code className="text-xs bg-cloud px-1 rounded">cancelled</code>.{' '}
        Its {activeEvents} attached event{activeEvents === 1 ? '' : 's'} stay
        published.
      </>
    ),
    confirmLabel: () => 'Cancel series only',
    payload: { mode: 'cancel', cascadeEvents: false },
    requireTypedConfirm: false,
  },
  cancel_cascade: {
    title: 'Cancel series + attached events',
    description: ({ title, activeEvents }) => (
      <>
        Sets <strong>{title}</strong> and its{' '}
        <strong>{activeEvents}</strong> active attached event
        {activeEvents === 1 ? '' : 's'} to{' '}
        <code className="text-xs bg-cloud px-1 rounded">cancelled</code>.
        They&rsquo;ll show as cancelled on the public site (still findable
        in archives) — choose Delete instead if they shouldn&rsquo;t exist
        at all.
      </>
    ),
    confirmLabel: ({ activeEvents }) =>
      `Cancel series + ${activeEvents} event${activeEvents === 1 ? '' : 's'}`,
    payload: { mode: 'cancel', cascadeEvents: true },
    requireTypedConfirm: true,
    typedConfirm: 'CANCEL',
  },
  delete_cascade: {
    title: 'Delete series + attached events',
    description: ({ title, activeEvents }) => (
      <>
        Sets <code className="text-xs bg-cloud px-1 rounded">deleted_at</code>{' '}
        on <strong>{title}</strong> and its <strong>{activeEvents}</strong>{' '}
        active attached event{activeEvents === 1 ? '' : 's'}. They disappear
        from every surface (public listings, admin grid, search). Use for
        duplicates, mistakes, hallucinated scrapes — anything that
        shouldn&rsquo;t exist.
      </>
    ),
    confirmLabel: ({ activeEvents }) =>
      `Delete series + ${activeEvents} event${activeEvents === 1 ? '' : 's'}`,
    payload: { mode: 'delete', cascadeEvents: true },
    requireTypedConfirm: true,
    typedConfirm: 'DELETE',
  },
};

export function SeriesDangerZone({
  seriesId,
  seriesTitle,
  seriesStatus,
  seriesDeleted,
  totalEventsCount,
  activeEventsCount,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('idle');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (seriesDeleted) {
    return (
      <Card padding="lg" className="border border-mist bg-cloud/40">
        <h3 className="font-medium text-ink flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-zinc" />
          Series deleted
        </h3>
        <p className="text-sm text-zinc mt-1">
          This series is soft-deleted. Restore via SQL (set{' '}
          <code className="text-xs">deleted_at = NULL</code>) if needed.
        </p>
      </Card>
    );
  }

  if (seriesStatus === 'cancelled') {
    return (
      <Card padding="lg" className="border border-mist bg-cloud/40">
        <h3 className="font-medium text-ink flex items-center gap-2">
          <Ban className="w-4 h-4 text-zinc" />
          Series cancelled
        </h3>
        <p className="text-sm text-zinc mt-1 mb-3">
          {totalEventsCount === 0
            ? 'This series is cancelled and has no attached events.'
            : `This series is cancelled. ${activeEventsCount} attached event${activeEventsCount === 1 ? '' : 's'} still active${
                totalEventsCount > activeEventsCount
                  ? `, ${totalEventsCount - activeEventsCount} cancelled`
                  : ''
              }.`}
        </p>
        <p className="text-xs text-zinc mb-3">
          You can still <strong>delete</strong> it (soft, scrubs from every
          surface) if it shouldn&rsquo;t exist at all.
        </p>
        <Button
          onClick={() => setMode('delete_cascade')}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Delete series + {activeEventsCount} event
          {activeEventsCount === 1 ? '' : 's'}
        </Button>

        {mode !== 'idle' && (
          <ConfirmModal
            mode={mode}
            seriesTitle={seriesTitle}
            activeEventsCount={activeEventsCount}
            reason={reason}
            confirmText={confirmText}
            busy={busy}
            error={error}
            onReasonChange={setReason}
            onConfirmTextChange={setConfirmText}
            onClose={() => {
              if (busy) return;
              setMode('idle');
              setReason('');
              setConfirmText('');
              setError(null);
            }}
            onConfirm={() =>
              handleConfirm(
                mode,
                seriesId,
                reason,
                router,
                setBusy,
                setError
              )
            }
          />
        )}
      </Card>
    );
  }

  return (
    <>
      <Card padding="lg" className="border border-red-200 bg-red-50/40">
        <h3 className="font-medium text-red-800 flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4" />
          Danger zone
        </h3>
        <p className="text-sm text-red-700 mb-4">
          <strong>Cancel</strong> = communicate &ldquo;this won&rsquo;t happen&rdquo;
          (stays visible with a cancelled treatment).{' '}
          <strong>Delete</strong> = scrub from everywhere (use for mistakes,
          duplicates, hallucinated scrapes). Both are soft — rows stay in the
          DB; restore via SQL.
        </p>

        <div className="space-y-2">
          <Button
            variant="secondary"
            onClick={() => setMode('cancel_only')}
            className="w-full sm:w-auto border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            <Ban className="w-4 h-4 mr-1.5" />
            Cancel series only
          </Button>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setMode('cancel_cascade')}
              disabled={activeEventsCount === 0}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white disabled:bg-amber-300"
            >
              <Ban className="w-4 h-4 mr-1.5" />
              {activeEventsCount === 0
                ? 'Cancel series + events (none active)'
                : `Cancel series + ${activeEventsCount} event${activeEventsCount === 1 ? '' : 's'}`}
            </Button>
            <Button
              onClick={() => setMode('delete_cascade')}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              {activeEventsCount === 0
                ? 'Delete series'
                : `Delete series + ${activeEventsCount} event${activeEventsCount === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>

        <p className="text-xs text-zinc mt-3">
          &ldquo;Cancel series only&rdquo; leaves attached events visible on
          the calendar; they stay linked to this (cancelled) series.
        </p>
      </Card>

      {mode !== 'idle' && (
        <ConfirmModal
          mode={mode}
          seriesTitle={seriesTitle}
          activeEventsCount={activeEventsCount}
          reason={reason}
          confirmText={confirmText}
          busy={busy}
          error={error}
          onReasonChange={setReason}
          onConfirmTextChange={setConfirmText}
          onClose={() => {
            if (busy) return;
            setMode('idle');
            setReason('');
            setConfirmText('');
            setError(null);
          }}
          onConfirm={() =>
            handleConfirm(mode, seriesId, reason, router, setBusy, setError)
          }
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------------
// MODAL
// ----------------------------------------------------------------------------

interface ConfirmModalProps {
  mode: Exclude<Mode, 'idle'>;
  seriesTitle: string;
  activeEventsCount: number;
  reason: string;
  confirmText: string;
  busy: boolean;
  error: string | null;
  onReasonChange: (v: string) => void;
  onConfirmTextChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmModal({
  mode,
  seriesTitle,
  activeEventsCount,
  reason,
  confirmText,
  busy,
  error,
  onReasonChange,
  onConfirmTextChange,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const meta = MODE_META[mode];
  const isDelete = mode === 'delete_cascade';
  const reasonOk = reason.trim().length > 0;
  const typedOk =
    !meta.requireTypedConfirm || confirmText === (meta.typedConfirm ?? '');
  const canConfirm = reasonOk && typedOk && !busy;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-pure rounded-xl shadow-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-body text-xl text-ink flex items-center gap-2">
            {isDelete ? (
              <Trash2 className="w-6 h-6 text-red-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            )}
            {meta.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-cloud/50 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-zinc" />
          </button>
        </div>

        <p className="text-zinc mb-4">
          {meta.description({
            title: seriesTitle,
            activeEvents: activeEventsCount,
          })}
        </p>

        <div className="mb-4">
          <label
            htmlFor="dangerReason"
            className="block text-sm font-medium text-ink mb-2"
          >
            Reason <span className="text-red-600">*</span>
          </label>
          <textarea
            id="dangerReason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={2}
            disabled={busy}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none disabled:bg-cloud"
            placeholder={
              isDelete
                ? 'Why are you deleting? (duplicate, scraper mistake, etc.)'
                : 'Why are you cancelling?'
            }
          />
        </div>

        {meta.requireTypedConfirm && meta.typedConfirm && (
          <div className="mb-4">
            <label
              htmlFor="dangerConfirm"
              className="block text-sm font-medium text-ink mb-2"
            >
              Type{' '}
              <code className="text-xs bg-cloud px-1 rounded">
                {meta.typedConfirm}
              </code>{' '}
              to confirm
            </label>
            <input
              id="dangerConfirm"
              type="text"
              value={confirmText}
              onChange={(e) => onConfirmTextChange(e.target.value)}
              disabled={busy}
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none font-mono text-sm disabled:bg-cloud"
              placeholder={meta.typedConfirm}
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
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Back
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`text-white disabled:opacity-50 ${
              isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {busy ? 'Working…' : meta.confirmLabel({ activeEvents: activeEventsCount })}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// REQUEST
// ----------------------------------------------------------------------------

async function handleConfirm(
  mode: Exclude<Mode, 'idle'>,
  seriesId: string,
  reason: string,
  router: ReturnType<typeof useRouter>,
  setBusy: (v: boolean) => void,
  setError: (v: string | null) => void
) {
  const meta = MODE_META[mode];
  setBusy(true);
  setError(null);
  try {
    const res = await fetch(`/api/superadmin/series/${seriesId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: reason.trim(),
        mode: meta.payload.mode,
        cascadeEvents: meta.payload.cascadeEvents,
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
}
