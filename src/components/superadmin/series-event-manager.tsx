'use client';

/**
 * SERIES EVENT MANAGER
 * =====================
 * Panel for the series edit page. Shows events currently in the series,
 * smart-suggests unattached events, and allows add/remove with bulk actions.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  Check,
  X,
  PlusCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Repeat,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ManagedEvent {
  id: string;
  title: string;
  start_datetime: string | null;
  instance_date: string | null;
  status: string;
  location_name: string | null;
  organizer_name: string | null;
}

interface SuggestedEvent extends ManagedEvent {
  series_id: string | null;
  series_title: string | null;
  match_reasons: string[];
  score: number;
}

interface SeriesEventManagerProps {
  seriesId: string;
}

type Phase = 'idle' | 'loading' | 'loaded' | 'error';

export function SeriesEventManager({ seriesId }: SeriesEventManagerProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [currentEvents, setCurrentEvents] = useState<ManagedEvent[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedEvent[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showCurrentEvents, setShowCurrentEvents] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const formatDate = (dt: string | null) => {
    if (!dt) return '';
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

  const loadData = useCallback(async () => {
    setPhase('loading');
    setErrorMessage('');
    try {
      const res = await fetch(`/api/superadmin/series/${seriesId}/manage-events`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');

      setCurrentEvents(data.currentEvents || []);
      setSuggestions(data.suggestions || []);
      setSelectedToAdd(new Set());
      setSelectedToRemove(new Set());
      setPhase('loaded');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load');
      setPhase('error');
    }
  }, [seriesId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleAddSelection = useCallback((id: string) => {
    setSelectedToAdd(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleRemoveSelection = useCallback((id: string) => {
    setSelectedToRemove(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllSuggestions = useCallback(() => {
    setSelectedToAdd(new Set(suggestions.map(s => s.id)));
  }, [suggestions]);

  const selectNoneSuggestions = useCallback(() => {
    setSelectedToAdd(new Set());
  }, []);

  const selectAllCurrent = useCallback(() => {
    setSelectedToRemove(new Set(currentEvents.map(e => e.id)));
  }, [currentEvents]);

  const selectNoneCurrent = useCallback(() => {
    setSelectedToRemove(new Set());
  }, []);

  const handleAction = useCallback(async (action: 'add' | 'remove') => {
    const eventIds = action === 'add'
      ? Array.from(selectedToAdd)
      : Array.from(selectedToRemove);

    if (eventIds.length === 0) return;

    setActionLoading(true);
    setActionMessage('');
    try {
      const res = await fetch(`/api/superadmin/series/${seriesId}/manage-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, eventIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      setActionMessage(data.message);
      // Reload data to reflect changes
      await loadData();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setActionLoading(false);
    }
  }, [seriesId, selectedToAdd, selectedToRemove, loadData]);

  if (phase === 'idle' || phase === 'loading') {
    return (
      <Card padding="lg" className="border border-mist">
        <div className="flex items-center gap-2 text-zinc">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading events...</span>
        </div>
      </Card>
    );
  }

  if (phase === 'error') {
    return (
      <Card padding="lg" className="border border-red-200">
        <div className="flex items-center gap-2 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {errorMessage}
        </div>
        <Button variant="secondary" size="sm" onClick={loadData} className="mt-2">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action feedback */}
      {actionMessage && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald/10 text-emerald border border-sage/20 rounded-lg text-sm">
          <Check className="w-4 h-4 shrink-0" />
          {actionMessage}
          <button onClick={() => setActionMessage('')} className="ml-auto text-emerald/60 hover:text-emerald">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ===== CURRENT EVENTS ===== */}
      <Card padding="lg" className="border border-mist">
        <button
          onClick={() => setShowCurrentEvents(!showCurrentEvents)}
          className="w-full flex items-center justify-between mb-0"
        >
          <h3 className="font-medium text-ink flex items-center gap-2">
            <Repeat className="w-4 h-4 text-blue" />
            Events in Series
            <span className="text-zinc text-sm font-normal">({currentEvents.length})</span>
          </h3>
          {showCurrentEvents ? <ChevronUp className="w-4 h-4 text-zinc" /> : <ChevronDown className="w-4 h-4 text-zinc" />}
        </button>

        {showCurrentEvents && (
          <div className="mt-3">
            {currentEvents.length === 0 ? (
              <p className="text-sm text-zinc py-2">No events in this series yet.</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-zinc">
                    {selectedToRemove.size > 0 && `${selectedToRemove.size} selected`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <button onClick={selectAllCurrent} className="text-[11px] text-zinc hover:text-blue underline underline-offset-2">
                      Select all
                    </button>
                    <span className="text-zinc text-[10px]">·</span>
                    <button onClick={selectNoneCurrent} className="text-[11px] text-zinc hover:text-blue underline underline-offset-2">
                      None
                    </button>
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {currentEvents.map(event => {
                    const isSelected = selectedToRemove.has(event.id);
                    return (
                      <button
                        key={event.id}
                        onClick={() => toggleRemoveSelection(event.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors text-left ${
                          isSelected
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-white border border-transparent hover:border-mist'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="rounded text-red-500 w-3.5 h-3.5 shrink-0"
                        />
                        <span className="text-zinc w-28 shrink-0">{formatDate(event.start_datetime)}</span>
                        <span className="text-ink truncate flex-1">{event.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                          event.status === 'published' ? 'bg-emerald/10 text-emerald' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {event.status}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedToRemove.size > 0 && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-mist">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAction('remove')}
                      disabled={actionLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {actionLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Remove {selectedToRemove.size} event{selectedToRemove.size !== 1 ? 's' : ''} from series
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {/* ===== SMART SUGGESTIONS ===== */}
      <Card padding="lg" className="border border-mist">
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-medium text-ink flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Smart Suggestions
            {suggestions.length > 0 && (
              <span className="text-zinc text-sm font-normal">({suggestions.length} found)</span>
            )}
          </h3>
          {showSuggestions ? <ChevronUp className="w-4 h-4 text-zinc" /> : <ChevronDown className="w-4 h-4 text-zinc" />}
        </button>

        {showSuggestions && (
          <div className="mt-3">
            {suggestions.length === 0 ? (
              <div className="text-sm text-zinc py-2">
                <p>No matching events found.</p>
                <p className="text-xs mt-1 opacity-70">
                  Events are matched by title keywords, organizer, location, and category.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-zinc mb-2">
                  Events scored by title match, organizer, location, category, and day pattern.
                </p>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-zinc">
                    {selectedToAdd.size > 0 && `${selectedToAdd.size} selected`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <button onClick={selectAllSuggestions} className="text-[11px] text-zinc hover:text-blue underline underline-offset-2">
                      Select all
                    </button>
                    <span className="text-zinc text-[10px]">·</span>
                    <button onClick={selectNoneSuggestions} className="text-[11px] text-zinc hover:text-blue underline underline-offset-2">
                      None
                    </button>
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1">
                  {suggestions.map(s => {
                    const isSelected = selectedToAdd.has(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleAddSelection(s.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors text-left ${
                          isSelected
                            ? 'bg-coral/10 border border-coral/30'
                            : 'bg-white border border-transparent hover:border-mist'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="rounded text-blue w-3.5 h-3.5 shrink-0"
                        />
                        <span className="text-zinc w-24 shrink-0">{formatDate(s.start_datetime)}</span>
                        <span className="text-ink truncate flex-1">{s.title}</span>
                        <span
                          className="text-[10px] text-zinc shrink-0 max-w-[160px] truncate"
                          title={s.match_reasons.join(', ')}
                        >
                          {s.match_reasons.slice(0, 2).join(' · ')}
                        </span>
                        {s.score >= 8 && (
                          <span className="text-[9px] px-1 py-0.5 bg-amber-50 text-amber-600 rounded shrink-0 font-medium">
                            strong
                          </span>
                        )}
                        {s.series_id && (
                          <span className="text-[10px] px-1 py-0.5 bg-indigo-50 text-indigo-600 rounded shrink-0">
                            in series
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedToAdd.size > 0 && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-mist">
                    <Button
                      size="sm"
                      onClick={() => handleAction('add')}
                      disabled={actionLoading}
                      className="bg-blue hover:bg-blue/90 text-white"
                    >
                      {actionLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Add {selectedToAdd.size} event{selectedToAdd.size !== 1 ? 's' : ''} to series
                    </Button>
                  </div>
                )}
              </>
            )}

            <div className="mt-3 pt-3 border-t border-mist">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadData}
                disabled={actionLoading}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${actionLoading ? 'animate-spin' : ''}`} />
                Refresh suggestions
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
