'use client';

/**
 * SERIES SEARCH
 * =============
 * Inline search component for finding and selecting an existing series
 * to attach an event to. Uses the existing /api/submit/series/search endpoint.
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { SERIES_TYPE_INFO } from '@/types/series';

interface SeriesResult {
  id: string;
  title: string;
  series_type: string;
  total_sessions: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

interface SeriesSearchProps {
  /** Called when the user selects a series */
  onSelect: (seriesId: string, seriesTitle: string) => void;
  /** Called when the user cancels */
  onCancel: () => void;
  /** Whether the attach action is in progress */
  isSubmitting?: boolean;
}

export function SeriesSearch({
  onSelect,
  onCancel,
  isSubmitting = false,
}: SeriesSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SeriesResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/submit/series/search?q=${encodeURIComponent(q)}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.series || []);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const selectedSeries = results.find(s => s.id === selectedId);

  const getTypeBadge = (seriesType: string) => {
    const info = SERIES_TYPE_INFO[seriesType as keyof typeof SERIES_TYPE_INFO];
    if (!info) return null;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>
        {info.label}
      </span>
    );
  };

  return (
    <div className="space-y-4 p-4 bg-cream rounded-lg border border-sand">
      <h3 className="font-medium text-charcoal flex items-center">
        <Search className="w-4 h-4 mr-2" />
        Find Existing Series
      </h3>

      {/* Search input */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search series by name..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId(null);
          }}
          className="pr-8"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setSelectedId(null);
              setHasSearched(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone hover:text-charcoal"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading */}
      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-stone py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Searching...
        </div>
      )}

      {/* Results */}
      {!isSearching && results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map((series) => (
            <button
              key={series.id}
              type="button"
              onClick={() => setSelectedId(series.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                selectedId === series.id
                  ? 'border-coral bg-coral/5'
                  : 'border-sand bg-warm-white hover:border-coral/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-charcoal text-sm">
                  {series.title}
                </span>
                {getTypeBadge(series.series_type)}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-stone">
                {series.total_sessions && (
                  <span>{series.total_sessions} sessions</span>
                )}
                {series.start_date && (
                  <span>
                    Starts {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' }).format(new Date(series.start_date + 'T12:00:00'))}
                  </span>
                )}
                <span className="capitalize">{series.status.replace('_', ' ')}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {!isSearching && hasSearched && results.length === 0 && query.length >= 2 && (
        <p className="text-sm text-stone py-2">
          No series found matching &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-sand">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (selectedId && selectedSeries) {
              onSelect(selectedId, selectedSeries.title);
            }
          }}
          disabled={!selectedId || isSubmitting}
          className="bg-coral hover:bg-coral/90 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Attaching...
            </>
          ) : selectedSeries ? (
            `Attach to "${selectedSeries.title}"`
          ) : (
            'Select a series'
          )}
        </Button>
      </div>
    </div>
  );
}
