'use client';

/**
 * IMPORT FORM
 * ===========
 * Client UI for /admin/import. Two-tab flow:
 *   1. URL tab — paste an event page URL.
 *   2. Text tab — paste raw text (flyer, email, season lineup) + optional source URL.
 *
 * Calls /api/superadmin/import/analyze to extract, then shows a preview.
 * Calls /api/superadmin/import/save to persist selected events as pending_review.
 *
 * Coupling notes:
 * - Response shapes match lib/scraper/types (single vs multi).
 * - Save route expects ScraperEvent[] + fallbackSourceUrl.
 *
 * @module app/admin/import/import-form
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Link as LinkIcon, FileText, Loader2, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  ScraperEvent,
  ScraperAnalyzeResponse,
} from '@/lib/scraper/types';

type Tab = 'url' | 'text';
type Stage = 'input' | 'analyzing' | 'preview' | 'saving' | 'done';

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

export function ImportForm() {
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

  // Save result
  const [saveResults, setSaveResults] = useState<SaveResultEntry[]>([]);

  const resetToInput = useCallback(() => {
    setStage('input');
    setErrorMsg(null);
    setAnalyzed([]);
    setSelected(new Set());
    setSaveResults([]);
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
      setStage('preview');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
      setStage('input');
    }
  }, [tab, url, urlHint, text, textSourceUrl, textHint]);

  const saveSelected = useCallback(async () => {
    if (selected.size === 0) return;
    setStage('saving');
    setErrorMsg(null);

    const events = analyzed.filter((_, i) => selected.has(i));

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
  }, [selected, analyzed, fallbackSourceUrl, router]);

  const toggleSelected = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

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
                Review and pick which to save as pending review.
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
              <EventPreview
                key={i}
                event={event}
                selected={selected.has(i)}
                onToggle={() => toggleSelected(i)}
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

function EventPreview({
  event,
  selected,
  onToggle,
}: {
  event: ScraperEvent;
  selected: boolean;
  onToggle: () => void;
}) {
  const startDate = formatDate(event.start_datetime);
  return (
    <label
      className={cn(
        'flex gap-4 p-4 rounded-lg border cursor-pointer transition-colors',
        selected ? 'bg-blue/5 border-blue' : 'bg-pure border-mist hover:border-silver'
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="mt-1 w-4 h-4 accent-blue flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-ink truncate">{event.title}</h3>
          {event.category_slug && (
            <span className="text-xs text-zinc bg-cloud px-2 py-0.5 rounded">
              {event.category_slug}
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-zinc">
          {startDate}
          {event.venue?.name ? ` · ${event.venue.name}` : ''}
          {event.price_type === 'free' ? ' · Free' : ''}
          {event.price_low != null && event.price_type !== 'free'
            ? ` · $${event.price_low}${event.price_high && event.price_high !== event.price_low ? `–${event.price_high}` : ''}`
            : ''}
        </div>
        {event.short_description && (
          <p className="mt-2 text-sm text-slate line-clamp-2">{event.short_description}</p>
        )}
        {event.organizer_name && (
          <div className="mt-1 text-xs text-zinc">by {event.organizer_name}</div>
        )}
        {event.source_url && (
          <a
            href={event.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs text-blue hover:text-blue-dark"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" /> source
          </a>
        )}
      </div>
    </label>
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

function formatDate(iso: string | undefined): string {
  if (!iso) return '(no date)';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    });
  } catch {
    return iso;
  }
}
