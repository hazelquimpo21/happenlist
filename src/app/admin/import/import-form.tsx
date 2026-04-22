'use client';

/**
 * IMPORT FORM
 * ===========
 * Client UI for /admin/import. Three-stage flow:
 *   1. Input   — URL tab or Text tab.
 *   2. Preview — inline-editable per-event card. Each card shows title, date,
 *                category, price, ticket URL, venue name as live inputs so the
 *                operator can fix scraper mistakes BEFORE committing.
 *   3. Done    — save results with links into the admin review queue.
 *
 * Coupling notes:
 * - Response shapes match lib/scraper/types (single vs multi).
 * - Save route expects ScraperEvent[] + fallbackSourceUrl.
 * - Inline edits are captured into an `edits` map keyed by event index and
 *   merged over the scraper payload at save time — the original `analyzed`
 *   array is never mutated (so "Reset" can restore scraper values).
 *
 * @module app/admin/import/import-form
 */

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Link as LinkIcon,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  ScraperEvent,
  ScraperAnalyzeResponse,
} from '@/lib/scraper/types';
import type { DuplicateCandidate } from '@/lib/scraper/save-event';

// ============================================================================
// TYPES
// ============================================================================

type Tab = 'url' | 'text';
type Stage = 'input' | 'analyzing' | 'preview' | 'saving' | 'done';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface ImportFormProps {
  categories: CategoryOption[];
}

interface SaveResultEntry {
  index: number;
  ok: boolean;
  eventId?: string;
  slug?: string;
  status?: string;
  code?: string;
  errors?: string[];
  error?: string;
  existingEventId?: string;
  existingTitle?: string;
  existingStatus?: string;
}

/**
 * Fields the operator can edit inline. Deliberately narrow — these are the
 * five places scraper mistakes happen most often. Anything more nuanced
 * (organizer, description, tags, etc.) is fixed post-save via the full
 * event edit form.
 */
interface EventEdits {
  title?: string;
  start_datetime?: string; // ISO — we build from a local-datetime input
  category_slug?: string | null;
  price_type?: string;
  price_low?: number | null;
  price_high?: number | null;
  ticket_url?: string;
  venue_name?: string;
}

const PRICE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'range', label: 'Range' },
  { value: 'varies', label: 'Varies' },
  { value: 'donation', label: 'Donation' },
  { value: 'per_session', label: 'Per session' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ImportForm({ categories }: ImportFormProps) {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('url');
  const [stage, setStage] = useState<Stage>('input');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // URL tab state
  const [url, setUrl] = useState('');
  const [urlHint, setUrlHint] = useState('');

  // Text tab state
  const [text, setText] = useState('');
  const [textSourceUrl, setTextSourceUrl] = useState('');
  const [textHint, setTextHint] = useState('');

  // Preview state
  const [analyzed, setAnalyzed] = useState<ScraperEvent[]>([]);
  const [fallbackSourceUrl, setFallbackSourceUrl] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  /**
   * Inline edits per event index. Overrides the scraper values at save time.
   * Never mutate the analyzed array — keeps "reset" trivial and predictable.
   */
  const [edits, setEdits] = useState<Map<number, EventEdits>>(new Map());

  const [saveResults, setSaveResults] = useState<SaveResultEntry[]>([]);

  /**
   * Fuzzy duplicate candidates per preview index. Populated asynchronously
   * after analyze completes — the UI renders immediately without them and
   * decorates when they arrive. Keyed by preview index; absent key = none.
   */
  const [duplicateMap, setDuplicateMap] = useState<Record<number, DuplicateCandidate[]>>({});

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  const resetToInput = useCallback(() => {
    setStage('input');
    setErrorMsg(null);
    setAnalyzed([]);
    setSelected(new Set());
    setSaveResults([]);
    setEdits(new Map());
    setDuplicateMap({});
  }, []);

  /**
   * After analyze returns, fire a background POST to /check-duplicates. The
   * preview is already visible — we just decorate it with warnings when the
   * RPC comes back. Failure is silent (dedupe is advisory, not fatal).
   */
  const fetchDuplicateHints = useCallback(async (events: ScraperEvent[]) => {
    const candidates = events
      .map((ev, i) => ({
        index: i,
        title: (ev.title ?? '').trim(),
        start_datetime: ev.start_datetime,
        venue_name: ev.venue?.name ?? null,
      }))
      .filter(c => c.title && c.start_datetime);
    if (candidates.length === 0) return;
    try {
      const res = await fetch('/api/superadmin/import/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { duplicates?: Record<number, DuplicateCandidate[]> };
      setDuplicateMap(data.duplicates ?? {});
    } catch {
      // Silent — dedupe is informational.
    }
  }, []);

  const analyze = useCallback(async () => {
    setErrorMsg(null);
    setStage('analyzing');

    const body: Record<string, unknown> =
      tab === 'url'
        ? { mode: 'url', url: url.trim(), hint: urlHint.trim() || undefined }
        : {
            mode: 'text',
            text: text.trim(),
            sourceUrl: textSourceUrl.trim() || undefined,
            hint: textHint.trim() || undefined,
          };

    try {
      const res = await fetch('/api/superadmin/import/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ScraperAnalyzeResponse | { error: string };

      if (!res.ok || 'error' in data) {
        setErrorMsg('error' in data ? data.error : `Analyze failed (${res.status})`);
        setStage('input');
        return;
      }

      const events: ScraperEvent[] = data.multi ? data.events : [data.event];
      const fallback = tab === 'url' ? url.trim() : (textSourceUrl.trim() || 'about:blank');

      setAnalyzed(events);
      setFallbackSourceUrl(fallback);
      setSelected(new Set(events.map((_, i) => i)));
      setEdits(new Map());
      setDuplicateMap({});
      setStage('preview');
      // Fire-and-forget — preview renders immediately, decoration arrives after.
      void fetchDuplicateHints(events);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
      setStage('input');
    }
  }, [tab, url, urlHint, text, textSourceUrl, textHint]);

  const saveSelected = useCallback(async () => {
    if (selected.size === 0) return;
    setStage('saving');
    setErrorMsg(null);

    const events = analyzed
      .map((ev, i) => (selected.has(i) ? applyEdits(ev, edits.get(i)) : null))
      .filter((ev): ev is ScraperEvent => ev !== null);

    try {
      const res = await fetch('/api/superadmin/import/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, fallbackSourceUrl }),
      });
      const data = (await res.json()) as { results: SaveResultEntry[]; savedCount: number } | { error: string };

      if (!res.ok || 'error' in data) {
        setErrorMsg('error' in data ? data.error : `Save failed (${res.status})`);
        setStage('preview');
        return;
      }

      setSaveResults(data.results);
      setStage('done');
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
      setStage('preview');
    }
  }, [selected, analyzed, edits, fallbackSourceUrl, router]);

  const toggleSelected = useCallback((i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  const patchEdit = useCallback((i: number, patch: Partial<EventEdits>) => {
    setEdits(prev => {
      const next = new Map(prev);
      const current = next.get(i) ?? {};
      next.set(i, { ...current, ...patch });
      return next;
    });
  }, []);

  const resetEdit = useCallback((i: number) => {
    setEdits(prev => {
      const next = new Map(prev);
      next.delete(i);
      return next;
    });
  }, []);

  // Count how many cards have any edits for the top banner.
  const editedCount = useMemo(
    () => Array.from(edits.values()).filter(e => Object.keys(e).length > 0).length,
    [edits]
  );

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Tabs */}
      {stage === 'input' && (
        <div className="flex gap-2 border-b border-mist">
          <TabButton active={tab === 'url'} onClick={() => setTab('url')}>
            <LinkIcon className="w-4 h-4" /> From URL
          </TabButton>
          <TabButton active={tab === 'text'} onClick={() => setTab('text')}>
            <FileText className="w-4 h-4" /> From text
          </TabButton>
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Something went wrong</div>
            <div className="mt-1">{errorMsg}</div>
          </div>
        </div>
      )}

      {/* INPUT STAGE — URL */}
      {stage === 'input' && tab === 'url' && (
        <div className="space-y-4 bg-pure border border-mist rounded-lg p-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Event URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.eventbrite.com/e/..."
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-1 focus:ring-blue outline-none"
            />
            <p className="mt-1 text-xs text-zinc">
              The scraper will fetch this page server-side and extract the event.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Hint <span className="text-zinc font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={urlHint}
              onChange={e => setUrlHint(e.target.value)}
              placeholder="e.g. 'this is a free weekly book club'"
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-1 focus:ring-blue outline-none"
            />
            <p className="mt-1 text-xs text-zinc">
              Extra context to guide extraction. Not usually needed.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={analyze} disabled={!url.trim()}>
              Analyze URL
            </Button>
          </div>
        </div>
      )}

      {/* INPUT STAGE — TEXT */}
      {stage === 'input' && tab === 'text' && (
        <div className="space-y-4 bg-pure border border-mist rounded-lg p-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Pasted text</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={10}
              placeholder="Paste a flyer, email, lineup, or season page. For multi-date series, include every date."
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-1 focus:ring-blue outline-none resize-y font-mono text-sm"
            />
            <p className="mt-1 text-xs text-zinc">
              If the text contains 2+ distinct dates, the scraper will return one event per date.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Source URL <span className="text-zinc font-normal">(optional, recommended)</span>
            </label>
            <input
              type="url"
              value={textSourceUrl}
              onChange={e => setTextSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-1 focus:ring-blue outline-none"
            />
            <p className="mt-1 text-xs text-zinc">
              Helps the scraper pick venue, category, and organizer from page metadata.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Hint <span className="text-zinc font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={textHint}
              onChange={e => setTextHint(e.target.value)}
              placeholder="e.g. 'all free and open to the public'"
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-1 focus:ring-blue outline-none"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={analyze} disabled={text.trim().length < 10}>
              Analyze text
            </Button>
          </div>
        </div>
      )}

      {/* ANALYZING / SAVING */}
      {(stage === 'analyzing' || stage === 'saving') && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc">
          <Loader2 className="w-8 h-8 animate-spin text-blue" />
          <div className="text-sm">
            {stage === 'analyzing' ? 'Scraper is analyzing… (this can take 20–60s)' : 'Saving to pending review…'}
          </div>
        </div>
      )}

      {/* PREVIEW */}
      {stage === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                {analyzed.length === 1
                  ? '1 event extracted'
                  : `${analyzed.length} events extracted`}
              </h2>
              <p className="text-sm text-zinc">
                Fix anything the scraper got wrong inline. Changes apply only on save.
                {editedCount > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 text-xs rounded">
                    {editedCount} edited
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={resetToInput}
              className="text-sm text-zinc hover:text-ink underline"
            >
              Start over
            </button>
          </div>

          <div className="space-y-3">
            {analyzed.map((event, i) => (
              <EventPreviewEditable
                key={i}
                event={event}
                edit={edits.get(i)}
                categories={categories}
                selected={selected.has(i)}
                duplicates={duplicateMap[i] ?? []}
                onToggle={() => toggleSelected(i)}
                onPatch={(patch) => patchEdit(i, patch)}
                onReset={() => resetEdit(i)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-mist">
            <div className="text-sm text-zinc">
              {selected.size} of {analyzed.length} selected
            </div>
            <Button onClick={saveSelected} disabled={selected.size === 0}>
              Save {selected.size} to pending review
            </Button>
          </div>
        </div>
      )}

      {/* DONE */}
      {stage === 'done' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-emerald/10 border border-emerald/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-ink">
                Saved {saveResults.filter(r => r.ok).length} of {saveResults.length} events
              </div>
              <p className="text-sm text-zinc mt-1">
                Review each in{' '}
                <Link
                  href="/admin/events/pending"
                  className="text-blue hover:text-blue-dark underline"
                >
                  pending review
                </Link>{' '}
                before they go live.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {saveResults.map((r, i) => (
              <SaveResultRow key={i} result={r} title={analyzed[r.index]?.title ?? `Event ${r.index + 1}`} />
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={resetToInput}>
              Import another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors',
        active
          ? 'border-blue text-blue'
          : 'border-transparent text-zinc hover:text-ink'
      )}
    >
      {children}
    </button>
  );
}

/**
 * Card that lets the operator edit scraper output inline. Five fields:
 * title, date, category, price, ticket URL, venue name. Edits never mutate
 * the original scraper event — they're captured in the parent's edit map
 * and applied only at save time.
 */
function EventPreviewEditable({
  event,
  edit,
  categories,
  selected,
  duplicates,
  onToggle,
  onPatch,
  onReset,
}: {
  event: ScraperEvent;
  edit: EventEdits | undefined;
  categories: CategoryOption[];
  selected: boolean;
  duplicates: DuplicateCandidate[];
  onToggle: () => void;
  onPatch: (patch: Partial<EventEdits>) => void;
  onReset: () => void;
}) {
  const effective = applyEdits(event, edit);
  const isEdited = !!edit && Object.keys(edit).length > 0;
  const dateLocal = toDatetimeLocal(effective.start_datetime);

  const changedFields = edit
    ? (Object.keys(edit) as (keyof EventEdits)[]).filter(k => edit[k] !== undefined && edit[k] !== '')
    : [];

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        selected ? 'bg-blue/5 border-blue' : 'bg-pure border-mist'
      )}
    >
      <div className="flex gap-3 p-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label="Include this event"
          className="mt-2 w-4 h-4 accent-blue flex-shrink-0"
        />

        <div className="flex-1 min-w-0 space-y-3">
          {/* Fuzzy duplicate warning — shows when the pg_trgm RPC finds
              existing events with similar title + same calendar day. Lets the
              operator deselect this card (skip the import) or click into the
              existing event to verify. Doesn't block saving — purely advisory. */}
          {duplicates.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-amber-900">
                  {duplicates.length === 1
                    ? 'Might be a duplicate'
                    : `Might be a duplicate (${duplicates.length} possible matches)`}
                </div>
                <div className="mt-1 space-y-1">
                  {duplicates.slice(0, 3).map((dup) => (
                    <Link
                      key={dup.id}
                      href={`/admin/events/${dup.id}`}
                      target="_blank"
                      className="flex items-center justify-between gap-2 text-xs text-amber-900 hover:text-amber-700 hover:underline"
                    >
                      <span className="truncate">
                        {dup.title}
                        {dup.venue_name ? ` · ${dup.venue_name}` : ''}
                        {' · '}
                        {new Date(dup.start_datetime).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                          timeZone: 'America/Chicago',
                        })}
                      </span>
                      <span className="flex-shrink-0 font-mono">
                        {Math.round(dup.overall_score * 100)}% match
                      </span>
                    </Link>
                  ))}
                </div>
                <p className="mt-2 text-xs text-amber-800/80">
                  Uncheck this card if it's the same event, or keep it selected to save anyway.
                </p>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc mb-1">Title</label>
            <input
              type="text"
              value={effective.title ?? ''}
              onChange={(e) => onPatch({ title: e.target.value })}
              className="w-full px-3 py-1.5 border border-mist rounded-md text-base font-semibold text-ink focus:border-blue focus:ring-1 focus:ring-blue outline-none bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Start datetime */}
            <div>
              <label className="block text-xs font-medium text-zinc mb-1">Start date & time</label>
              <input
                type="datetime-local"
                value={dateLocal}
                onChange={(e) => {
                  const iso = fromDatetimeLocal(e.target.value, event.timezone || 'America/Chicago');
                  onPatch({ start_datetime: iso });
                }}
                className="w-full px-3 py-1.5 border border-mist rounded-md text-sm focus:border-blue focus:ring-1 focus:ring-blue outline-none bg-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-zinc mb-1">Category</label>
              <select
                value={effective.category_slug ?? ''}
                onChange={(e) => onPatch({ category_slug: e.target.value || null })}
                className="w-full px-3 py-1.5 border border-mist rounded-md text-sm focus:border-blue focus:ring-1 focus:ring-blue outline-none bg-white"
              >
                <option value="">— No category —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Venue name */}
            <div>
              <label className="block text-xs font-medium text-zinc mb-1">Venue</label>
              <input
                type="text"
                value={effective.venue?.name ?? ''}
                onChange={(e) => onPatch({ venue_name: e.target.value })}
                placeholder="Venue name"
                className="w-full px-3 py-1.5 border border-mist rounded-md text-sm focus:border-blue focus:ring-1 focus:ring-blue outline-none bg-white"
              />
            </div>

            {/* Ticket URL */}
            <div>
              <label className="block text-xs font-medium text-zinc mb-1">Ticket URL</label>
              <input
                type="url"
                value={effective.ticket_url ?? ''}
                onChange={(e) => onPatch({ ticket_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-1.5 border border-mist rounded-md text-sm focus:border-blue focus:ring-1 focus:ring-blue outline-none bg-white"
              />
            </div>
          </div>

          {/* Price row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc mb-1">Price type</label>
              <select
                value={effective.price_type ?? 'free'}
                onChange={(e) => onPatch({ price_type: e.target.value })}
                className="w-full px-3 py-1.5 border border-mist rounded-md text-sm focus:border-blue focus:ring-1 focus:ring-blue outline-none bg-white"
              >
                {PRICE_TYPE_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc mb-1">Low ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={effective.price_low ?? ''}
                onChange={(e) => onPatch({
                  price_low: e.target.value === '' ? null : parseFloat(e.target.value),
                })}
                disabled={effective.price_type === 'free'}
                className="w-full px-3 py-1.5 border border-mist rounded-md text-sm focus:border-blue focus:ring-1 focus:ring-blue outline-none bg-white disabled:bg-cloud disabled:text-silver"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc mb-1">High ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={effective.price_high ?? ''}
                onChange={(e) => onPatch({
                  price_high: e.target.value === '' ? null : parseFloat(e.target.value),
                })}
                disabled={effective.price_type === 'free' || effective.price_type === 'fixed'}
                className="w-full px-3 py-1.5 border border-mist rounded-md text-sm focus:border-blue focus:ring-1 focus:ring-blue outline-none bg-white disabled:bg-cloud disabled:text-silver"
              />
            </div>
          </div>

          {/* Meta row: short description preview + reset button + source link */}
          <div className="flex items-start justify-between gap-3 pt-1 text-xs text-zinc">
            <div className="flex-1 min-w-0">
              {event.short_description && (
                <p className="line-clamp-2">{event.short_description}</p>
              )}
              {event.organizer_name && (
                <div className="mt-1">by {event.organizer_name}</div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {event.source_url && (
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue hover:text-blue-dark"
                >
                  <ExternalLink className="w-3 h-3" /> source
                </a>
              )}
              {isEdited && (
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-medium"
                  aria-label="Reset to scraper values"
                >
                  <RotateCcw className="w-3 h-3" /> reset
                </button>
              )}
            </div>
          </div>

          {/* "Changed fields" summary pill — reassures the operator that
              their edits are captured without forcing them to remember. */}
          {isEdited && (
            <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-flex flex-wrap gap-1 items-center">
              <span className="font-medium">Edited:</span>
              {changedFields.map(f => (
                <code key={f} className="bg-amber-100 px-1 rounded">{f}</code>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveResultRow({ result, title }: { result: SaveResultEntry; title: string }) {
  if (result.ok) {
    return (
      <div className="flex items-center justify-between p-3 bg-pure border border-mist rounded text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald" />
          <span className="text-ink">{title}</span>
        </div>
        <Link
          href={`/admin/events/${result.eventId}`}
          className="text-blue hover:text-blue-dark text-xs underline"
        >
          Review →
        </Link>
      </div>
    );
  }
  if (result.code === 'duplicate') {
    return (
      <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          <span className="text-ink">
            <strong>Duplicate</strong>: {title} — already in {result.existingStatus}
          </span>
        </div>
        {result.existingEventId && (
          <Link
            href={`/admin/events/${result.existingEventId}`}
            className="text-blue hover:text-blue-dark text-xs underline"
          >
            See existing →
          </Link>
        )}
      </div>
    );
  }
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="w-4 h-4" />
        {title}
      </div>
      <div className="mt-1 text-xs">
        {result.code === 'validation'
          ? (result.errors || []).join('; ')
          : result.error || 'Save failed'}
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Merge an edit patch over a scraper event. Fields set to undefined in the
 * edit are treated as "not touched" — they pass through from the original.
 * Venue-name edit rebuilds the venue object so the save resolver treats it
 * as a new-or-fuzzy-match candidate.
 */
function applyEdits(event: ScraperEvent, edit: EventEdits | undefined): ScraperEvent {
  if (!edit) return event;
  const merged: ScraperEvent = { ...event };
  if (edit.title !== undefined) merged.title = edit.title;
  if (edit.start_datetime !== undefined) merged.start_datetime = edit.start_datetime;
  if (edit.category_slug !== undefined) merged.category_slug = edit.category_slug;
  if (edit.price_type !== undefined) merged.price_type = edit.price_type;
  if (edit.price_low !== undefined) merged.price_low = edit.price_low;
  if (edit.price_high !== undefined) merged.price_high = edit.price_high;
  if (edit.ticket_url !== undefined) merged.ticket_url = edit.ticket_url;
  if (edit.venue_name !== undefined) {
    merged.venue = {
      ...(event.venue ?? { name: '' }),
      name: edit.venue_name,
    };
  }
  return merged;
}

/**
 * ISO 8601 → "YYYY-MM-DDTHH:MM" for a <input type="datetime-local">.
 * Treats the ISO as already-in-Chicago time; we pass through raw components
 * so the input shows 7pm for an event at 19:00 CT regardless of the admin
 * user's browser timezone. This matches how other admin forms in this app
 * handle datetime input/output.
 */
function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return '';
  // If the ISO has an offset, strip it — datetime-local wants naive wall-clock.
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? `${match[1]}T${match[2]}` : '';
}

/**
 * "YYYY-MM-DDTHH:MM" back to an ISO string WITH the Chicago offset. We need
 * to preserve timezone so the DB stores the correct absolute moment. Uses
 * Intl to compute the offset at that specific date (handles DST).
 */
function fromDatetimeLocal(localValue: string, timezone: string): string {
  if (!localValue) return '';
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localValue)) return localValue;
  const offsetMinutes = getTimezoneOffsetMinutes(localValue, timezone);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${localValue}:00${sign}${hh}:${mm}`;
}

/**
 * Offset (minutes) of `timezone` at the moment `localValue` describes, in
 * that timezone. E.g. returns -300 for CDT, -360 for CST.
 */
function getTimezoneOffsetMinutes(localValue: string, timezone: string): number {
  // Treat localValue as already-in-timezone → compute what that UTC moment is.
  const [datePart, timePart] = localValue.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  const asUtcMs = Date.UTC(y, m - 1, d, hh, mm, 0);

  // What the wall-clock in `timezone` was at that UTC moment.
  const utcDate = new Date(asUtcMs);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(utcDate);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? '0');
  const tzMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), 0);

  // Difference = the timezone's offset from UTC at that moment (inverted).
  return -(asUtcMs - tzMs) / 60000;
}
