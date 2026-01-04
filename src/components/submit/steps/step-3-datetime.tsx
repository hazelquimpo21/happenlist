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
 * @module components/submit/steps/step-3-datetime
 */

'use client';

import { useState } from 'react';
import { Clock, Calendar, Sun, RefreshCw } from 'lucide-react';
import { StepHeader } from '../step-progress';
import { Input } from '@/components/ui';
import type {
  EventDraftData,
  RecurrenceRule,
  RecurrenceFrequency,
  RecurrenceEndType,
} from '@/types/submission';
import { DAY_OF_WEEK_SHORT } from '@/types/submission';
import { RECURRENCE_FREQUENCY_OPTIONS } from '@/lib/constants/series-limits';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Step3Props {
  draftData: EventDraftData;
  updateData: (updates: Partial<EventDraftData>) => void;
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

// ============================================================================
// COMPONENT
// ============================================================================

export function Step3DateTime({ draftData, updateData }: Step3Props) {
  const isRecurring = draftData.event_mode === 'recurring';

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

  // ========== Toggle Day of Week ==========
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

      {/* ========== Regular Event Date/Time ========== */}
      {!isRecurring && (
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
