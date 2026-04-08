'use client';

/**
 * RECURRENCE BUILDER
 * ==================
 * Inline recurrence rule editor for making a standalone event recurring.
 * Reuses the same UI pattern from the submission form's step-3-datetime.
 */

import { useState, useMemo } from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { calculateRecurringDates, addMinutesToTime } from '@/lib/utils/recurrence';
import { RECURRENCE_FREQUENCY_OPTIONS } from '@/lib/constants/series-limits';
import { DAY_OF_WEEK_SHORT } from '@/types/submission';
import type { RecurrenceRule } from '@/lib/supabase/types';

interface RecurrenceBuilderProps {
  /** The start date of the original event (YYYY-MM-DD) */
  firstDate: string;
  /** The start time from the original event (HH:MM) */
  defaultTime?: string;
  /** Called when the user submits the recurrence rule */
  onSubmit: (rule: RecurrenceRule) => void;
  /** Called when the user cancels */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
}

type RecurrenceFrequency = RecurrenceRule['frequency'];

export function RecurrenceBuilder({
  firstDate,
  defaultTime = '19:00',
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RecurrenceBuilderProps) {
  const [rule, setRule] = useState<RecurrenceRule>({
    frequency: 'weekly',
    interval: 1,
    days_of_week: [],
    time: defaultTime,
    duration_minutes: 120,
    end_type: 'count',
    end_count: 10,
  });

  const updateRule = (updates: Partial<RecurrenceRule>) => {
    setRule(prev => ({ ...prev, ...updates }));
  };

  const toggleDay = (dayIndex: number) => {
    const currentDays = rule.days_of_week || [];
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter(d => d !== dayIndex)
      : [...currentDays, dayIndex].sort();
    updateRule({ days_of_week: newDays });
  };

  // Preview generated dates
  const previewDates = useMemo(() => {
    try {
      return calculateRecurringDates(rule, firstDate).slice(0, 12);
    } catch {
      return [];
    }
  }, [rule, firstDate]);

  const totalDates = useMemo(() => {
    try {
      return calculateRecurringDates(rule, firstDate).length;
    } catch {
      return 0;
    }
  }, [rule, firstDate]);

  const formatPreviewDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      timeZone: 'America/Chicago',
    }).format(date);
  };

  return (
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
              onClick={() => updateRule({ frequency: option.value as RecurrenceFrequency })}
              className={cn(
                'px-4 py-2 rounded-lg border transition-all',
                rule.frequency === option.value
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
      {(rule.frequency === 'weekly' || rule.frequency === 'biweekly') && (
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
                  rule.days_of_week?.includes(index)
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

      {/* Time & Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">
            Event Time
          </label>
          <Input
            type="time"
            value={rule.time}
            onChange={(e) => updateRule({ time: e.target.value })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">
            Duration (min)
          </label>
          <Input
            type="number"
            min={15}
            max={480}
            step={15}
            value={rule.duration_minutes}
            onChange={(e) => updateRule({ duration_minutes: parseInt(e.target.value) || 60 })}
            className="w-full"
          />
        </div>
      </div>

      {/* End Type */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">
          Ends
        </label>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="recurrence_end_type"
              checked={rule.end_type === 'never'}
              onChange={() => updateRule({ end_type: 'never' })}
              className="w-4 h-4 text-coral"
            />
            <span className="text-charcoal">Never (ongoing, generates ~12 weeks)</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="recurrence_end_type"
              checked={rule.end_type === 'count'}
              onChange={() => updateRule({ end_type: 'count', end_count: rule.end_count || 10 })}
              className="w-4 h-4 text-coral"
            />
            <span className="text-charcoal">After</span>
            <Input
              type="number"
              min={2}
              max={52}
              value={rule.end_count || 10}
              onChange={(e) => updateRule({ end_type: 'count', end_count: parseInt(e.target.value) || 10 })}
              disabled={rule.end_type !== 'count'}
              className="w-20"
            />
            <span className="text-charcoal">occurrences</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="recurrence_end_type"
              checked={rule.end_type === 'date'}
              onChange={() => updateRule({ end_type: 'date' })}
              className="w-4 h-4 text-coral"
            />
            <span className="text-charcoal">On</span>
            <Input
              type="date"
              value={rule.end_date || ''}
              onChange={(e) => updateRule({ end_type: 'date', end_date: e.target.value })}
              disabled={rule.end_type !== 'date'}
              className="w-44"
            />
          </label>
        </div>
      </div>

      {/* Date Preview */}
      {previewDates.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Preview ({totalDates} events total, including original)
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {previewDates.map((date, i) => (
              <div
                key={date}
                className={cn(
                  'text-xs px-2 py-1 rounded',
                  i === 0
                    ? 'bg-coral/10 text-coral font-medium'
                    : 'bg-sand/50 text-stone'
                )}
              >
                {i === 0 ? `${formatPreviewDate(date)} (original)` : formatPreviewDate(date)}
              </div>
            ))}
            {totalDates > 12 && (
              <div className="text-xs px-2 py-1 text-stone">
                +{totalDates - 12} more...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-sand">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit(rule)}
          disabled={isSubmitting || totalDates < 2}
          className="bg-coral hover:bg-coral/90 text-white"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
              Generating...
            </>
          ) : (
            `Generate ${totalDates} Events`
          )}
        </Button>
      </div>
    </div>
  );
}
