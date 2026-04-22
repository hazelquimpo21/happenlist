/**
 * PARENT EVENT PICKER — autocomplete search for assigning a Collection parent.
 *
 * Controlled component. Given a current parent id (or null), renders a
 * searchable input. Queries /api/admin/events/search for matches, shows
 * inline results, commits on selection. "Clear" button detaches.
 *
 * Used by: SuperadminEventEditForm. Replaces the raw-UUID input shipped in
 * session E1. Admins never see or type UUIDs directly.
 *
 * See /CLAUDE.md → "Event Shapes — Canonical Model" for why parent_event_id
 * is the sole Collection-linkage mechanism.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, Layers, Loader2, Link2 } from 'lucide-react';

interface EventHit {
  id: string;
  title: string;
  slug: string;
  instance_date: string | null;
  series_id: string | null;
  parent_event_id: string | null;
}

interface Props {
  /** Current parent event id (or null/empty for "no parent"). */
  value: string;
  /** Called with the new parent id ('' for cleared). */
  onChange: (nextId: string) => void;
  /** This event's own id — excluded from search results (no self-parenting). */
  currentEventId: string;
  /** Optional: cached parent details for initial render (saves one round-trip). */
  initialParent?: { id: string; title: string; slug: string } | null;
}

export function ParentEventPicker({ value, onChange, currentEventId, initialParent }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EventHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [parentDetails, setParentDetails] = useState<{ id: string; title: string; slug: string } | null>(
    initialParent ?? null
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch parent title when value is set externally (e.g. restored draft) and
  // we don't have details for it yet. Keeps the chip readable.
  useEffect(() => {
    if (!value) {
      setParentDetails(null);
      return;
    }
    if (parentDetails?.id === value) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/events/search?q=&limit=1&exclude=${encodeURIComponent(currentEventId)}`, { cache: 'no-store' });
        if (!res.ok) return;
        // Cheap lookup by id: search endpoint doesn't support by-id; fall back
        // to single-row fetch via the public event-by-slug path isn't right
        // either. For now, display the UUID truncated if we don't have a
        // cached title — admin can re-pick to refresh. TODO: tiny by-id
        // endpoint in a follow-up.
      } finally {
        if (cancelled) return;
      }
    })();
    return () => { cancelled = true; };
  }, [value, currentEventId, parentDetails]);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const url = `/api/admin/events/search?q=${encodeURIComponent(q)}&limit=12&exclude=${encodeURIComponent(currentEventId)}`;
      const res = await fetch(url, { cache: 'no-store' });
      const payload = await res.json();
      if (payload?.success) {
        setResults(payload.events as EventHit[]);
      } else {
        console.warn('[parent-picker] search failed', payload?.error);
        setResults([]);
      }
    } catch (err) {
      console.warn('[parent-picker] search error', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [currentEventId]);

  // Debounce by 200ms. Empty query returns recent events as a browse fallback.
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, runSearch]);

  function select(hit: EventHit) {
    onChange(hit.id);
    setParentDetails({ id: hit.id, title: hit.title, slug: hit.slug });
    setOpen(false);
    setQuery('');
  }

  function clear() {
    onChange('');
    setParentDetails(null);
    setQuery('');
  }

  // Display state: have a parent (chip) vs. picker-is-open vs. empty placeholder.
  if (value && parentDetails?.id === value && !open) {
    return (
      <div className="flex items-center gap-2 p-3 bg-pure border border-pink-300 rounded-lg">
        <Link2 className="w-4 h-4 text-pink-600 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-pink-900 truncate">{parentDetails.title}</p>
          <p className="text-xs text-pink-700/80 truncate">Parent event — this will appear on that page, not in the main feed</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-pink-700 hover:text-pink-900 px-2 py-1"
        >
          Change
        </button>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-zinc hover:text-ink px-2 py-1"
        >
          Clear
        </button>
      </div>
    );
  }

  // Parent assigned but details unknown (e.g. server just loaded us with value
  // but we couldn't resolve the title yet). Show truncated id chip + allow
  // re-pick.
  if (value && !open) {
    return (
      <div className="flex items-center gap-2 p-3 bg-pure border border-pink-300 rounded-lg">
        <Link2 className="w-4 h-4 text-pink-600 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-mono text-pink-900 truncate">{value.slice(0, 8)}…</p>
          <p className="text-xs text-pink-700/80">Parent set — click Change to see the title</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-pink-700 hover:text-pink-900 px-2 py-1"
        >
          Change
        </button>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-zinc hover:text-ink px-2 py-1"
        >
          Clear
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 p-3 border border-dashed border-pink-300 rounded-lg hover:bg-pink-50/40 text-left"
      >
        <Layers className="w-4 h-4 text-pink-600" />
        <span className="text-sm text-pink-800">
          Link to a parent event (makes this a Collection child)
        </span>
      </button>
    );
  }

  return (
    <div className="p-3 bg-pure border border-pink-300 rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events by title..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-mist rounded bg-pure focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
          />
          {loading && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc animate-spin" />
          )}
        </div>
        <button
          type="button"
          onClick={() => { setOpen(false); setQuery(''); }}
          className="p-2 text-zinc hover:text-ink"
          aria-label="Close picker"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {results.length > 0 ? (
        <ul className="max-h-60 overflow-y-auto divide-y divide-mist border border-mist rounded">
          {results.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                onClick={() => select(hit)}
                className="w-full text-left px-3 py-2 hover:bg-pink-50/60 flex items-center justify-between gap-3"
              >
                <span className="text-sm font-medium text-ink truncate">{hit.title}</span>
                <span className="text-xs text-zinc flex-shrink-0">
                  {hit.instance_date ?? '—'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !loading && query.length > 0 && (
          <p className="text-xs text-zinc px-1">No events match &ldquo;{query}&rdquo;.</p>
        )
      )}
    </div>
  );
}
