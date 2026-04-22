/**
 * COLLECTION CHILDREN PANEL — list, add, and detach children for a parent event.
 *
 * Renders on the parent event's edit form. The panel:
 *   - fetches children via /api/admin/events/search?parentId=<this>
 *   - renders a chronological list with a Detach button per child
 *   - "Add child" opens a search input, picking a candidate PATCHes that
 *     event's parent_event_id to this one (immediate write, no form save)
 *
 * Writes flow through the existing PATCH /api/superadmin/events/[id]. No new
 * write endpoint — parent_event_id is a normal updatable column.
 *
 * NOTE: This panel writes IMMEDIATELY on add/detach. Not part of the parent
 * form's submit cycle. The rationale: these are relationship edits on OTHER
 * events, and coupling them to the parent's save-button would be surprising.
 * The immediate-write pattern matches how series management works elsewhere.
 *
 * Used by: SuperadminEventEditForm (collection-builder slot). Phase E3.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, Loader2, Plus, Layers, Calendar, Unlink } from 'lucide-react';

interface ChildHit {
  id: string;
  title: string;
  slug: string;
  instance_date: string | null;
  series_id: string | null;
  parent_event_id: string | null;
}

interface Props {
  parentEventId: string;
  /** Initial count surfaced from the edit form's join; drives empty-state copy. */
  initialChildCount: number;
}

export function CollectionChildrenPanel({ parentEventId, initialChildCount }: Props) {
  const [children, setChildren] = useState<ChildHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerResults, setPickerResults] = useState<ChildHit[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/search?parentId=${encodeURIComponent(parentEventId)}&limit=100`, {
        cache: 'no-store',
      });
      const payload = await res.json();
      if (payload?.success) {
        setChildren(payload.events as ChildHit[]);
      } else {
        setMessage({ kind: 'error', text: payload?.error ?? 'Failed to load children' });
      }
    } catch (err) {
      console.warn('[children-panel] refresh failed', err);
      setMessage({ kind: 'error', text: 'Network error loading children' });
    } finally {
      setLoading(false);
    }
  }, [parentEventId]);

  useEffect(() => {
    if (initialChildCount > 0 || children === null) {
      void refresh();
    }
  }, [refresh, initialChildCount, children]);

  // Picker search: debounce 200ms, exclude self + any existing children.
  const runSearch = useCallback(async (q: string) => {
    setPickerLoading(true);
    try {
      const url = `/api/admin/events/search?q=${encodeURIComponent(q)}&limit=12&exclude=${encodeURIComponent(parentEventId)}`;
      const res = await fetch(url, { cache: 'no-store' });
      const payload = await res.json();
      const rows = (payload?.events ?? []) as ChildHit[];
      // Filter out events already attached to THIS parent so admins don't
      // accidentally re-pick. Children of OTHER parents are kept and
      // reassigning reparents them — an intentional behavior.
      const existing = new Set((children ?? []).map((c) => c.id));
      setPickerResults(rows.filter((r) => !existing.has(r.id)));
    } catch (err) {
      console.warn('[children-panel] picker search failed', err);
      setPickerResults([]);
    } finally {
      setPickerLoading(false);
    }
  }, [parentEventId, children]);

  useEffect(() => {
    if (!pickerOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(pickerQuery), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [pickerQuery, pickerOpen, runSearch]);

  async function patchChild(eventId: string, parentValue: string | null, actionLabel: string) {
    setMessage(null);
    try {
      const res = await fetch(`/api/superadmin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { parent_event_id: parentValue },
          notes: `Children panel: ${actionLabel}`,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        const reason = payload?.message || payload?.error || `HTTP ${res.status}`;
        setMessage({ kind: 'error', text: `${actionLabel} failed: ${reason}` });
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[children-panel] patch failed', err);
      setMessage({ kind: 'error', text: `${actionLabel} failed: network error` });
      return false;
    }
  }

  async function attachChild(hit: ChildHit) {
    const ok = await patchChild(hit.id, parentEventId, 'Attach child');
    if (ok) {
      setMessage({ kind: 'info', text: `Attached "${hit.title}"` });
      setPickerOpen(false);
      setPickerQuery('');
      setPickerResults([]);
      await refresh();
    }
  }

  async function detachChild(hit: ChildHit) {
    if (!confirm(`Detach "${hit.title}" from this collection? It will return to the main feed.`)) return;
    const ok = await patchChild(hit.id, null, 'Detach child');
    if (ok) {
      setMessage({ kind: 'info', text: `Detached "${hit.title}"` });
      await refresh();
    }
  }

  return (
    <div className="p-4 bg-indigo-50/50 border border-indigo-200/60 rounded-lg space-y-3">
      <div className="flex items-start gap-3">
        <Layers className="w-5 h-5 text-indigo-700 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-indigo-900">Children in this collection</p>
          <p className="text-xs text-indigo-800/80 mt-0.5">
            Children are hidden from the main feed and appear on this event&apos;s landing page.
            Attach existing events as children, or create new ones first and attach them from here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Plus className="w-3.5 h-3.5" />
          Add child
        </button>
      </div>

      {message && (
        <div
          className={
            message.kind === 'error'
              ? 'text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5'
              : 'text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5'
          }
        >
          {message.text}
        </div>
      )}

      {pickerOpen && (
        <div className="p-3 bg-pure border border-indigo-300 rounded-md space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc" />
              <input
                type="text"
                autoFocus
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                placeholder="Search events by title..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-mist rounded bg-pure focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              {pickerLoading && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc animate-spin" />
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setPickerOpen(false);
                setPickerQuery('');
                setPickerResults([]);
              }}
              className="p-2 text-zinc hover:text-ink"
              aria-label="Close picker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {pickerResults.length > 0 ? (
            <ul className="max-h-56 overflow-y-auto divide-y divide-mist border border-mist rounded">
              {pickerResults.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    onClick={() => attachChild(hit)}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50/60 flex items-center justify-between gap-3"
                  >
                    <span className="text-sm font-medium text-ink truncate">{hit.title}</span>
                    <span className="text-xs text-zinc flex-shrink-0 flex items-center gap-1">
                      {hit.parent_event_id && hit.parent_event_id !== parentEventId && (
                        <span className="text-amber-700" title="Currently a child of another event — selecting will reparent">
                          reparent
                        </span>
                      )}
                      {hit.instance_date ?? '—'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !pickerLoading && pickerQuery.length > 0 && (
              <p className="text-xs text-zinc px-1">No events match &ldquo;{pickerQuery}&rdquo;.</p>
            )
          )}
        </div>
      )}

      {/* Children list */}
      {loading && children === null ? (
        <p className="text-xs text-indigo-800/70 italic">Loading children…</p>
      ) : children && children.length > 0 ? (
        <ul className="divide-y divide-indigo-100 bg-pure border border-indigo-200 rounded">
          {children.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-3 py-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
              <a
                href={`/admin/events/${c.id}/edit`}
                className="text-sm font-medium text-ink hover:text-indigo-700 truncate flex-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.title}
              </a>
              <span className="text-xs text-zinc flex-shrink-0">{c.instance_date ?? '—'}</span>
              <button
                type="button"
                onClick={() => detachChild(c)}
                className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-900 px-2 py-1"
                title="Detach — event returns to the main feed"
              >
                <Unlink className="w-3 h-3" />
                Detach
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-indigo-800/70 italic">No children yet. Click &ldquo;Add child&rdquo; to build the collection.</p>
      )}
    </div>
  );
}
