'use client';

/**
 * BULK SERIES MODAL
 * ==================
 * Two-tab modal for grouping selected events into a series.
 *
 * Tab 1: Auto-Detect Pattern — AI analyzes dates to find recurrence
 * Tab 2: Create & Attach — manually create/search a series and attach events
 */

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  X,
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Search,
  Repeat,
  Plus,
  Lightbulb,
  PlusCircle,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminEventCard } from '@/data/admin';

interface BulkSeriesModalProps {
  events: AdminEventCard[];
  onClose: () => void;
  /** Called after events are successfully attached to a series */
  onSeriesComplete?: () => void;
}

type Tab = 'detect' | 'manual';
type Phase = 'idle' | 'loading' | 'result' | 'creating' | 'done' | 'error';

const SERIES_TYPE_OPTIONS = [
  { value: 'recurring', label: 'Recurring Event' },
  { value: 'class', label: 'Class' },
  { value: 'camp', label: 'Camp' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'festival', label: 'Festival' },
  { value: 'season', label: 'Season' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface SuggestedEvent {
  id: string;
  title: string;
  start_datetime: string | null;
  instance_date: string | null;
  location_name: string | null;
  organizer_name: string | null;
  status: string;
  series_id: string | null;
  match_reasons: string[];
  score: number;
}

interface DetectedPattern {
  recurrence_rule: {
    frequency: string;
    interval?: number;
    days_of_week?: number[];
    time?: string;
    duration_minutes?: number;
    end_type?: string;
  };
  suggested_series_title: string;
  suggested_series_type: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export function BulkSeriesModal({ events, onClose, onSeriesComplete }: BulkSeriesModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('detect');
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  // Auto-detect state
  const [pattern, setPattern] = useState<DetectedPattern | null>(null);

  // Manual create state
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesType, setSeriesType] = useState('recurring');
  const [seriesSearch, setSeriesSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; series_type: string }[]>([]);
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [createMode, setCreateMode] = useState<'new' | 'existing'>('new');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<SuggestedEvent[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [addedSuggestionIds, setAddedSuggestionIds] = useState<Set<string>>(new Set());

  const formatDate = (dt: string | null) => {
    if (!dt) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
        timeZone: 'America/Chicago',
      }).format(new Date(dt));
    } catch {
      return dt;
    }
  };

  const formatPattern = (p: DetectedPattern) => {
    const rule = p.recurrence_rule;
    const freq = rule.frequency;
    const days = rule.days_of_week?.map(d => DAY_NAMES[d]).join(', ') || '';
    const time = rule.time || '';
    const interval = rule.interval && rule.interval > 1 ? `every ${rule.interval} ` : '';

    if (freq === 'weekly' && days) {
      return `${interval}${freq} on ${days}${time ? ` at ${time}` : ''}`;
    }
    return `${interval}${freq}${time ? ` at ${time}` : ''}`;
  };

  // ===== SUGGESTIONS: find similar events in DB =====
  const loadSuggestions = useCallback(async () => {
    if (suggestionsLoaded) return;
    setSuggestionsLoading(true);
    try {
      const res = await fetch('/api/superadmin/events/suggest-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: events.map(e => e.id) }),
      });
      const data = await res.json();
      if (res.ok && data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch {
      // Non-critical — just don't show suggestions
    } finally {
      setSuggestionsLoading(false);
      setSuggestionsLoaded(true);
    }
  }, [events, suggestionsLoaded]);

  const toggleSuggestion = useCallback((id: string) => {
    setAddedSuggestionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // All event IDs to include = selected + added suggestions
  const allEventIds = [
    ...events.map(e => e.id),
    ...Array.from(addedSuggestionIds),
  ];

  // Track how many selected events are already in a series, grouped by series
  const eventsInSeries = events.filter(e => e.series_id);
  const allInSeries = eventsInSeries.length === events.length;
  const seriesGroups = useMemo(() => {
    const groups = new Map<string, { id: string; title: string; count: number }>();
    for (const e of eventsInSeries) {
      if (!e.series_id) continue;
      const existing = groups.get(e.series_id);
      if (existing) {
        existing.count++;
      } else {
        groups.set(e.series_id, { id: e.series_id, title: e.series_title || 'Untitled Series', count: 1 });
      }
    }
    return Array.from(groups.values());
  }, [eventsInSeries]);

  const selectAllSuggestions = useCallback(() => {
    setAddedSuggestionIds(new Set(suggestions.map(s => s.id)));
  }, [suggestions]);

  const selectNoneSuggestions = useCallback(() => {
    setAddedSuggestionIds(new Set());
  }, []);

  // ===== AUTO DETECT =====
  const runDetection = useCallback(async () => {
    setPhase('loading');
    setErrorMessage('');
    try {
      const res = await fetch('/api/superadmin/events/bulk-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'auto_detect',
          eventIds: allEventIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Detection failed');

      if (data.pattern) {
        setPattern(data.pattern);
        setSeriesTitle(data.pattern.suggested_series_title || events[0]?.title || '');
        setSeriesType(data.pattern.suggested_series_type || 'recurring');
        setPhase('result');
      } else {
        setErrorMessage('No recurrence pattern detected. Try the "Create & Attach" tab instead.');
        setPhase('error');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Detection failed');
      setPhase('error');
    }
  }, [allEventIds, events]);

  const createFromPattern = useCallback(async () => {
    if (!pattern) return;
    setPhase('creating');
    try {
      const res = await fetch('/api/superadmin/events/bulk-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'create_and_attach',
          eventIds: allEventIds,
          seriesData: {
            title: seriesTitle || pattern.suggested_series_title,
            series_type: seriesType || pattern.suggested_series_type,
            recurrence_rule: pattern.recurrence_rule,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create series');

      setResultMessage(data.message);
      setPhase('done');
      setTimeout(() => {
        if (onSeriesComplete) {
          onSeriesComplete();
        } else {
          onClose();
          router.refresh();
        }
      }, 1500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed');
      setPhase('error');
    }
  }, [allEventIds, pattern, seriesTitle, seriesType, onClose, onSeriesComplete, router]);

  // ===== MANUAL CREATE / ATTACH =====
  const searchSeries = useCallback(async () => {
    if (!seriesSearch.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/submit/series/search?q=${encodeURIComponent(seriesSearch)}`);
      const data = await res.json();
      setSearchResults(data.series || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [seriesSearch]);

  const manualCreateAndAttach = useCallback(async () => {
    setPhase('creating');
    setErrorMessage('');
    try {
      const payload: Record<string, unknown> = {
        mode: 'create_and_attach',
        eventIds: allEventIds,
      };

      if (createMode === 'existing' && selectedExistingId) {
        payload.existingSeriesId = selectedExistingId;
      } else {
        if (!seriesTitle.trim()) {
          setErrorMessage('Series title is required');
          setPhase('idle');
          return;
        }
        payload.seriesData = {
          title: seriesTitle,
          series_type: seriesType,
        };
      }

      const res = await fetch('/api/superadmin/events/bulk-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      setResultMessage(data.message);
      setPhase('done');
      setTimeout(() => {
        if (onSeriesComplete) {
          onSeriesComplete();
        } else {
          onClose();
          router.refresh();
        }
      }, 1500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed');
      setPhase('error');
    }
  }, [allEventIds, createMode, selectedExistingId, seriesTitle, seriesType, onClose, onSeriesComplete, router]);

  const confidenceColor = {
    high: 'text-sage',
    medium: 'text-amber-600',
    low: 'text-red-600',
  };

  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-warm-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-sand">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-coral" />
            <h2 className="font-display text-xl text-charcoal">
              Make Series from {allEventIds.length} Event{allEventIds.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <button onClick={onClose} className="text-stone hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Done / Creating states */}
        {phase === 'done' && (
          <div className="p-8 flex items-center gap-3 justify-center">
            <CheckCircle className="w-5 h-5 text-sage" />
            <span className="text-charcoal">{resultMessage}</span>
          </div>
        )}

        {phase === 'creating' && (
          <div className="p-8 flex items-center gap-3 justify-center">
            <RefreshCw className="w-5 h-5 text-coral animate-spin" />
            <span className="text-charcoal">Creating series...</span>
          </div>
        )}

        {/* Main content */}
        {phase !== 'done' && phase !== 'creating' && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-sand">
              <button
                onClick={() => { setTab('detect'); setPhase('idle'); setErrorMessage(''); }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === 'detect'
                    ? 'text-coral border-b-2 border-coral'
                    : 'text-stone hover:text-charcoal'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-1.5" />
                Auto-Detect Pattern
              </button>
              <button
                onClick={() => { setTab('manual'); setPhase('idle'); setErrorMessage(''); }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === 'manual'
                    ? 'text-coral border-b-2 border-coral'
                    : 'text-stone hover:text-charcoal'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-1.5" />
                Create & Attach
              </button>
            </div>

            <div className="p-5">
              {/* Warning: events already in a series */}
              {eventsInSeries.length > 0 && (
                <div className={`flex items-start gap-2 p-3 mb-4 rounded-lg text-sm ${
                  allInSeries
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-amber-50/60 text-amber-700'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    {allInSeries ? (
                      <span className="font-medium">All {eventsInSeries.length} selected events are already in a series.</span>
                    ) : (
                      <span>
                        <span className="font-medium">{eventsInSeries.length} of {events.length}</span> selected events are already in a series.
                      </span>
                    )}
                    {/* List the distinct series with links */}
                    <div className="mt-1.5 space-y-1">
                      {seriesGroups.map(sg => (
                        <div key={sg.id} className="flex items-center gap-1.5">
                          <Repeat className="w-3 h-3 shrink-0 opacity-60" />
                          <Link
                            href={`/admin/series/${sg.id}/edit`}
                            target="_blank"
                            className="text-xs font-medium underline underline-offset-2 hover:text-coral transition-colors"
                          >
                            {sg.title}
                          </Link>
                          <span className="text-[10px] opacity-60">({sg.count} event{sg.count !== 1 ? 's' : ''})</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                        </div>
                      ))}
                    </div>
                    {seriesGroups.length === 1 && allInSeries ? (
                      <span className="block text-xs mt-1.5 opacity-80">
                        These are already grouped. You can{' '}
                        <Link
                          href={`/admin/series/${seriesGroups[0].id}/edit`}
                          target="_blank"
                          className="underline font-medium hover:text-coral"
                        >
                          edit the existing series
                        </Link>{' '}
                        or proceed to create a new one (events will be moved).
                      </span>
                    ) : (
                      <span className="block text-xs mt-1.5 opacity-80">
                        Creating a new series will move them out of their current one.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Event preview list */}
              <div className="mb-4 max-h-40 overflow-y-auto space-y-1">
                {[...events]
                  .sort((a, b) => (a.start_datetime || '').localeCompare(b.start_datetime || ''))
                  .map((event) => (
                  <div key={event.id} className="flex items-center gap-2 px-2 py-1.5 text-xs bg-cream rounded">
                    <span className="text-stone w-28 shrink-0">{formatDate(event.start_datetime)}</span>
                    <span className="text-charcoal truncate">{event.title}</span>
                    {event.series_id && (
                      <Link
                        href={`/admin/series/${event.series_id}/edit`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="text-amber-600 text-[10px] px-1.5 py-0.5 bg-amber-50 rounded shrink-0 hover:bg-amber-100 hover:text-amber-700 transition-colors flex items-center gap-1"
                        title={`Edit series: ${event.series_title || 'Series'}`}
                      >
                        <Repeat className="w-2.5 h-2.5" />
                        {event.series_title || 'Series'}
                        <ExternalLink className="w-2 h-2 opacity-50" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* AI suggestions: similar events that might belong here */}
              {!suggestionsLoaded && !suggestionsLoading && (
                <button
                  onClick={loadSuggestions}
                  className="w-full mb-4 p-3 border border-dashed border-sand rounded-lg text-sm text-stone hover:text-charcoal hover:border-coral/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Lightbulb className="w-4 h-4" />
                  Find similar events in the database
                </button>
              )}

              {suggestionsLoading && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-cream rounded-lg text-sm text-stone">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Searching for similar events...
                </div>
              )}

              {suggestionsLoaded && suggestions.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-charcoal">
                      {suggestions.length} similar event{suggestions.length !== 1 ? 's' : ''} found
                    </span>
                    {addedSuggestionIds.size > 0 && (
                      <span className="text-xs text-coral font-medium">
                        +{addedSuggestionIds.size} added
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-1.5">
                      <button
                        onClick={selectAllSuggestions}
                        className="text-[11px] text-stone hover:text-coral transition-colors underline underline-offset-2"
                      >
                        Select all
                      </button>
                      <span className="text-stone text-[10px]">·</span>
                      <button
                        onClick={selectNoneSuggestions}
                        className="text-[11px] text-stone hover:text-coral transition-colors underline underline-offset-2"
                      >
                        Select none
                      </button>
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {suggestions.map((s) => {
                      const isAdded = addedSuggestionIds.has(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSuggestion(s.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors text-left ${
                            isAdded
                              ? 'bg-coral/10 border border-coral/30'
                              : 'bg-cream border border-transparent hover:border-sand'
                          }`}
                        >
                          {isAdded ? (
                            <Check className="w-3.5 h-3.5 text-coral shrink-0" />
                          ) : (
                            <PlusCircle className="w-3.5 h-3.5 text-stone shrink-0" />
                          )}
                          <span className="text-stone w-24 shrink-0">
                            {formatDate(s.start_datetime)}
                          </span>
                          <span className="text-charcoal truncate flex-1">{s.title}</span>
                          <span className="text-[10px] text-stone shrink-0 max-w-[140px] truncate" title={s.match_reasons.join(', ')}>
                            {s.match_reasons.slice(0, 2).join(', ')}
                          </span>
                          {s.series_id && (
                            <span className="text-[10px] px-1 py-0.5 bg-amber-50 text-amber-600 rounded shrink-0">
                              in series
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {suggestionsLoaded && suggestions.length === 0 && (
                <p className="text-xs text-stone mb-4">No similar events found in the database.</p>
              )}

              {/* Error banner */}
              {phase === 'error' && errorMessage && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {/* ===== DETECT TAB ===== */}
              {tab === 'detect' && (
                <>
                  {phase === 'idle' && (
                    <div className="text-center py-4">
                      <p className="text-sm text-stone mb-4">
                        AI will analyze the dates and times to find a recurrence pattern.
                      </p>
                      <Button
                        onClick={runDetection}
                        className="bg-coral hover:bg-coral/90 text-white"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Detect Pattern
                      </Button>
                    </div>
                  )}

                  {phase === 'loading' && (
                    <div className="flex items-center gap-3 py-8 justify-center">
                      <RefreshCw className="w-5 h-5 text-coral animate-spin" />
                      <span className="text-charcoal">Analyzing dates...</span>
                    </div>
                  )}

                  {phase === 'result' && pattern && (
                    <>
                      {/* Pattern result */}
                      <div className="p-4 bg-cream rounded-lg border border-sand mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-coral" />
                          <span className="font-medium text-charcoal">Detected Pattern</span>
                          <span className={`text-xs font-medium ${confidenceColor[pattern.confidence]}`}>
                            {pattern.confidence} confidence
                          </span>
                        </div>
                        <p className="text-sm text-charcoal mb-1 capitalize">
                          {formatPattern(pattern)}
                        </p>
                        <p className="text-xs text-stone">{pattern.reasoning}</p>
                      </div>

                      {/* Editable series fields */}
                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-charcoal mb-1">Series Title</label>
                          <input
                            type="text"
                            value={seriesTitle}
                            onChange={(e) => setSeriesTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-charcoal mb-1">Series Type</label>
                          <select
                            value={seriesType}
                            onChange={(e) => setSeriesType(e.target.value)}
                            className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm bg-white"
                          >
                            {SERIES_TYPE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => { setPhase('idle'); setPattern(null); }}>
                          Re-detect
                        </Button>
                        <Button
                          onClick={createFromPattern}
                          disabled={!seriesTitle.trim()}
                          className="bg-coral hover:bg-coral/90 text-white"
                        >
                          Create Series & Attach
                        </Button>
                      </div>
                    </>
                  )}

                  {phase === 'error' && (
                    <div className="flex justify-end mt-4">
                      <Button variant="secondary" onClick={() => { setPhase('idle'); setErrorMessage(''); }}>
                        Try Again
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* ===== MANUAL TAB ===== */}
              {tab === 'manual' && (
                <>
                  {/* Toggle: new vs existing */}
                  <div className="flex items-center gap-1 bg-sand/50 p-1 rounded-lg mb-4">
                    <button
                      onClick={() => setCreateMode('new')}
                      className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                        createMode === 'new'
                          ? 'bg-warm-white text-charcoal font-medium shadow-sm'
                          : 'text-stone hover:text-charcoal'
                      }`}
                    >
                      New Series
                    </button>
                    <button
                      onClick={() => setCreateMode('existing')}
                      className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                        createMode === 'existing'
                          ? 'bg-warm-white text-charcoal font-medium shadow-sm'
                          : 'text-stone hover:text-charcoal'
                      }`}
                    >
                      Existing Series
                    </button>
                  </div>

                  {createMode === 'new' && (
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Series Title</label>
                        <input
                          type="text"
                          value={seriesTitle}
                          onChange={(e) => setSeriesTitle(e.target.value)}
                          placeholder={events[0]?.title || 'Series name'}
                          className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Series Type</label>
                        <select
                          value={seriesType}
                          onChange={(e) => setSeriesType(e.target.value)}
                          className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm bg-white"
                        >
                          {SERIES_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {createMode === 'existing' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-charcoal mb-1">Search Series</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={seriesSearch}
                            onChange={(e) => setSeriesSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchSeries()}
                            placeholder="Search by name..."
                            className="w-full px-3 py-2 pl-9 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
                          />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                        </div>
                        <Button
                          variant="secondary"
                          onClick={searchSeries}
                          disabled={searchLoading || !seriesSearch.trim()}
                        >
                          {searchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
                        </Button>
                      </div>

                      {searchResults.length > 0 && (
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                          {searchResults.map(s => (
                            <label
                              key={s.id}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedExistingId === s.id
                                  ? 'bg-coral/10 border border-coral'
                                  : 'bg-cream border border-transparent hover:border-sand'
                              }`}
                            >
                              <input
                                type="radio"
                                name="existingSeries"
                                value={s.id}
                                checked={selectedExistingId === s.id}
                                onChange={() => setSelectedExistingId(s.id)}
                                className="text-coral focus:ring-coral"
                              />
                              <span className="text-sm text-charcoal">{s.title}</span>
                              <span className="text-xs text-stone ml-auto">{s.series_type}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {searchResults.length === 0 && seriesSearch && !searchLoading && (
                        <p className="text-xs text-stone mt-2">No series found. Try a different search.</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button
                      onClick={manualCreateAndAttach}
                      disabled={
                        phase === 'creating' ||
                        (createMode === 'new' && !seriesTitle.trim()) ||
                        (createMode === 'existing' && !selectedExistingId)
                      }
                      className="bg-coral hover:bg-coral/90 text-white"
                    >
                      {createMode === 'existing' ? 'Attach to Series' : 'Create Series & Attach'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
