/**
 * SMART TIMELINE UTILITIES
 * ========================
 * Maps raw calendar and email-extracted event data into DisplayItem[],
 * groups them by time period, and sorts within each group.
 *
 * The core mapper `toDisplayItems()` implements the four-category
 * classification logic:
 *   1. schedule       — Google Calendar confirmed events
 *   2. recommendation — AI-recommended events (high composite weight)
 *   3. date           — Extracted deadlines, birthdays, payments, etc.
 *   4. low-signal     — Low-confidence detections
 *
 * Sorting within each time group follows category priority:
 *   schedule → recommendation → date → low-signal
 */

import {
  type DisplayItem,
  type DisplayAction,
  type DisplayCategory,
  type CommitmentLevel,
  type TimeGroup,
  RECOMMENDATION_EVENT_TYPES,
  DATE_EVENT_TYPES,
} from './display-item.types';

// ============================================================================
// RAW INPUT TYPES
// ============================================================================

/**
 * Raw calendar event from Google Calendar API.
 * These are the fields we expect from the gcal sync layer.
 */
export interface RawCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  hangoutLink?: string;
  status?: string;
  attendees?: Array<{ email: string; responseStatus?: string; self?: boolean }>;
  colorId?: string;
  calendarColor?: string;
}

/**
 * Raw email-extracted event from the AI extraction pipeline.
 * These carry the composite weight, commitment level, and whyAttend
 * fields that power the recommendation system.
 */
export interface RawEmailEvent {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  location?: string;
  start_datetime?: string;
  end_datetime?: string;
  event_type: string;
  tier: 'firm' | 'suggested' | 'tentative';
  commitment_level?: 'confirmed' | 'invited' | 'suggested' | 'fyi';
  composite_weight?: number;
  why_attend?: string;
  source_email_sender?: string;
  source_email_subject?: string;
  rsvp_url?: string;
  rsvp_deadline?: string;
  is_birthday?: boolean;
  birthday_person_name?: string;
  birthday_age?: number;
  is_acknowledged?: boolean;
  event_metadata?: Record<string, unknown>;
}

// ============================================================================
// CATEGORY CLASSIFICATION
// ============================================================================

/** Set for O(1) lookup of recommendation event types. */
const RECOMMENDATION_TYPE_SET = new Set<string>(RECOMMENDATION_EVENT_TYPES);

/** Set for O(1) lookup of date event types. */
const DATE_TYPE_SET = new Set<string>(DATE_EVENT_TYPES);

/**
 * Classify a raw email event into one of the four display categories.
 *
 * Logic:
 * - tier === 'firm' from email → schedule (rare, but possible for synced items)
 * - tier === 'suggested' AND event type is attendable → recommendation
 * - event type is a date type → date
 * - everything else → low-signal
 */
function classifyEmailEvent(event: RawEmailEvent): DisplayCategory {
  const { tier, event_type } = event;

  if (tier === 'firm') {
    return 'schedule';
  }

  if (tier === 'suggested' && RECOMMENDATION_TYPE_SET.has(event_type)) {
    return 'recommendation';
  }

  if (DATE_TYPE_SET.has(event_type)) {
    return 'date';
  }

  return 'low-signal';
}

// ============================================================================
// ACTION COMPUTATION
// ============================================================================

/**
 * Compute the action buttons for a display item based on its
 * displayCategory and commitmentLevel.
 */
function computeActions(
  category: DisplayCategory,
  commitmentLevel: CommitmentLevel | null,
  opts: {
    gcalHtmlLink?: string;
    hangoutLink?: string;
    rsvpUrl?: string;
  }
): DisplayAction[] {
  const actions: DisplayAction[] = [];

  switch (category) {
    case 'schedule': {
      // Schedule items: Open in Calendar + Join Meeting (if link exists)
      if (opts.hangoutLink) {
        actions.push({
          label: 'Join Meeting',
          type: 'primary',
          action: 'join-meeting',
          url: opts.hangoutLink,
        });
      }
      if (opts.gcalHtmlLink) {
        actions.push({
          label: 'Open',
          type: opts.hangoutLink ? 'secondary' : 'primary',
          action: 'open-external',
          url: opts.gcalHtmlLink,
        });
      }
      actions.push({
        label: 'Create Task',
        type: 'tertiary',
        action: 'create-task',
      });
      break;
    }

    case 'recommendation': {
      // Recommendations: actions vary by commitment level
      if (commitmentLevel === 'invited') {
        actions.push(
          { label: 'Save to Calendar', type: 'primary', action: 'save-to-calendar' },
          { label: 'Decline', type: 'secondary', action: 'not-for-me' },
          { label: 'Maybe Later', type: 'tertiary', action: 'maybe-later' }
        );
      } else if (commitmentLevel === 'suggested') {
        actions.push(
          { label: 'Save to Calendar', type: 'primary', action: 'save-to-calendar' },
          { label: 'Not for me', type: 'secondary', action: 'not-for-me' },
          { label: 'Maybe Later', type: 'tertiary', action: 'maybe-later' }
        );
      } else {
        // fyi or null
        actions.push(
          { label: 'Save', type: 'primary', action: 'save' },
          { label: 'Dismiss', type: 'tertiary', action: 'dismiss' }
        );
      }

      // Add RSVP link if available
      if (opts.rsvpUrl) {
        actions.splice(1, 0, {
          label: 'RSVP',
          type: 'secondary',
          action: 'open-external',
          url: opts.rsvpUrl,
        });
      }
      break;
    }

    case 'date': {
      actions.push(
        { label: 'Done', type: 'primary', action: 'done' },
        { label: 'Create Task', type: 'secondary', action: 'create-task' },
        { label: 'Snooze', type: 'tertiary', action: 'snooze' }
      );
      break;
    }

    case 'low-signal': {
      actions.push(
        { label: 'Save', type: 'primary', action: 'save' },
        { label: 'Dismiss', type: 'tertiary', action: 'dismiss' }
      );
      break;
    }
  }

  return actions;
}

// ============================================================================
// CONTEXT LINE GENERATION
// ============================================================================

/**
 * Build the context line for a display item.
 * This is the always-visible subtitle that gives the item provenance.
 */
function buildContextLine(
  category: DisplayCategory,
  opts: {
    hangoutLink?: string;
    whyAttend?: string;
    commitmentLevel?: CommitmentLevel | null;
    sourceEmailSender?: string;
    sourceEmailSubject?: string;
    eventType?: string;
  }
): string {
  switch (category) {
    case 'schedule': {
      const base = 'From your calendar';
      return opts.hangoutLink ? `${base} \u00B7 Meeting link available` : base;
    }

    case 'recommendation': {
      if (opts.whyAttend) return opts.whyAttend;
      const parts: string[] = [];
      if (opts.commitmentLevel) {
        parts.push(
          opts.commitmentLevel.charAt(0).toUpperCase() +
            opts.commitmentLevel.slice(1)
        );
      }
      if (opts.sourceEmailSender) {
        parts.push(`from email by ${opts.sourceEmailSender}`);
      }
      return parts.join(' \u00B7 ') || 'Recommended for you';
    }

    case 'date': {
      if (opts.sourceEmailSubject) {
        return `Found in email: ${opts.sourceEmailSubject}`;
      }
      if (opts.sourceEmailSender) {
        return `From email by ${opts.sourceEmailSender}`;
      }
      return '';
    }

    case 'low-signal': {
      const sender = opts.sourceEmailSender || 'unknown sender';
      return `Low confidence \u00B7 from ${sender}`;
    }
  }
}

// ============================================================================
// DATE/TIME HELPERS
// ============================================================================

/**
 * Parse a datetime string (ISO or Google Calendar format) into a Date.
 * Falls back to today if parsing fails.
 */
function parseDateTime(dateTime?: string, dateOnly?: string): Date {
  if (dateTime) {
    const parsed = new Date(dateTime);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  if (dateOnly) {
    const parsed = new Date(dateOnly + 'T00:00:00');
    if (!isNaN(parsed.getTime())) return parsed;
  }
  console.warn('⚠️ [smart-timeline] Failed to parse date, using today');
  return new Date();
}

/**
 * Format a Date into a time string like "7:00 PM".
 * Returns undefined for all-day events (no dateTime, only date).
 */
function formatTime(date: Date, hasTime: boolean): string | undefined {
  if (!hasTime) return undefined;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a Date into a YYYY-MM-DD string for grouping.
 */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Check if a date item is overdue (past its date and not acknowledged).
 * Accepts a `now` timestamp for consistency across a single mapping pass.
 */
function checkOverdue(
  date: Date,
  category: DisplayCategory,
  now: Date
): boolean {
  if (category !== 'date') return false;
  return date < now;
}

// ============================================================================
// SELF-RESPONSE EXTRACTION
// ============================================================================

/**
 * Extract the authenticated user's RSVP status from Google Calendar attendees.
 */
function extractSelfResponse(
  attendees?: Array<{ email: string; responseStatus?: string; self?: boolean }>
): string | undefined {
  if (!attendees) return undefined;
  const self = attendees.find((a) => a.self);
  return self?.responseStatus;
}

// ============================================================================
// GOOGLE CALENDAR COLOR MAP
// ============================================================================

/** Google Calendar colorId → hex color mapping. */
const GCAL_COLOR_MAP: Record<string, string> = {
  '1': '#7986CB', // Lavender
  '2': '#33B679', // Sage
  '3': '#8E24AA', // Grape
  '4': '#E67C73', // Flamingo
  '5': '#F6BF26', // Banana
  '6': '#F4511E', // Tangerine
  '7': '#039BE5', // Peacock
  '8': '#616161', // Graphite
  '9': '#3F51B5', // Blueberry
  '10': '#0B8043', // Basil
  '11': '#D50000', // Tomato
};

// ============================================================================
// MAIN MAPPER: toDisplayItems()
// ============================================================================

/**
 * Transform raw calendar and email events into a unified DisplayItem[].
 *
 * This is the core data transformation function. It:
 * 1. Maps Google Calendar events → schedule items
 * 2. Classifies email events into recommendation / date / low-signal
 * 3. Computes context lines and action buttons
 * 4. Returns a flat array ready for grouping and sorting
 *
 * @param calendarEvents - Raw events from Google Calendar API
 * @param emailEvents    - Raw events from AI email extraction pipeline
 * @returns DisplayItem[] (unsorted — call sortDisplayItems() after)
 */
export function toDisplayItems(
  calendarEvents: RawCalendarEvent[],
  emailEvents: RawEmailEvent[]
): DisplayItem[] {
  console.log(
    `📊 [toDisplayItems] Mapping ${calendarEvents.length} calendar + ${emailEvents.length} email events`
  );

  const items: DisplayItem[] = [];
  const now = new Date();

  // ---- Map Google Calendar events → schedule ----
  for (const event of calendarEvents) {
    const hasTime = !!event.start.dateTime;
    const date = parseDateTime(event.start.dateTime, event.start.date);
    const endDate = parseDateTime(event.end.dateTime, event.end.date);
    const selfResponse = extractSelfResponse(event.attendees);
    const calendarColor = event.calendarColor ||
      (event.colorId ? GCAL_COLOR_MAP[event.colorId] : undefined);

    const displayCategory: DisplayCategory = 'schedule';

    items.push({
      id: `gcal-${event.id}`,
      title: event.summary || '(No title)',
      date,
      dateString: toDateString(date),
      time: formatTime(date, hasTime),
      endTime: formatTime(endDate, hasTime),
      displayCategory,
      eventType: 'calendar_event',
      commitmentLevel: 'confirmed',
      contextLine: buildContextLine(displayCategory, {
        hangoutLink: event.hangoutLink,
      }),
      source: 'google_calendar',
      actions: computeActions(displayCategory, 'confirmed', {
        gcalHtmlLink: event.htmlLink,
        hangoutLink: event.hangoutLink,
      }),
      location: event.location,
      description: event.description,
      isOverdue: false,
      gcalHtmlLink: event.htmlLink,
      hangoutLink: event.hangoutLink,
      selfResponse,
      isAcknowledged: false,
      calendarColor,
    });
  }

  // ---- Map email-extracted events → recommendation / date / low-signal ----
  for (const event of emailEvents) {
    const hasTime = !!event.start_datetime && event.start_datetime.includes('T');
    const date = parseDateTime(event.start_datetime);
    const endDate = event.end_datetime
      ? parseDateTime(event.end_datetime)
      : undefined;

    const displayCategory = classifyEmailEvent(event);
    const commitmentLevel: CommitmentLevel | null =
      event.commitment_level || null;

    items.push({
      id: `email-${event.id}`,
      title: event.title,
      date,
      dateString: toDateString(date),
      time: formatTime(date, hasTime),
      endTime: endDate ? formatTime(endDate, hasTime) : undefined,
      displayCategory,
      eventType: event.event_type,
      commitmentLevel,
      whyAttend: event.why_attend,
      contextLine: buildContextLine(displayCategory, {
        whyAttend: event.why_attend,
        commitmentLevel,
        sourceEmailSender: event.source_email_sender,
        sourceEmailSubject: event.source_email_subject,
        eventType: event.event_type,
      }),
      source: 'email_extracted',
      sourceEmailSender: event.source_email_sender,
      sourceEmailSubject: event.source_email_subject,
      actions: computeActions(displayCategory, commitmentLevel, {
        rsvpUrl: event.rsvp_url,
      }),
      location: event.location,
      description: event.description,
      summary: event.summary,
      isOverdue: checkOverdue(date, displayCategory, now),
      rsvpUrl: event.rsvp_url,
      rsvpDeadline: event.rsvp_deadline,
      isBirthday: event.is_birthday,
      birthdayPersonName: event.birthday_person_name,
      birthdayAge: event.birthday_age,
      isAcknowledged: event.is_acknowledged ?? false,
      compositeWeight: event.composite_weight,
    });
  }

  console.log(
    `📊 [toDisplayItems] Produced ${items.length} display items: ` +
      `${items.filter((i) => i.displayCategory === 'schedule').length} schedule, ` +
      `${items.filter((i) => i.displayCategory === 'recommendation').length} recommendations, ` +
      `${items.filter((i) => i.displayCategory === 'date').length} dates, ` +
      `${items.filter((i) => i.displayCategory === 'low-signal').length} low-signal`
  );

  return items;
}

// ============================================================================
// SORTING
// ============================================================================

/**
 * Category priority for ordering within a time group.
 * Lower number = appears first.
 */
const CATEGORY_PRIORITY: Record<DisplayCategory, number> = {
  schedule: 0,
  recommendation: 1,
  date: 2,
  'low-signal': 3,
};

/**
 * Date event type priority for secondary sorting within the 'date' category.
 * Deadlines and payments are more urgent than birthdays.
 */
const DATE_TYPE_PRIORITY: Record<string, number> = {
  deadline: 0,
  payment_due: 1,
  appointment: 2,
  expiration: 3,
  follow_up: 4,
  reminder: 5,
  birthday: 6,
  anniversary: 7,
  recurring: 8,
};

/**
 * Sort display items within a single time group.
 *
 * Order:
 * 1. By category priority (schedule → recommendation → date → low-signal)
 * 2. Within schedule: by time ascending
 * 3. Within recommendation: by compositeWeight descending, then time
 * 4. Within date: by time, then by date type priority
 * 5. Within low-signal: by compositeWeight descending
 */
export function sortDisplayItems(items: DisplayItem[]): DisplayItem[] {
  return [...items].sort((a, b) => {
    // Primary sort: category priority
    const catDiff =
      CATEGORY_PRIORITY[a.displayCategory] -
      CATEGORY_PRIORITY[b.displayCategory];
    if (catDiff !== 0) return catDiff;

    // Secondary sort: depends on category
    switch (a.displayCategory) {
      case 'schedule':
        return a.date.getTime() - b.date.getTime();

      case 'recommendation': {
        const weightDiff =
          (b.compositeWeight ?? 0) - (a.compositeWeight ?? 0);
        if (weightDiff !== 0) return weightDiff;
        return a.date.getTime() - b.date.getTime();
      }

      case 'date': {
        const timeDiff = a.date.getTime() - b.date.getTime();
        if (timeDiff !== 0) return timeDiff;
        return (
          (DATE_TYPE_PRIORITY[a.eventType] ?? 99) -
          (DATE_TYPE_PRIORITY[b.eventType] ?? 99)
        );
      }

      case 'low-signal':
        return (b.compositeWeight ?? 0) - (a.compositeWeight ?? 0);

      default:
        return 0;
    }
  });
}

// ============================================================================
// TIME PERIOD GROUPING
// ============================================================================

/**
 * Determine the human-readable time period label for a date.
 *
 * Labels: "Overdue", "Today", "Tomorrow", "This Weekend",
 * "This Week", "Next Week", or "Mon, Apr 14" for further dates.
 */
function getTimePeriodLabel(date: Date, now: Date): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (itemDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';

  // Day of week: 0 = Sunday, 6 = Saturday
  const todayDow = today.getDay();
  const daysUntilEndOfWeek = 7 - todayDow; // days until next Sunday

  // "This Weekend" = Saturday or Sunday of this week
  if (diffDays < daysUntilEndOfWeek) {
    const dayOfWeek = itemDay.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'This Weekend';
    return 'This Week';
  }

  // "Next Week" = Monday through Sunday of the following week
  if (diffDays < daysUntilEndOfWeek + 7) return 'Next Week';

  // Further out: show the actual date
  return itemDay.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Group sorted display items into time periods.
 *
 * @param items - DisplayItem[] (already classified, not yet sorted within groups)
 * @param now   - Current timestamp (injectable for testing)
 * @returns TimeGroup[] ordered chronologically, each group's items sorted internally
 */
export function groupByTimePeriod(
  items: DisplayItem[],
  now: Date = new Date()
): TimeGroup[] {
  console.log(`📊 [groupByTimePeriod] Grouping ${items.length} items`);

  const groupMap = new Map<string, { label: string; items: DisplayItem[] }>();
  const groupOrder: string[] = [];

  // Sort items by date first for correct grouping order
  const dateOrdered = [...items].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  for (const item of dateOrdered) {
    const label = getTimePeriodLabel(item.date, now);

    if (!groupMap.has(label)) {
      groupMap.set(label, { label, items: [] });
      groupOrder.push(label);
    }
    groupMap.get(label)!.items.push(item);
  }

  // Build final groups with internal sorting
  const groups: TimeGroup[] = groupOrder.map((label) => {
    const group = groupMap.get(label)!;
    return {
      label: group.label,
      dateKey: group.items[0]?.dateString ?? '',
      items: sortDisplayItems(group.items),
    };
  });

  console.log(
    `📊 [groupByTimePeriod] Created ${groups.length} groups: ` +
      groups.map((g) => `${g.label} (${g.items.length})`).join(', ')
  );

  return groups;
}

// ============================================================================
// CONVENIENCE: FULL PIPELINE
// ============================================================================

/**
 * Full transformation pipeline: raw data → grouped, sorted DisplayItems.
 *
 * Usage:
 * ```ts
 * const groups = buildTimeline(calendarEvents, emailEvents);
 * // → TimeGroup[] ready for SmartTimeline rendering
 * ```
 */
export function buildTimeline(
  calendarEvents: RawCalendarEvent[],
  emailEvents: RawEmailEvent[],
  now: Date = new Date()
): TimeGroup[] {
  const items = toDisplayItems(calendarEvents, emailEvents);
  return groupByTimePeriod(items, now);
}
