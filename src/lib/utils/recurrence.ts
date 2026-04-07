/**
 * RECURRENCE UTILITIES
 * ====================
 * Pure date calculation functions for recurring events, camps, and series.
 * No database or Supabase dependencies — just date math.
 *
 * @module lib/utils/recurrence
 */

import type { RecurrenceRule } from '@/lib/supabase/types';

// ============================================================================
// CALCULATE DATES IN RANGE (for camps)
// ============================================================================

/**
 * Calculate all dates between startDate and endDate that fall on specified days of week.
 * Safety-capped at 60 days to prevent runaway generation.
 */
export function calculateDatesInRange(
  startDate: string,
  endDate: string,
  daysOfWeek: number[]
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
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
// CALCULATE RECURRING DATES
// ============================================================================

/**
 * Calculate occurrence dates from a recurrence rule.
 * Supports daily, weekly, biweekly, and monthly patterns.
 * Safety-capped at 52 occurrences.
 */
export function calculateRecurringDates(
  rule: RecurrenceRule,
  firstDate: string
): string[] {
  const dates: string[] = [];
  const maxOccurrences = 52; // Safety cap: 1 year of weekly events
  const defaultWeeks = 12;   // Default generation window

  // Determine how many events to generate and/or end date
  let maxCount = maxOccurrences;
  let endDate: Date | null = null;

  switch (rule.end_type) {
    case 'count':
      maxCount = Math.min(rule.end_count || 10, maxOccurrences);
      break;
    case 'date':
      if (rule.end_date) {
        endDate = new Date(rule.end_date + 'T23:59:59');
      }
      break;
    case 'never':
    default:
      // Generate defaultWeeks worth of events
      endDate = new Date(firstDate + 'T00:00:00');
      endDate.setDate(endDate.getDate() + defaultWeeks * 7);
      break;
  }

  const current = new Date(firstDate + 'T00:00:00');
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case 'daily': {
      while (dates.length < maxCount) {
        if (endDate && current > endDate) break;
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + interval);
      }
      break;
    }

    case 'weekly':
    case 'biweekly': {
      const daysOfWeek = rule.days_of_week || [];
      const weekInterval = rule.frequency === 'biweekly' ? 2 * interval : interval;

      if (daysOfWeek.length === 0) {
        // If no specific days, use the day of the first occurrence
        daysOfWeek.push(current.getDay());
      }

      // Start from the beginning of the week containing firstDate
      const weekStart = new Date(current);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Go to Sunday

      const iterWeek = new Date(weekStart);
      const safetyLimit = maxCount * 4; // Prevent infinite loops
      let iterations = 0;

      while (dates.length < maxCount && iterations < safetyLimit) {
        for (const day of daysOfWeek) {
          const candidate = new Date(iterWeek);
          candidate.setDate(candidate.getDate() + day);

          // Skip dates before the first date
          if (candidate < current) continue;
          if (endDate && candidate > endDate) break;
          if (dates.length >= maxCount) break;

          dates.push(candidate.toISOString().split('T')[0]);
        }
        // Advance to the next applicable week
        iterWeek.setDate(iterWeek.getDate() + 7 * weekInterval);
        iterations++;
      }
      break;
    }

    case 'monthly': {
      const dayOfMonth = rule.day_of_month || current.getDate();

      while (dates.length < maxCount) {
        if (endDate && current > endDate) break;

        // Set to the target day of month (handle month-end overflow)
        const targetDate = new Date(current.getFullYear(), current.getMonth(), dayOfMonth);
        if (targetDate.getMonth() !== current.getMonth()) {
          // Day overflowed (e.g., Feb 30 -> Mar 2), use last day of month
          targetDate.setDate(0); // Last day of previous month
        }

        if (targetDate >= new Date(firstDate + 'T00:00:00')) {
          dates.push(targetDate.toISOString().split('T')[0]);
        }

        current.setMonth(current.getMonth() + interval);
      }
      break;
    }

    default:
      console.warn(`⚠️ [calculateRecurringDates] Unsupported frequency: ${rule.frequency}`);
  }

  console.log(`📅 [calculateRecurringDates] Generated ${dates.length} dates for ${rule.frequency} pattern`);
  return dates;
}

// ============================================================================
// ADD MINUTES TO TIME
// ============================================================================

/**
 * Adds minutes to an HH:MM time string.
 * Example: addMinutesToTime("19:00", 120) => "21:00"
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}
