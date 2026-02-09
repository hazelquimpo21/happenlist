/**
 * SUBMISSION TYPES
 * ================
 * Type definitions for the event submission flow.
 *
 * These types define:
 *   - Draft data structures
 *   - Form step configurations
 *   - Recurrence patterns for series
 *   - Admin queue items
 *
 * NOTE: Shared enums (EventStatus, PriceType, RecurrenceRule, etc.) are
 * defined canonically in `@/lib/supabase/types` and re-exported here
 * for convenience. Do NOT redefine them in this file.
 *
 * @module types/submission
 */

import type {
  EventStatus,
  PriceType,
  RecurrenceRule,
  AttendanceMode,
  SkillLevel,
} from '@/lib/supabase/types';

// Re-export shared types so existing imports still work
export type { EventStatus, PriceType, RecurrenceRule, AttendanceMode, SkillLevel };

// ============================================================================
// EVENT STATUS DISPLAY
// ============================================================================

/**
 * Human-readable status labels with emoji
 */
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: '📝 Draft',
  pending_review: '⏳ Pending Review',
  changes_requested: '✏️ Changes Requested',
  published: '✅ Published',
  rejected: '🚫 Rejected',
  cancelled: '❌ Cancelled',
  postponed: '⏸️ Postponed',
};

/**
 * Status badge colors for UI
 */
export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_review: 'bg-yellow-100 text-yellow-800',
  changes_requested: 'bg-orange-100 text-orange-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-50 text-red-600',
  postponed: 'bg-blue-100 text-blue-800',
};

// ============================================================================
// EVENT MODE TYPES
// ============================================================================

/**
 * Event creation mode - determines form behavior
 */
export type EventMode = 'single' | 'existing_series' | 'new_series' | 'recurring';

/**
 * Labels for event modes
 */
export const EVENT_MODE_LABELS: Record<EventMode, { title: string; description: string }> = {
  single: {
    title: 'Single Event',
    description: 'A one-time event on a specific date',
  },
  existing_series: {
    title: 'Part of Existing Series',
    description: 'Add this event to a series that already exists',
  },
  new_series: {
    title: 'Start a New Series',
    description: 'Create a class, camp, workshop, or festival',
  },
  recurring: {
    title: 'Recurring Event',
    description: 'Repeats weekly, biweekly, or monthly',
  },
};

// ============================================================================
// LOCATION MODE TYPES
// ============================================================================

/**
 * How the user specifies location
 */
export type LocationMode = 'existing' | 'new' | 'online' | 'tbd';

/**
 * Labels for location modes
 */
export const LOCATION_MODE_LABELS: Record<LocationMode, { title: string; description: string }> = {
  existing: {
    title: 'Select Existing Venue',
    description: 'Choose from venues already in our database',
  },
  new: {
    title: 'Add New Venue',
    description: "Enter venue details if it's not in our list",
  },
  online: {
    title: 'Online Event',
    description: 'This is a virtual/online event',
  },
  tbd: {
    title: 'Location TBD',
    description: 'Location will be announced later',
  },
};

// ============================================================================
// PRICE TYPES
// ============================================================================

/**
 * Labels for price types (PriceType is imported from @/lib/supabase/types)
 */
export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  free: 'Free',
  fixed: 'Fixed Price',
  range: 'Price Range',
  varies: 'Prices Vary',
  donation: 'Pay What You Can',
  per_session: 'Per Session',
};

// ============================================================================
// DRAFT DATA TYPES
// ============================================================================

/**
 * Draft data structure stored as JSONB
 * All fields are optional since user can save at any step
 */
export interface EventDraftData {
  // Step 1: Basic Info
  title?: string;
  description?: string;
  short_description?: string;
  category_id?: string;

  // Step 2: Event Type/Mode
  event_mode?: EventMode;
  series_id?: string;
  new_series?: NewSeriesData;
  recurrence_rule?: RecurrenceRule;

  // Step 3: Date/Time
  start_datetime?: string; // ISO string
  end_datetime?: string;
  instance_date?: string; // YYYY-MM-DD
  is_all_day?: boolean;
  timezone?: string;
  additional_dates?: string[]; // For multi-session manual selection

  // Step 4: Location
  location_mode?: LocationMode;
  location_id?: string;
  new_location?: NewLocationData;

  // Step 5: Pricing & Links
  price_type?: PriceType;
  price_low?: number;
  price_high?: number;
  price_details?: string;
  is_free?: boolean;
  ticket_url?: string;
  // External links (added 2026-01-06)
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  registration_url?: string;

  // Step 6: Media
  image_url?: string;
  thumbnail_url?: string;

  // Step 7: Additional
  organizer_id?: string;

  // Metadata
  source?: 'user_submission';
}

/**
 * Data for creating a new series alongside an event.
 * This is the minimal version collected in the "New Series" section of Step 2.
 */
export interface NewSeriesData {
  title: string;
  series_type: string;
  description?: string;
  short_description?: string;
  total_sessions?: number;

  // -- Camps/classes enhancements (Phase: camps-classes-series) --

  /** How participants attend: must register, can drop in, or both */
  attendance_mode?: AttendanceMode;
  /** Minimum age for participants */
  age_low?: number;
  /** Maximum age for participants */
  age_high?: number;
  /** Human-readable age details (e.g., "Must be potty-trained") */
  age_details?: string;
  /** Skill level, primarily for classes */
  skill_level?: SkillLevel;
}

/**
 * Data for creating a new location/venue
 */
export interface NewLocationData {
  name: string;
  address_line?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country?: string;
  venue_type?: string;
  /** Latitude from Mapbox geocoding */
  latitude?: number;
  /** Longitude from Mapbox geocoding */
  longitude?: number;
}

// ============================================================================
// RECURRENCE FORM TYPES
// ============================================================================

// RecurrenceRule is imported from @/lib/supabase/types (DB shape, all optional).
// RecurrenceFrequency and RecurrenceEndType are derived from RecurrenceRule.

/** Frequency values extracted from RecurrenceRule for convenience */
export type RecurrenceFrequency = RecurrenceRule['frequency'];

/** End type values for recurrence rules */
export type RecurrenceEndType = NonNullable<RecurrenceRule['end_type']>;

/**
 * Stricter version of RecurrenceRule used in the submission form.
 * The DB version has most fields optional (nullable JSONB). The form
 * requires these fields before submission is allowed.
 */
export interface RecurrenceRuleFormData {
  frequency: RecurrenceFrequency;
  /** Repeat every N frequency units (e.g., every 2 weeks). Required in form. */
  interval: number;
  days_of_week?: number[];
  day_of_month?: number;
  /** Start time in HH:MM format. Required in form. */
  time: string;
  /** Duration of each session in minutes. Required in form. */
  duration_minutes: number;
  /** How the recurrence ends. Required in form. */
  end_type: RecurrenceEndType;
  end_date?: string;
  end_count?: number;
}

// Day-of-week labels are defined canonically in @/types/series.ts.
// Re-exported here so existing imports from '@/types/submission' still work.
export { DAY_OF_WEEK_LABELS, DAY_OF_WEEK_SHORT } from '@/types/series';

// ============================================================================
// SERIES DRAFT DATA
// ============================================================================

/**
 * Complete data for creating a new series.
 * This is the full version used when submitting a series + events.
 */
export interface SeriesDraftData {
  title: string;
  series_type: string;
  description?: string;
  short_description?: string;
  total_sessions?: number;
  price_type?: PriceType;
  price_low?: number;
  price_high?: number;
  is_free?: boolean;
  registration_url?: string;
  category_id?: string;
  location_id?: string;
  organizer_id?: string;
  image_url?: string;

  // -- Camps/classes enhancements (Phase: camps-classes-series) --

  /** How participants attend: must register, can drop in, or both */
  attendance_mode?: AttendanceMode;
  /** Drop-in / single-session price (null = no drop-in option) */
  per_session_price?: number;
  /** Separate materials/supply fee (null = none) */
  materials_fee?: number;
  /** Human-readable pricing notes (early bird, sibling discount, etc.) */
  pricing_notes?: string;

  /** Core program start time, HH:MM (e.g., "09:00") */
  core_start_time?: string;
  /** Core program end time, HH:MM (e.g., "15:00") */
  core_end_time?: string;
  /** Before-care / early drop-off start time, HH:MM (e.g., "07:30") */
  extended_start_time?: string;
  /** After-care / late pickup end time, HH:MM (e.g., "17:30") */
  extended_end_time?: string;
  /** Human-readable care options & pricing */
  extended_care_details?: string;

  /** Minimum age for participants */
  age_low?: number;
  /** Maximum age for participants */
  age_high?: number;
  /** Human-readable age details (e.g., "Must be potty-trained") */
  age_details?: string;
  /** Skill level, primarily for classes */
  skill_level?: SkillLevel;

  /** Which days of the week (0=Sun, 1=Mon, ..., 6=Sat) -- for camps: [1,2,3,4,5] = Mon-Fri */
  days_of_week?: number[];
  /** Semester/term grouping label (e.g., "Fall 2026", "Summer Session A") */
  term_name?: string;
}

// ============================================================================
// DRAFT RECORD TYPE
// ============================================================================

/**
 * Full draft record from database
 */
export interface EventDraft {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  draft_data: EventDraftData;
  series_draft_data: SeriesDraftData | null;
  current_step: number;
  completed_steps: number[];
  submitted_event_id: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

// ============================================================================
// FORM STEP TYPES
// ============================================================================

/**
 * Form step configuration
 */
export interface FormStep {
  id: number;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  required: boolean;
}

/**
 * All form steps in order
 */
export const FORM_STEPS: FormStep[] = [
  {
    id: 1,
    name: 'Basic Info',
    description: 'Title, description, and category',
    icon: 'FileText',
    required: true,
  },
  {
    id: 2,
    name: 'Event Type',
    description: 'Single, series, or recurring',
    icon: 'Layers',
    required: true,
  },
  {
    id: 3,
    name: 'Date & Time',
    description: 'When does it happen?',
    icon: 'Calendar',
    required: true,
  },
  {
    id: 4,
    name: 'Location',
    description: 'Where does it happen?',
    icon: 'MapPin',
    required: true,
  },
  {
    id: 5,
    name: 'Pricing',
    description: 'Cost and ticket info',
    icon: 'Ticket',
    required: true,
  },
  {
    id: 6,
    name: 'Image',
    description: 'Event image (optional)',
    icon: 'Image',
    required: false,
  },
  {
    id: 7,
    name: 'Review',
    description: 'Review and submit',
    icon: 'CheckCircle',
    required: true,
  },
];

// ============================================================================
// ADMIN QUEUE TYPES
// ============================================================================

/**
 * Event in admin submission queue
 */
export interface SubmissionQueueItem {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  instance_date: string;
  start_datetime: string;
  end_datetime: string | null;
  image_url: string | null;
  description: string | null;
  short_description: string | null;
  submitted_at: string | null;
  submitted_by_email: string | null;
  submitted_by_name: string | null;
  source: string | null;
  source_url: string | null;
  created_at: string;
  price_type: string | null;
  price_low: number | null;
  price_high: number | null;
  is_free: boolean;
  ticket_url: string | null;
  change_request_message: string | null;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  location_id: string | null;
  location_name: string | null;
  location_city: string | null;
  location_address: string | null;
  organizer_id: string | null;
  organizer_name: string | null;
  series_id: string | null;
  series_title: string | null;
  series_type: string | null;
  submitter_approved_count: number;
  submitter_total_count: number;
}

/**
 * User's submitted event (for my-submissions page)
 */
export interface MySubmission {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  instance_date: string;
  start_datetime: string;
  end_datetime: string | null;
  image_url: string | null;
  description: string | null;
  short_description: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  change_request_message: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  price_type: string | null;
  price_low: number | null;
  price_high: number | null;
  is_free: boolean;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  location_id: string | null;
  location_name: string | null;
  location_city: string | null;
  location_address: string | null;
  series_id: string | null;
  series_title: string | null;
  series_slug: string | null;
  series_type: string | null;
}

// ============================================================================
// ACTION PARAMS TYPES
// ============================================================================

/**
 * Parameters for approving an event
 */
export interface ApproveEventParams {
  event_id: string;
  admin_email: string;
  notes?: string;
}

/**
 * Parameters for rejecting an event
 */
export interface RejectEventParams {
  event_id: string;
  admin_email: string;
  reason: string;
  notes?: string;
}

/**
 * Parameters for requesting changes
 */
export interface RequestChangesParams {
  event_id: string;
  admin_email: string;
  message: string;
  notes?: string;
}

/**
 * Parameters for soft deleting an event
 */
export interface SoftDeleteParams {
  event_id: string;
  deleted_by: string;
  reason?: string;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validation result for a form step
 */
export interface StepValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validate step 1: Basic Info
 */
export function validateStep1(data: EventDraftData): StepValidation {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('Title is required');
  } else if (data.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  } else if (data.title.length > 100) {
    errors.push('Title must be 100 characters or less');
  }

  if (!data.category_id) {
    errors.push('Category is required');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate step 2: Event Type
 */
export function validateStep2(data: EventDraftData): StepValidation {
  const errors: string[] = [];

  if (!data.event_mode) {
    errors.push('Please select an event type');
  }

  if (data.event_mode === 'existing_series' && !data.series_id) {
    errors.push('Please select a series');
  }

  if (data.event_mode === 'new_series' && !data.new_series?.title) {
    errors.push('Series title is required');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate step 3: Date & Time
 */
export function validateStep3(data: EventDraftData): StepValidation {
  const errors: string[] = [];

  if (!data.start_datetime) {
    errors.push('Start date and time is required');
  } else {
    const startDate = new Date(data.start_datetime);
    const now = new Date();

    if (startDate < now) {
      errors.push('Event cannot be in the past');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate step 4: Location
 */
export function validateStep4(data: EventDraftData): StepValidation {
  const errors: string[] = [];

  if (!data.location_mode) {
    errors.push('Please select a location type');
  }

  if (data.location_mode === 'existing' && !data.location_id) {
    errors.push('Please select a venue');
  }

  if (data.location_mode === 'new') {
    if (!data.new_location?.name) {
      errors.push('Venue name is required');
    }
    if (!data.new_location?.city) {
      errors.push('City is required');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate step 5: Pricing
 */
export function validateStep5(data: EventDraftData): StepValidation {
  const errors: string[] = [];

  if (!data.price_type) {
    errors.push('Please select a pricing type');
  }

  if (data.price_type === 'fixed' && data.price_low === undefined) {
    errors.push('Please enter the ticket price');
  }

  if (data.price_type === 'range') {
    if (data.price_low === undefined) {
      errors.push('Please enter the minimum price');
    }
    if (data.price_high === undefined) {
      errors.push('Please enter the maximum price');
    }
    if (
      data.price_low !== undefined &&
      data.price_high !== undefined &&
      data.price_low > data.price_high
    ) {
      errors.push('Minimum price cannot be greater than maximum');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate all required steps
 */
export function validateAllSteps(data: EventDraftData): {
  valid: boolean;
  stepErrors: Record<number, string[]>;
} {
  const stepErrors: Record<number, string[]> = {};

  const step1 = validateStep1(data);
  if (!step1.valid) stepErrors[1] = step1.errors;

  const step2 = validateStep2(data);
  if (!step2.valid) stepErrors[2] = step2.errors;

  const step3 = validateStep3(data);
  if (!step3.valid) stepErrors[3] = step3.errors;

  const step4 = validateStep4(data);
  if (!step4.valid) stepErrors[4] = step4.errors;

  const step5 = validateStep5(data);
  if (!step5.valid) stepErrors[5] = step5.errors;

  return {
    valid: Object.keys(stepErrors).length === 0,
    stepErrors,
  };
}
