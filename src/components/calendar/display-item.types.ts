/**
 * DISPLAY ITEM TYPES
 * ==================
 * View-model types for the unified calendar timeline.
 *
 * DisplayItem is the single type rendered by SmartTimeline. It normalizes
 * data from Google Calendar events and AI-extracted email events into a
 * four-category system that maps to how users actually think:
 *
 *   schedule       — Confirmed calendar commitments. Facts.
 *   recommendation — AI-recommended events worth attention. Context-rich.
 *   date           — Extracted time-bound info: deadlines, birthdays, payments.
 *   low-signal     — Low-confidence detections the AI isn't sure about.
 */

// ============================================================================
// DISPLAY CATEGORIES
// ============================================================================

/**
 * The four display categories. Each drives distinct visual treatment,
 * action buttons, and ordering within a time group.
 */
export type DisplayCategory =
  | 'schedule'
  | 'recommendation'
  | 'date'
  | 'low-signal';

// ============================================================================
// COMMITMENT LEVELS
// ============================================================================

/**
 * How committed the user is to this item. Drives which action buttons
 * appear (e.g. invited → "Decline" vs. suggested → "Not for me").
 */
export type CommitmentLevel =
  | 'confirmed'
  | 'invited'
  | 'suggested'
  | 'fyi';

// ============================================================================
// DISPLAY ACTIONS
// ============================================================================

/** Action types available across all display categories. */
export type DisplayActionType =
  | 'open-external'
  | 'join-meeting'
  | 'create-task'
  | 'save-to-calendar'
  | 'not-for-me'
  | 'maybe-later'
  | 'done'
  | 'snooze'
  | 'dismiss'
  | 'save';

/**
 * A computed action button rendered on a DisplayItem card.
 * Actions are derived from displayCategory + commitmentLevel.
 */
export interface DisplayAction {
  /** Button label shown to the user. */
  label: string;

  /** Visual weight: primary (filled), secondary (outlined), tertiary (text). */
  type: 'primary' | 'secondary' | 'tertiary';

  /** What happens when clicked. */
  action: DisplayActionType;

  /** External URL for open-external and join-meeting actions. */
  url?: string;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Event types that map to 'recommendation' displayCategory.
 * These are things you ATTEND.
 */
export const RECOMMENDATION_EVENT_TYPES = [
  'meeting',
  'social',
  'webinar',
  'conference',
  'community',
  'workshop',
  'class',
  'performance',
  'sports',
  'networking',
  'fundraiser',
] as const;

export type RecommendationEventType = (typeof RECOMMENDATION_EVENT_TYPES)[number];

/**
 * Event types that map to 'date' displayCategory.
 * These are time-bound info items, not events you attend.
 */
export const DATE_EVENT_TYPES = [
  'deadline',
  'payment_due',
  'birthday',
  'anniversary',
  'expiration',
  'appointment',
  'follow_up',
  'reminder',
  'recurring',
] as const;

export type DateEventType = (typeof DATE_EVENT_TYPES)[number];

// ============================================================================
// DATA SOURCES
// ============================================================================

/** Where this item originated. */
export type DisplayItemSource = 'google_calendar' | 'email_extracted';

// ============================================================================
// DISPLAY ITEM
// ============================================================================

/**
 * The unified view model for every item in the calendar timeline.
 *
 * This is the ONLY type that rendering components consume. Raw API data
 * from Google Calendar and email extraction is mapped into this shape
 * by `toDisplayItems()` in smart-timeline.utils.ts.
 */
export interface DisplayItem {
  /** Unique identifier. */
  id: string;

  /** Display title. */
  title: string;

  /** Parsed Date object for sorting and grouping. */
  date: Date;

  /** ISO date string (YYYY-MM-DD) for grouping into time periods. */
  dateString: string;

  /** Formatted start time (e.g. "7:00 PM"). Undefined for all-day items. */
  time?: string;

  /** Formatted end time. */
  endTime?: string;

  // --------------------------------------------------------------------------
  // THE KEY FIELD — what kind of thing is this?
  // --------------------------------------------------------------------------

  /** Which of the four display categories this item belongs to. */
  displayCategory: DisplayCategory;

  /**
   * Specific event type within the category.
   * - For recommendations: meeting, social, webinar, etc.
   * - For dates: deadline, birthday, payment_due, etc.
   * - For schedule: the Google Calendar event type or 'calendar_event'.
   * - For low-signal: whatever the AI detected.
   */
  eventType: string;

  /**
   * Commitment level — drives action buttons.
   * Null for schedule items (always confirmed) and some low-signal items.
   */
  commitmentLevel: CommitmentLevel | null;

  /**
   * The AI's personalized explanation of why this was recommended.
   * Only present for recommendation items. This is generated by the
   * 6-signal composite weight algorithm.
   */
  whyAttend?: string;

  /**
   * Always-visible context line. Varies by category:
   * - schedule: "From your calendar" or "From your calendar · Meeting link available"
   * - recommendation: whyAttend text or "Invited · from email by Crossroads MKE"
   * - date: "Found in email: Invoice #4521 from Vercel"
   * - low-signal: "Low confidence · from newsletters@example.com"
   */
  contextLine: string;

  // --------------------------------------------------------------------------
  // Source tracking
  // --------------------------------------------------------------------------

  /** Where this item came from. */
  source: DisplayItemSource;

  /** Email sender display name or address (email_extracted items only). */
  sourceEmailSender?: string;

  /** Email subject line (email_extracted items only). */
  sourceEmailSubject?: string;

  // --------------------------------------------------------------------------
  // Computed actions
  // --------------------------------------------------------------------------

  /**
   * Action buttons computed from displayCategory + commitmentLevel.
   * Ordered: primary first, then secondary, then tertiary.
   */
  actions: DisplayAction[];

  // --------------------------------------------------------------------------
  // Pass-through fields
  // --------------------------------------------------------------------------

  /** Physical location or venue name. */
  location?: string;

  /** Full description or body text. */
  description?: string;

  /** Short summary (for email-extracted items). */
  summary?: string;

  /** Whether a date-type item is past its deadline. */
  isOverdue: boolean;

  /** Google Calendar web link. */
  gcalHtmlLink?: string;

  /** Google Meet / Hangouts join link. */
  hangoutLink?: string;

  /** User's RSVP response on Google Calendar. */
  selfResponse?: string;

  /** External RSVP URL (Eventbrite, etc.). */
  rsvpUrl?: string;

  /** RSVP deadline date string. */
  rsvpDeadline?: string;

  /** Birthday detection flag. */
  isBirthday?: boolean;

  /** Name of the person whose birthday it is. */
  birthdayPersonName?: string;

  /** Calculated age (if birth year was detected). */
  birthdayAge?: number;

  /** Whether user has acknowledged/dismissed this item. */
  isAcknowledged: boolean;

  /** AI composite weight score (0-1). Used for ordering recommendations. */
  compositeWeight?: number;

  /** Google Calendar color hex for schedule items. */
  calendarColor?: string;
}

// ============================================================================
// TIME PERIOD GROUPING
// ============================================================================

/**
 * A group of DisplayItems sharing the same time period
 * (e.g. "Today", "Tomorrow", "This Weekend", "Next Week").
 */
export interface TimeGroup {
  /** Human-readable label for the group. */
  label: string;

  /** ISO date string of the group's start date. */
  dateKey: string;

  /** Items in this group, already sorted by category priority then time. */
  items: DisplayItem[];
}
