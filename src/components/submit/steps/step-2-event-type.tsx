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
 * Phase D additions:
 *   - Attendance mode (registered / drop-in / hybrid) for new series
 *   - Age range (age_low, age_high, age_details) for new series
 *   - Skill level (conditionally shown via supportsSkillLevel)
 *   - Extended care times (conditionally shown via supportsExtendedCare)
 *   - Term name for semester/session labeling
 *
 * @module components/submit/steps/step-2-event-type
 */

'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Layers,
  Calendar,
  RefreshCw,
  Link2,
  Users,
  Baby,
  GraduationCap,
  Clock,
  Tag,
} from 'lucide-react';
import { StepHeader } from '../step-progress';
import { Input } from '@/components/ui';
import type {
  EventDraftData,
  EventMode,
  SeriesDraftData,
  AttendanceMode,
  SkillLevel,
} from '@/types/submission';
import { EVENT_MODE_LABELS } from '@/types/submission';
import {
  SERIES_TYPE_OPTIONS,
  ATTENDANCE_MODE_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  SERIES_LIMITS,
} from '@/lib/constants/series-limits';
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
  upcoming_event_count: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get the series type config for the current series draft, with safe fallback.
 * Used to conditionally show fields like extended care and skill level.
 */
function getSeriesTypeConfig(seriesType: string | undefined) {
  if (!seriesType) return null;
  return SERIES_LIMITS[seriesType] ?? null;
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

  // Current series type config (controls which optional sections appear)
  const seriesConfig = getSeriesTypeConfig(seriesDraftData?.series_type);

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
      console.error('❌ [Step2] Series search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // ========== Update series draft with merge helper ==========
  const mergeSeriesData = (updates: Partial<SeriesDraftData>) => {
    updateSeriesData({
      ...seriesDraftData,
      title: seriesDraftData?.title || '',
      series_type: seriesDraftData?.series_type || 'class',
      ...updates,
    });
  };

  // ========== Handle series type change (resets type-dependent defaults) ==========
  const handleSeriesTypeChange = (newType: string) => {
    const config = SERIES_LIMITS[newType];
    console.log(`📋 [Step2] Series type changed to "${newType}"`, {
      supportsExtendedCare: config?.supportsExtendedCare,
      supportsSkillLevel: config?.supportsSkillLevel,
      defaultAttendanceMode: config?.defaultAttendanceMode,
      defaultDaysOfWeek: config?.defaultDaysOfWeek,
    });

    updateSeriesData({
      ...seriesDraftData,
      title: seriesDraftData?.title || '',
      series_type: newType,
      // Apply type-specific defaults
      attendance_mode: config?.defaultAttendanceMode || 'registered',
      days_of_week: config?.defaultDaysOfWeek || undefined,
      // Clear fields that don't apply to new type
      ...(!config?.supportsSkillLevel && { skill_level: undefined }),
      ...(!config?.supportsExtendedCare && {
        extended_start_time: undefined,
        extended_end_time: undefined,
        extended_care_details: undefined,
      }),
    });
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
                // Single merged update to avoid potential stale-state from sequential calls
                updateData({
                  event_mode: mode,
                  ...(mode !== 'existing_series' ? { series_id: undefined } : {}),
                });
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
                  {series.upcoming_event_count > 0 && (
                    <span className="text-xs bg-sage/20 text-sage px-2 py-1 rounded">
                      {series.upcoming_event_count} upcoming
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
              onChange={(e) => mergeSeriesData({ title: e.target.value })}
              placeholder="e.g., Pottery 101 - Spring 2026"
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
                  onClick={() => handleSeriesTypeChange(option.value)}
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
                mergeSeriesData({
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

          {/* ====================================================== */}
          {/* PHASE D: Attendance Mode                                */}
          {/* ====================================================== */}
          <div className="pt-4 border-t border-sand">
            <label className="block text-sm font-medium text-charcoal mb-2 flex items-center">
              <Users className="w-4 h-4 mr-1.5" />
              Attendance Mode
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {ATTENDANCE_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    console.log(`📋 [Step2] Attendance mode set: ${option.value}`);
                    mergeSeriesData({ attendance_mode: option.value });
                  }}
                  className={cn(
                    'flex flex-col p-3 rounded-lg border text-left transition-all',
                    'hover:border-coral hover:bg-coral/5',
                    seriesDraftData?.attendance_mode === option.value
                      ? 'border-coral bg-coral/10'
                      : 'border-sand bg-warm-white'
                  )}
                >
                  <span className="text-sm font-medium">
                    <span className="mr-1">{option.emoji}</span>
                    {option.label}
                  </span>
                  <span className="text-xs text-stone mt-1">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ====================================================== */}
          {/* PHASE D: Age Range                                      */}
          {/* ====================================================== */}
          <div className="pt-4 border-t border-sand">
            <label className="block text-sm font-medium text-charcoal mb-2 flex items-center">
              <Baby className="w-4 h-4 mr-1.5" />
              Age Range (optional)
            </label>
            <div className="flex items-center gap-3">
              <div className="w-24">
                <label htmlFor="age_low" className="text-xs text-stone">Min Age</label>
                <Input
                  id="age_low"
                  type="number"
                  min={0}
                  max={99}
                  value={seriesDraftData?.age_low ?? ''}
                  onChange={(e) =>
                    mergeSeriesData({
                      age_low: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <span className="text-stone mt-4">–</span>
              <div className="w-24">
                <label htmlFor="age_high" className="text-xs text-stone">Max Age</label>
                <Input
                  id="age_high"
                  type="number"
                  min={0}
                  max={99}
                  value={seriesDraftData?.age_high ?? ''}
                  onChange={(e) =>
                    mergeSeriesData({
                      age_high: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="99"
                />
              </div>
            </div>
            <div className="mt-2">
              <Input
                id="age_details"
                type="text"
                value={seriesDraftData?.age_details || ''}
                onChange={(e) => mergeSeriesData({ age_details: e.target.value })}
                placeholder="e.g., Must be potty-trained, parent must attend under 5"
              />
              <p className="text-xs text-stone mt-1">
                Additional age-related notes (optional)
              </p>
            </div>
          </div>

          {/* ====================================================== */}
          {/* PHASE D: Skill Level (conditional on series type)       */}
          {/* ====================================================== */}
          {seriesConfig?.supportsSkillLevel && (
            <div className="pt-4 border-t border-sand">
              <label className="block text-sm font-medium text-charcoal mb-2 flex items-center">
                <GraduationCap className="w-4 h-4 mr-1.5" />
                Skill Level (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {/* "Not specified" option */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('📋 [Step2] Skill level cleared');
                    mergeSeriesData({ skill_level: undefined });
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg border transition-all',
                    !seriesDraftData?.skill_level
                      ? 'border-coral bg-coral/10 text-coral'
                      : 'border-sand bg-warm-white text-charcoal hover:border-coral/50'
                  )}
                >
                  Not specified
                </button>
                {SKILL_LEVEL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      console.log(`📋 [Step2] Skill level set: ${option.value}`);
                      mergeSeriesData({ skill_level: option.value as SkillLevel });
                    }}
                    className={cn(
                      'px-4 py-2 rounded-lg border transition-all',
                      seriesDraftData?.skill_level === option.value
                        ? 'border-coral bg-coral/10 text-coral'
                        : 'border-sand bg-warm-white text-charcoal hover:border-coral/50'
                    )}
                  >
                    <span className="mr-1">{option.emoji}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* PHASE D: Extended Care (conditional on series type)     */}
          {/* ====================================================== */}
          {seriesConfig?.supportsExtendedCare && (
            <div className="pt-4 border-t border-sand">
              <label className="block text-sm font-medium text-charcoal mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-1.5" />
                Extended Care / Before & After Care (optional)
              </label>
              <p className="text-xs text-stone mb-3">
                Does this camp offer before-care or after-care options?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="core_start_time" className="text-xs text-stone">
                    Core Start Time
                  </label>
                  <Input
                    id="core_start_time"
                    type="time"
                    value={seriesDraftData?.core_start_time || ''}
                    onChange={(e) => mergeSeriesData({ core_start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="core_end_time" className="text-xs text-stone">
                    Core End Time
                  </label>
                  <Input
                    id="core_end_time"
                    type="time"
                    value={seriesDraftData?.core_end_time || ''}
                    onChange={(e) => mergeSeriesData({ core_end_time: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="extended_start_time" className="text-xs text-stone">
                    Before Care Starts
                  </label>
                  <Input
                    id="extended_start_time"
                    type="time"
                    value={seriesDraftData?.extended_start_time || ''}
                    onChange={(e) => mergeSeriesData({ extended_start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="extended_end_time" className="text-xs text-stone">
                    After Care Ends
                  </label>
                  <Input
                    id="extended_end_time"
                    type="time"
                    value={seriesDraftData?.extended_end_time || ''}
                    onChange={(e) => mergeSeriesData({ extended_end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label htmlFor="extended_care_details" className="text-xs text-stone">
                  Care Details & Pricing
                </label>
                <Input
                  id="extended_care_details"
                  type="text"
                  value={seriesDraftData?.extended_care_details || ''}
                  onChange={(e) => mergeSeriesData({ extended_care_details: e.target.value })}
                  placeholder="e.g., Before care 7:30-9am ($25/wk). After care 3-5:30pm ($50/wk)."
                />
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* PHASE D: Term / Semester Name (optional)                */}
          {/* ====================================================== */}
          <div className="pt-4 border-t border-sand">
            <label
              htmlFor="term_name"
              className="block text-sm font-medium text-charcoal mb-1 flex items-center"
            >
              <Tag className="w-4 h-4 mr-1.5" />
              Term / Semester (optional)
            </label>
            <Input
              id="term_name"
              type="text"
              value={seriesDraftData?.term_name || ''}
              onChange={(e) => mergeSeriesData({ term_name: e.target.value })}
              placeholder="e.g., Fall 2026, Summer Session A"
              className="max-w-xs"
            />
            <p className="text-xs text-stone mt-1">
              Helps group sessions by academic term or camp session
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
