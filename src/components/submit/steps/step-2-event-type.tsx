/**
 * STEP 2: EVENT TYPE
 * ===================
 * Second step of the event submission form.
 *
 * Determines:
 *   - Single event vs series
 *   - New series vs existing series
 *   - Recurring pattern (if applicable)
 *
 * @module components/submit/steps/step-2-event-type
 */

'use client';

import { useState } from 'react';
import { Search, Plus, Layers, Calendar, RefreshCw, Link2 } from 'lucide-react';
import { StepHeader } from '../step-progress';
import { Input } from '@/components/ui';
import type { EventDraftData, EventMode, SeriesDraftData } from '@/types/submission';
import { EVENT_MODE_LABELS } from '@/types/submission';
import { SERIES_TYPE_OPTIONS } from '@/lib/constants/series-limits';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Step2Props {
  draftData: EventDraftData;
  updateData: (updates: Partial<EventDraftData>) => void;
  seriesDraftData: SeriesDraftData | null;
  updateSeriesData: (data: SeriesDraftData | null) => void;
  searchSeries: (query: string) => Promise<SeriesSearchResult[]>;
}

interface SeriesSearchResult {
  id: string;
  title: string;
  series_type: string;
  organizer_name: string | null;
  upcoming_count: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Step2EventType({
  draftData,
  updateData,
  seriesDraftData,
  updateSeriesData,
  searchSeries,
}: Step2Props) {
  const [seriesQuery, setSeriesQuery] = useState('');
  const [seriesResults, setSeriesResults] = useState<SeriesSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ========== Series Search ==========
  const handleSeriesSearch = async (query: string) => {
    setSeriesQuery(query);
    if (query.length < 2) {
      setSeriesResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchSeries(query);
      setSeriesResults(results);
    } catch (error) {
      console.error('Series search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // ========== Mode Selection ==========
  const modeOptions: { mode: EventMode; icon: React.ReactNode }[] = [
    { mode: 'single', icon: <Calendar className="w-5 h-5" /> },
    { mode: 'existing_series', icon: <Link2 className="w-5 h-5" /> },
    { mode: 'new_series', icon: <Plus className="w-5 h-5" /> },
    { mode: 'recurring', icon: <RefreshCw className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      <StepHeader
        step={2}
        title="Event Type"
        description="Is this a one-time event or part of something bigger?"
      />

      {/* ========== Mode Selection ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modeOptions.map(({ mode, icon }) => {
          const config = EVENT_MODE_LABELS[mode];
          const isSelected = draftData.event_mode === mode;

          return (
            <button
              key={mode}
              type="button"
              onClick={() => {
                updateData({ event_mode: mode });
                if (mode !== 'existing_series') {
                  updateData({ series_id: undefined });
                }
                if (mode !== 'new_series') {
                  updateSeriesData(null);
                }
              }}
              className={cn(
                'flex items-start p-4 rounded-lg border text-left transition-all',
                'hover:border-coral hover:bg-coral/5',
                isSelected
                  ? 'border-coral bg-coral/10'
                  : 'border-sand bg-warm-white'
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 p-2 rounded-lg mr-3',
                  isSelected ? 'bg-coral text-white' : 'bg-sand text-stone'
                )}
              >
                {icon}
              </div>
              <div>
                <p className={cn(
                  'font-medium',
                  isSelected ? 'text-coral' : 'text-charcoal'
                )}>
                  {config.title}
                </p>
                <p className="text-sm text-stone mt-0.5">
                  {config.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ========== Existing Series Search ========== */}
      {draftData.event_mode === 'existing_series' && (
        <div className="mt-6 p-4 bg-cream rounded-lg border border-sand">
          <label className="block text-sm font-medium text-charcoal mb-2">
            Search for a Series
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <Input
              type="text"
              value={seriesQuery}
              onChange={(e) => handleSeriesSearch(e.target.value)}
              placeholder="Type to search series..."
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {seriesResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {seriesResults.map((series) => (
                <button
                  key={series.id}
                  type="button"
                  onClick={() => {
                    updateData({ series_id: series.id });
                    setSeriesQuery(series.title);
                    setSeriesResults([]);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg border text-left',
                    'hover:border-coral hover:bg-coral/5',
                    draftData.series_id === series.id
                      ? 'border-coral bg-coral/10'
                      : 'border-sand bg-warm-white'
                  )}
                >
                  <div>
                    <p className="font-medium text-charcoal">{series.title}</p>
                    <p className="text-sm text-stone">
                      {series.series_type} • {series.organizer_name || 'Unknown organizer'}
                    </p>
                  </div>
                  {series.upcoming_count > 0 && (
                    <span className="text-xs bg-sage/20 text-sage px-2 py-1 rounded">
                      {series.upcoming_count} upcoming
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <p className="mt-3 text-sm text-stone">Searching...</p>
          )}

          {seriesQuery.length >= 2 && !isSearching && seriesResults.length === 0 && (
            <p className="mt-3 text-sm text-stone">
              No series found. Try a different search or create a new series.
            </p>
          )}
        </div>
      )}

      {/* ========== New Series Form ========== */}
      {draftData.event_mode === 'new_series' && (
        <div className="mt-6 p-4 bg-cream rounded-lg border border-sand space-y-4">
          <h3 className="font-medium text-charcoal flex items-center">
            <Layers className="w-4 h-4 mr-2" />
            New Series Details
          </h3>

          {/* Series Title */}
          <div>
            <label
              htmlFor="series_title"
              className="block text-sm font-medium text-charcoal mb-1"
            >
              Series Title <span className="text-coral">*</span>
            </label>
            <Input
              id="series_title"
              type="text"
              value={seriesDraftData?.title || ''}
              onChange={(e) =>
                updateSeriesData({
                  ...seriesDraftData,
                  title: e.target.value,
                  series_type: seriesDraftData?.series_type || 'class',
                })
              }
              placeholder="e.g., Pottery 101 - Spring 2025"
            />
          </div>

          {/* Series Type */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Series Type <span className="text-coral">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SERIES_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    updateSeriesData({
                      ...seriesDraftData,
                      title: seriesDraftData?.title || '',
                      series_type: option.value,
                    })
                  }
                  className={cn(
                    'px-3 py-2 rounded-lg border text-left transition-all',
                    'hover:border-coral hover:bg-coral/5',
                    seriesDraftData?.series_type === option.value
                      ? 'border-coral bg-coral/10'
                      : 'border-sand bg-warm-white'
                  )}
                >
                  <span className="mr-2">{option.emoji}</span>
                  <span className="font-medium text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Total Sessions */}
          <div>
            <label
              htmlFor="total_sessions"
              className="block text-sm font-medium text-charcoal mb-1"
            >
              Total Sessions (optional)
            </label>
            <Input
              id="total_sessions"
              type="number"
              min={2}
              max={52}
              value={seriesDraftData?.total_sessions || ''}
              onChange={(e) =>
                updateSeriesData({
                  ...seriesDraftData,
                  title: seriesDraftData?.title || '',
                  series_type: seriesDraftData?.series_type || 'class',
                  total_sessions: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="e.g., 6"
              className="w-32"
            />
            <p className="text-xs text-stone mt-1">
              Leave blank if the number of sessions is not fixed
            </p>
          </div>
        </div>
      )}

      {/* ========== Recurring Info ========== */}
      {draftData.event_mode === 'recurring' && (
        <div className="mt-6 p-4 bg-cream rounded-lg border border-sand">
          <h3 className="font-medium text-charcoal flex items-center mb-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recurring Pattern
          </h3>
          <p className="text-sm text-stone">
            You&apos;ll set up the recurrence pattern in the next step (Date & Time).
            Recurring events repeat on a schedule (e.g., every Tuesday at 7pm).
          </p>
        </div>
      )}
    </div>
  );
}
