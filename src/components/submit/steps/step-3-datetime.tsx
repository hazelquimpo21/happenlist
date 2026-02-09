/**
 * STEP 3: DATE & TIME
 * ====================
 * Third step of the event submission form.
 *
 * Collects:
 *   - Start date and time
 *   - End date and time (optional)
 *   - All-day flag
 *   - Recurrence pattern (for recurring events)
 *
 * Phase D additions:
 *   - Camp date range picker (start_date, end_date) for new_series with camp type
 *   - Days-of-week selector for camps (defaults Mon-Fri)
 *   - Core hours input for camps
 *   - Preview of how many events will be auto-generated
 *
 * @module components/submit/steps/step-3-datetime
 */

'use client';

import { useState, useMemo } from 'react';
import { Clock, Calendar, Sun, RefreshCw, Tent, CalendarDays } from 'lucide-react';
import { StepHeader } from '../step-progress';
import { Input } from '@/components/ui';
import type {
  EventDraftData,
  SeriesDraftData,
  RecurrenceRule,
  RecurrenceFrequency,
  RecurrenceEndType,
} from '@/types/submission';
import { DAY_OF_WEEK_SHORT } from '@/types/submission';
import { RECURRENCE_FREQUENCY_OPTIONS, SERIES_LIMITS } from '@/lib/constants/series-limits';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Step3Props {
  draftData: EventDraftData;
  updateData: (updates: Partial<EventDraftData>) => void;
  /** Series draft data — needed for camp date range and days_of_week */
  seriesDraftData?: SeriesDraftData | null;
  /** Update series draft data — needed for camp days_of_week edits */
  updateSeriesData?: (data: SeriesDraftData | null) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDateForInput(isoString: string | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format
}

function formatDateOnly(isoString: string | undefined): string {
  if (!isoString) return '';
  return isoString.split('T')[0];
}

/**
 * Calculate the dates that would be generated for a camp/consecutive series.
 * Given a start date, end date, and active days-of-week, returns all matching dates.
 *
 * @param startDate - ISO date string (YYYY-MM-DD)
 * @param endDate - ISO date string (YYYY-MM-DD)
 * @param daysOfWeek - Array of day indices (0=Sun..6=Sat)
 * @returns Array of ISO date strings
 */
function calculateCampDates(
  startDate: string | undefined,
  endDate: string | undefined,
  daysOfWeek: number[]
): string[] {
  if (!startDate || !endDate || daysOfWeek.length === 0) return [];

  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  // Safety: limit to 60 days to prevent runaway loops
  const maxDays = 60;
  let count = 0;

  const current = new Date(start);
  while (current <= end && count < maxDays) {
    if (daysOfWeek.includes(current.getDay())) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
    count++;
  }

  return dates;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Step3DateTime({
  draftData,
  updateData,
  seriesDraftData,
  updateSeriesData,
}: Step3Props) {
  const isRecurring = draftData.event_mode === 'recurring';
  const isNewSeries = draftData.event_mode === 'new_series';
  const seriesType = seriesDraftData?.series_type;
  const seriesConfig = seriesType ? SERIES_LIMITS[seriesType] : null;

  // Camp mode: consecutive date selection with days-of-week picker
  const isCampMode = isNewSeries && seriesConfig?.dateSelection === 'consecutive';

  // ========== Camp date range state ==========
  const [campStartDate, setCampStartDate] = useState(
    seriesDraftData?.core_start_time ? '' : formatDateOnly(draftData.start_datetime)
  );
  const [campEndDate, setCampEndDate] = useState('');
  const [campTime, setCampTime] = useState(seriesDraftData?.core_start_time || '09:00');
  const [campEndTime, setCampEndTime] = useState(seriesDraftData?.core_end_time || '15:00');

  // Days of week for camp (default Mon-Fri from config)
  const campDaysOfWeek = seriesDraftData?.days_of_week ?? seriesConfig?.defaultDaysOfWeek ?? [1, 2, 3, 4, 5];

  // Calculate preview dates for camp
  const campDates = useMemo(() => {
    return calculateCampDates(campStartDate, campEndDate, campDaysOfWeek);
  }, [campStartDate, campEndDate, campDaysOfWeek]);

  // ========== Camp day toggle ==========
  const toggleCampDay = (day: number) => {
    const newDays = campDaysOfWeek.includes(day)
      ? campDaysOfWeek.filter((d) => d !== day)
      : [...campDaysOfWeek, day].sort();

    console.log(`📅 [Step3] Camp days-of-week updated: [${newDays.join(',')}]`);

    if (updateSeriesData && seriesDraftData) {
      updateSeriesData({ ...seriesDraftData, days_of_week: newDays });
    }
  };

  // ========== Update camp dates in draft data ==========
  const handleCampStartChange = (date: string) => {
    setCampStartDate(date);
    console.log(`📅 [Step3] Camp start date: ${date}`);
    // Set the event start_datetime to camp start + camp time
    updateData({
      start_datetime: `${date}T${campTime}:00`,
      instance_date: date,
    });
  };

  const handleCampEndChange = (date: string) => {
    setCampEndDate(date);
    console.log(`📅 [Step3] Camp end date: ${date}`);
    updateData({
      end_datetime: `${date}T${campEndTime}:00`,
    });
  };

  const handleCampTimeChange = (time: string) => {
    setCampTime(time);
    console.log(`📅 [Step3] Camp core start time: ${time}`);
    if (updateSeriesData && seriesDraftData) {
      updateSeriesData({ ...seriesDraftData, core_start_time: time });
    }
    if (campStartDate) {
      updateData({ start_datetime: `${campStartDate}T${time}:00` });
    }
  };

  const handleCampEndTimeChange = (time: string) => {
    setCampEndTime(time);
    console.log(`📅 [Step3] Camp core end time: ${time}`);
    if (updateSeriesData && seriesDraftData) {
      updateSeriesData({ ...seriesDraftData, core_end_time: time });
    }
    if (campEndDate) {
      updateData({ end_datetime: `${campEndDate}T${time}:00` });
    }
  };

  // ========== Recurrence State ==========
  const [recurrence, setRecurrence] = useState<RecurrenceRule>(
    draftData.recurrence_rule || {
      frequency: 'weekly',
      interval: 1,
      days_of_week: [],
      time: '19:00',
      duration_minutes: 120,
      end_type: 'never',
    }
  );

  const updateRecurrence = (updates: Partial<RecurrenceRule>) => {
    const newRecurrence = { ...recurrence, ...updates };
    setRecurrence(newRecurrence);
    updateData({ recurrence_rule: newRecurrence });
  };

  // ========== Toggle Day of Week (recurrence) ==========
  const toggleDay = (day: number) => {
    const currentDays = recurrence.days_of_week || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    updateRecurrence({ days_of_week: newDays });
  };

  return (
    <div className="space-y-6">
      <StepHeader
        step={3}
        title="Date & Time"
        description="When does your event take place?"
      />

      {/* ========== Camp Date Range Mode ========== */}
      {isCampMode && (
        <div className="space-y-6 p-4 bg-cream rounded-lg border border-sand">
          <h3 className="font-medium text-charcoal flex items-center">
            <Tent className="w-4 h-4 mr-2" />
            Camp Schedule
          </h3>
          <p className="text-sm text-stone -mt-4">
            Set the date range and which days the camp runs. Individual session events will be auto-generated.
          </p>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="camp_start_date" className="block text-sm font-medium text-charcoal mb-1">
                Start Date <span className="text-coral">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                <Input
                  id="camp_start_date"
                  type="date"
                  value={campStartDate}
                  onChange={(e) => handleCampStartChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label htmlFor="camp_end_date" className="block text-sm font-medium text-charcoal mb-1">
                End Date <span className="text-coral">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                <Input
                  id="camp_end_date"
                  type="date"
                  value={campEndDate}
                  min={campStartDate || undefined}
                  onChange={(e) => handleCampEndChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Core hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="camp_time" className="block text-sm font-medium text-charcoal mb-1">
                Start Time <span className="text-coral">*</span>
              </label>
              <Input
                id="camp_time"
                type="time"
                value={campTime}
                onChange={(e) => handleCampTimeChange(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label htmlFor="camp_end_time" className="block text-sm font-medium text-charcoal mb-1">
                End Time <span className="text-coral">*</span>
              </label>
              <Input
                id="camp_end_time"
                type="time"
                value={campEndTime}
                onChange={(e) => handleCampEndTimeChange(e.target.value)}
                className="w-40"
              />
            </div>
          </div>

          {/* Days of week selector */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Which days does the camp run?
            </label>
            <div className="flex gap-2">
              {DAY_OF_WEEK_SHORT.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleCampDay(index)}
                  className={cn(
                    'w-10 h-10 rounded-lg border font-medium transition-all',
                    campDaysOfWeek.includes(index)
                      ? 'border-coral bg-coral text-white'
                      : 'border-sand bg-warm-white text-charcoal hover:border-coral/50'
                  )}
                >
                  {day.charAt(0)}
                </button>
              ))}
            </div>
          </div>

          {/* Preview of generated dates */}
          {campDates.length > 0 && (
            <div className="p-3 bg-sage/10 border border-sage/30 rounded-lg">
              <p className="text-sm font-medium text-charcoal flex items-center mb-2">
                <CalendarDays className="w-4 h-4 mr-1.5" />
                {campDates.length} session{campDates.length !== 1 ? 's' : ''} will be created:
              </p>
              <div className="flex flex-wrap gap-2">
                {campDates.map((date) => {
                  const d = new Date(date + 'T00:00:00');
                  const label = d.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <span
                      key={date}
                      className="text-xs bg-sage/20 text-sage px-2 py-1 rounded"
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {campStartDate && campEndDate && campDates.length === 0 && (
            <p className="text-sm text-coral">
              No matching days found in the selected range. Check your day selections above.
            </p>
          )}
        </div>
      )}

      {/* ========== Regular Event Date/Time ========== */}
      {!isRecurring && !isCampMode && (
        <>
          {/* Start Date & Time */}
          <div>
            <label
              htmlFor="start_datetime"
              className="block text-sm font-medium text-charcoal mb-1"
            >
              Start Date & Time <span className="text-coral">*</span>
            </label>
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                <Input
                  id="start_datetime"
                  type="datetime-local"
                  value={formatDateForInput(draftData.start_datetime)}
                  onChange={(e) => {
                    updateData({
                      start_datetime: e.target.value,
                      instance_date: e.target.value.split('T')[0],
                    });
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => updateData({ is_all_day: !draftData.is_all_day })}
              className={cn(
                'flex items-center px-4 py-2 rounded-lg border transition-all',
                draftData.is_all_day
                  ? 'border-coral bg-coral/10 text-coral'
                  : 'border-sand bg-warm-white text-charcoal hover:border-coral/50'
              )}
            >
              <Sun className="w-4 h-4 mr-2" />
              All-day event
            </button>
            <span className="text-sm text-stone">
              No specific start/end time
            </span>
          </div>

          {/* End Date & Time */}
          {!draftData.is_all_day && (
            <div>
              <label
                htmlFor="end_datetime"
                className="block text-sm font-medium text-charcoal mb-1"
              >
                End Date & Time (optional)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                <Input
                  id="end_datetime"
                  type="datetime-local"
                  value={formatDateForInput(draftData.end_datetime)}
                  onChange={(e) => updateData({ end_datetime: e.target.value })}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-stone mt-1">
                Helps attendees plan their time
              </p>
            </div>
          )}
        </>
      )}

      {/* ========== Recurring Event Pattern ========== */}
      {isRecurring && (
        <div className="space-y-6 p-4 bg-cream rounded-lg border border-sand">
          <h3 className="font-medium text-charcoal flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recurrence Pattern
          </h3>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Repeats
            </label>
            <div className="flex flex-wrap gap-2">
              {RECURRENCE_FREQUENCY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    updateRecurrence({ frequency: option.value as RecurrenceFrequency })
                  }
                  className={cn(
                    'px-4 py-2 rounded-lg border transition-all',
                    recurrence.frequency === option.value
                      ? 'border-coral bg-coral/10 text-coral'
                      : 'border-sand bg-warm-white text-charcoal hover:border-coral/50'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Days of Week (for weekly/biweekly) */}
          {(recurrence.frequency === 'weekly' || recurrence.frequency === 'biweekly') && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                On these days
              </label>
              <div className="flex gap-2">
                {DAY_OF_WEEK_SHORT.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={cn(
                      'w-10 h-10 rounded-lg border font-medium transition-all',
                      recurrence.days_of_week?.includes(index)
                        ? 'border-coral bg-coral text-white'
                        : 'border-sand bg-warm-white text-charcoal hover:border-coral/50'
                    )}
                  >
                    {day.charAt(0)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start Time */}
          <div>
            <label
              htmlFor="recurrence_time"
              className="block text-sm font-medium text-charcoal mb-1"
            >
              Event Time
            </label>
            <Input
              id="recurrence_time"
              type="time"
              value={recurrence.time}
              onChange={(e) => updateRecurrence({ time: e.target.value })}
              className="w-40"
            />
          </div>

          {/* Duration */}
          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-charcoal mb-1"
            >
              Duration (minutes)
            </label>
            <Input
              id="duration"
              type="number"
              min={15}
              max={480}
              step={15}
              value={recurrence.duration_minutes}
              onChange={(e) =>
                updateRecurrence({ duration_minutes: parseInt(e.target.value) || 60 })
              }
              className="w-32"
            />
            <p className="text-xs text-stone mt-1">
              Common durations: 60 (1 hour), 90 (1.5 hours), 120 (2 hours)
            </p>
          </div>

          {/* End Type */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Ends
            </label>
            <div className="space-y-3">
              {/* Never */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="end_type"
                  checked={recurrence.end_type === 'never'}
                  onChange={() => updateRecurrence({ end_type: 'never' })}
                  className="w-4 h-4 text-coral"
                />
                <span className="text-charcoal">Never (ongoing)</span>
              </label>

              {/* After count */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="end_type"
                  checked={recurrence.end_type === 'count'}
                  onChange={() => updateRecurrence({ end_type: 'count', end_count: 10 })}
                  className="w-4 h-4 text-coral"
                />
                <span className="text-charcoal">After</span>
                <Input
                  type="number"
                  min={1}
                  max={52}
                  value={recurrence.end_count || 10}
                  onChange={(e) =>
                    updateRecurrence({
                      end_type: 'count',
                      end_count: parseInt(e.target.value) || 10,
                    })
                  }
                  disabled={recurrence.end_type !== 'count'}
                  className="w-20"
                />
                <span className="text-charcoal">occurrences</span>
              </label>

              {/* By date */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="end_type"
                  checked={recurrence.end_type === 'date'}
                  onChange={() => updateRecurrence({ end_type: 'date' })}
                  className="w-4 h-4 text-coral"
                />
                <span className="text-charcoal">On</span>
                <Input
                  type="date"
                  value={recurrence.end_date || ''}
                  onChange={(e) =>
                    updateRecurrence({ end_type: 'date', end_date: e.target.value })
                  }
                  disabled={recurrence.end_type !== 'date'}
                  className="w-44"
                />
              </label>
            </div>
          </div>

          {/* First occurrence date */}
          <div>
            <label
              htmlFor="first_date"
              className="block text-sm font-medium text-charcoal mb-1"
            >
              First occurrence date <span className="text-coral">*</span>
            </label>
            <Input
              id="first_date"
              type="date"
              value={formatDateOnly(draftData.start_datetime)}
              onChange={(e) => {
                const time = recurrence.time || '19:00';
                updateData({
                  start_datetime: `${e.target.value}T${time}:00`,
                  instance_date: e.target.value,
                });
              }}
            />
          </div>
        </div>
      )}

      {/* ========== Timezone Note ========== */}
      <p className="text-sm text-stone">
        All times are in Central Time (CT). Adjust if needed.
      </p>
    </div>
  );
}
