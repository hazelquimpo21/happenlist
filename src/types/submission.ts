/**
 * SUBMISSION TYPES
 * ================
 * Type definitions for the event submission flow.
 *
 * These types define:
 *   - Event statuses and their transitions
 *   - Draft data structures
 *   - Form step configurations
 *   - Recurrence patterns for series
 *   - Admin queue items
 *
 * @module types/submission
 */

// ============================================================================
// EVENT STATUS TYPES
// ============================================================================

/**
 * All possible event status values
 *
 * State machine transitions:
 *   draft -> pending_review (user submits)
 *   pending_review -> published | changes_requested | rejected (admin)
 *   changes_requested -> pending_review (user resubmits)
 *   published -> cancelled | postponed (admin)
 *   postponed -> published (admin reschedules)
 */
export type EventStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'published'
  | 'rejected'
  | 'cancelled'
  | 'postponed';

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
 * Event pricing model
 */
export type PriceType = 'free' | 'fixed' | 'range' | 'varies' | 'donation';

/**
 * Labels for price types
 */
export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  free: 'Free',
  fixed: 'Fixed Price',
  range: 'Price Range',
  varies: 'Prices Vary',
  donation: 'Pay What You Can',
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

  // Step 5: Pricing
  price_type?: PriceType;
  price_low?: number;
  price_high?: number;
  price_details?: string;
  is_free?: boolean;
  ticket_url?: string;

  // Step 6: Media
  image_url?: string;
  thumbnail_url?: string;

  // Step 7: Additional
  organizer_id?: string;
  website_url?: string;

  // Metadata
  source?: 'user_submission';
}

/**
 * Data for creating a new series alongside an event
 */
export interface NewSeriesData {
  title: string;
  series_type: string;
  description?: string;
  short_description?: string;
  total_sessions?: number;
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
}

// ============================================================================
// RECURRENCE TYPES
// ============================================================================

/**
 * Frequency of recurring events
 */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

/**
 * How the recurrence ends
 */
export type RecurrenceEndType = 'date' | 'count' | 'never';

/**
 * Complete recurrence rule for generating events
 */
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // e.g., every 2 weeks
  days_of_week?: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  day_of_month?: number; // For monthly on specific day
  time: string; // "19:00" format
  duration_minutes: number;
  end_type: RecurrenceEndType;
  end_date?: string; // YYYY-MM-DD
  end_count?: number;
}

/**
 * Day of week labels
 */
export const DAY_OF_WEEK_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/**
 * Short day labels for compact display
 */
export const DAY_OF_WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// ============================================================================
// SERIES DRAFT DATA
// ============================================================================

/**
 * Data for creating a new series (complete)
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
