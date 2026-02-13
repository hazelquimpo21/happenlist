# Recurring Events Design & Implementation Plan

Design document and implementation plan for recurring event architecture: making events recurring, skip dates, event generation, and series attachment.

---

## 1. Audit: Current Recurrence Types

### What exists today

**Series types** (`series_type` enum): `class`, `camp`, `workshop`, `recurring`, `festival`, `season`

**Recurrence frequencies** (`recurrence_rule.frequency`): `daily`, `weekly`, `biweekly`, `monthly`, `yearly`

**Event modes** (submission flow): `single`, `existing_series`, `new_series`, `recurring`

**Event-to-series link**: `events.series_id` FK, `events.is_series_instance` bool, `events.series_sequence` int

### Issues found

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 1 | **`yearly` frequency is a ghost type** — declared in `RecurrenceRule` but absent from UI options and has no generation handler (falls to `default` warning in `calculateRecurringDates`) | `types.ts:962`, `series-limits.ts:236` | Low — dead code |
| 2 | **`biweekly` is redundant** — it's `weekly` + `interval: 2`. Creates special-case branching in generation and formatting code | `submit-event.ts:786`, `series.ts:427` | Medium — tech debt |
| 3 | **Eager-only generation, no replenishment** — events are batch-created at submission. `MIN_RECURRING_BUFFER` and `DEFAULT_GENERATION_WINDOW` constants exist but no code uses them for ongoing generation | `series-limits.ts:226-231` | High — recurring events stop after 12 weeks |
| 4 | **Stored `recurrence_rule` on series is write-only** — generation reads from `draftData.recurrence_rule`, not from the persisted series record. The stored rule can't be used to extend the series later | `submit-event.ts:182-213` | High — blocks replenishment |
| 5 | **No timezone in date calculation** — `calculateRecurringDates` uses `new Date()` without timezone. Server-dependent behavior near midnight | `submit-event.ts:741-848` | Medium — potential off-by-one dates |
| 6 | **`series_sequence` gaps and missing values** — cancelled events leave gaps; adding an event to an existing series via `createSingleEvent` doesn't set sequence | `submit-event.ts:382-440` | Low — cosmetic |

### Recommendation: simplify frequencies

Remove `biweekly` and `yearly` from the `RecurrenceRule.frequency` type. Model biweekly as `{ frequency: 'weekly', interval: 2 }`. This eliminates special-case code and makes interval the single knob for "every N weeks/months/days."

**Before:**
```
frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
```

**After:**
```
frequency: 'daily' | 'weekly' | 'monthly'
interval: number  // every N units (default 1, biweekly = weekly + interval 2)
```

The UI can still present a "Biweekly" option — it just sets `{ frequency: 'weekly', interval: 2 }` instead of a separate frequency value.

---

## 2. Making an Existing Event Recurring

### The problem

An admin scrapes or creates a single event — "Jazz Jam Night - March 5." Then realizes this actually happens every Wednesday. Today there's no way to convert it. You'd have to create a new recurring series from scratch and manually link or delete the original.

### Design: "Make Recurring" action

Any published or pending single event can be converted into a recurring series. The original event becomes the first instance.

**User flow:**

1. Admin views single event detail page (or superadmin toolbar)
2. Clicks "Make Recurring" action button
3. Recurrence configuration form appears with smart defaults:
   - **Frequency**: pre-filled from event's day of week (e.g., "Weekly" + "Wednesday")
   - **Time**: pre-filled from event's `start_datetime`
   - **Duration**: pre-filled from difference between `start_datetime` and `end_datetime`
   - **Ends**: defaults to "Never" (ongoing)
   - **Skip dates**: empty initially, can add dates to exclude
4. Preview panel shows next 8-12 generated dates
5. User confirms
6. System creates series + generates future events

**What happens under the hood:**

```
convertToRecurring(eventId, recurrenceRule):
  1. Read existing event
  2. Create series record:
     - title = event.title (without date suffix)
     - series_type = 'recurring'
     - recurrence_rule = the rule from the form
     - Copy: category_id, location_id, organizer_id, price fields, images, descriptions
     - attendance_mode = 'drop_in' (default for recurring)
     - status = event.status (inherit published/pending)
  3. Update original event:
     - series_id = new series ID
     - is_series_instance = true
     - series_sequence = 1
     - is_override = false (it matches the pattern)
  4. Generate future events from recurrence_rule:
     - Start from the NEXT occurrence after the original event's date
     - Use the recurrence module's generateDates()
     - Batch insert as pending_review (or published, matching series status)
  5. Update series dates:
     - start_date = original event's instance_date
     - end_date = last generated event's date
     - total_sessions = count of all events
     - generation_cursor_date = last generated date
  6. Return { seriesId, eventCount }
```

### Smart defaults for the recurrence form

| Event property | Pre-fills | Example |
|----------------|-----------|---------|
| Day of week from `start_datetime` | `frequency: 'weekly'`, `days_of_week: [3]` | Wednesday event → "Every Wednesday" |
| Time from `start_datetime` | `time: '19:00'` | 7pm start → time field shows "7:00 PM" |
| Duration from `end_datetime - start_datetime` | `duration_minutes: 120` | 7-9pm → "2 hours" |
| No end_datetime? | `duration_minutes: 120` | Default 2 hours |

---

## 3. Enhanced Recurrence Rule: Skip Dates & Patterns

### The problem

Real-world recurring events aren't perfectly regular. "Every Wednesday jazz jam" skips holidays. "Monthly book club" doesn't meet in December. A class takes a 2-week spring break.

### Design: exclude_dates + week_of_month

**Enhanced RecurrenceRule:**

```typescript
interface RecurrenceRule {
  // --- Existing fields ---
  /** How often: daily, weekly, monthly */
  frequency: 'daily' | 'weekly' | 'monthly';
  /** Every N frequency units. Default 1. Biweekly = weekly + interval 2. */
  interval: number;
  /** Which days of the week (0=Sun..6=Sat). For weekly/daily patterns. */
  days_of_week?: number[];
  /** Day of month (1-31) for monthly on a fixed date. */
  day_of_month?: number;
  /** Start time in HH:MM. */
  time?: string;
  /** Session length in minutes. */
  duration_minutes?: number;
  /** How recurrence ends: date, count, or never. */
  end_type: 'date' | 'count' | 'never';
  /** End date (YYYY-MM-DD) when end_type = 'date'. */
  end_date?: string;
  /** Occurrence count when end_type = 'count'. */
  end_count?: number;

  // --- New fields ---
  /** Dates to skip (YYYY-MM-DD). Event won't be generated on these dates. */
  exclude_dates?: string[];
  /** Week-of-month for monthly ordinal patterns (1=first, 2=second, ..., -1=last). */
  week_of_month?: number;
}
```

### Skip dates: how they work

`exclude_dates` is an array of ISO date strings. During generation, any date matching an entry is simply skipped.

**Example: weekly Wednesday jam, skip holidays:**
```json
{
  "frequency": "weekly",
  "interval": 1,
  "days_of_week": [3],
  "time": "19:00",
  "duration_minutes": 120,
  "end_type": "never",
  "exclude_dates": ["2026-11-25", "2026-12-24", "2026-12-31"]
}
```

**Example: biweekly book club, skip December:**
```json
{
  "frequency": "weekly",
  "interval": 2,
  "days_of_week": [6],
  "time": "14:00",
  "duration_minutes": 90,
  "end_type": "never",
  "exclude_dates": ["2026-12-06", "2026-12-20"]
}
```

**When someone cancels a single occurrence**, the cancelled event stays (status: `cancelled`) AND its date is added to `exclude_dates` on the series `recurrence_rule`. This prevents replenishment from recreating it.

### Monthly ordinal patterns: week_of_month

"First Friday Art Walk" and "Third Thursday Gallery Night" are real Milwaukee events. The current model can only do "monthly on the 15th" (`day_of_month`). Adding `week_of_month` enables ordinal patterns.

| `week_of_month` | `days_of_week` | Meaning |
|-----------------|----------------|---------|
| `1` | `[5]` | First Friday of every month |
| `3` | `[4]` | Third Thursday of every month |
| `-1` | `[0]` | Last Sunday of every month |
| `2` | `[6]` | Second Saturday of every month |

**Rule: if `week_of_month` is set, it takes priority over `day_of_month`.** They're mutually exclusive — the UI shows one or the other based on a toggle ("Same date each month" vs "Same weekday each month").

### UI for recurrence options

The recurrence form presents these as user-friendly choices:

```
Frequency:  [ Weekly ▼ ]   Every [ 1 ▼ ] week(s)

On:         ○ Sun  ● Mon  ○ Tue  ● Wed  ○ Thu  ○ Fri  ○ Sat

Time:       [ 7:00 PM ]   Duration: [ 2 hours ▼ ]

Ends:       ○ Never  ○ After [12] occurrences  ○ On [date picker]

Skip dates: [ + Add dates to skip ]
            ✕ Nov 25, 2026 (Thanksgiving)
            ✕ Dec 24, 2026 (Christmas Eve)
            ✕ Dec 31, 2026 (New Year's Eve)

Monthly:    ○ On the 15th  ● First Friday
```

---

## 4. Attaching a Single Event to a Recurring Series

### The problem

A user wants to submit a standalone event and say "this belongs to the Weekly Jazz Jam series." Today the `existing_series` event mode does this, but:
- The single event gets `series_id` set, but NOT `is_series_instance: true` or a meaningful `series_sequence`
- There's no validation that the event's date/time aligns with the series pattern
- The series `total_sessions` and `sessions_remaining` aren't updated

### Design: explicit attach with optional override

When attaching a single event to a recurring series:

1. **Set `is_series_instance: true`** — always, when `series_id` is non-null
2. **Auto-assign `series_sequence`** — query `MAX(series_sequence) WHERE series_id = X` and increment
3. **Allow date/time override** — the attached event does NOT need to match the recurrence pattern. Example: "Jazz Jam Special Holiday Edition" on a Saturday instead of the usual Wednesday
4. **Mark as override** — set `is_override = true`. Distinguishes "generated from pattern" vs "manually attached":
   - Replenishment won't delete/recreate override events
   - UI can badge them ("Special event")
5. **Update series counts** — increment `total_sessions` on the series

---

## 5. Event Generation Strategy & Performance

### Current approach: eager bulk insert at submission

At submission time, all events are generated in a single batch insert. For weekly recurring: 12 events. For a camp: up to 14. **This is fine for initial creation** — a single Supabase call, <100ms.

### The real problem: replenishment

A weekly event created today generates 12 weeks ahead. After that, the series goes dark. There's no mechanism to extend it.

### Recommended approach: hybrid (cron + on-read fallback)

**Primary: nightly cron** (Supabase Edge Function or pg_cron)
- Runs daily at 3am CT
- Scans all published recurring series
- For each: if upcoming event count < `MIN_RECURRING_BUFFER` (8), generate next `GENERATION_BATCH_SIZE` (12) events
- Reads `recurrence_rule` and `generation_cursor_date` from the series table
- Respects `exclude_dates` — skips any excluded dates during generation

**Fallback: on-read check** (series detail page)
- When loading a series detail page, check `upcoming_event_count`
- If < 2, trigger inline generation (same function, synchronous)
- Prevents visible gaps if cron is late or fails

**Performance:**
- Cron scanning 100 series: single SQL query to find low-buffer series, ~50ms
- Generating 12 events per series: batch insert, ~50-100ms each
- On-read check: `COUNT(*)` with index on `(series_id, instance_date)`, <5ms

### Buffer sizing

```
MIN_RECURRING_BUFFER = 8       // trigger replenishment at this threshold
GENERATION_BATCH_SIZE = 12     // events to generate per batch
MAX_GENERATION_PER_RUN = 52    // safety cap per series per run
```

### Critical fix: persist recurrence_rule on series

Currently `recurrence_rule` is passed through `draftData` during submission but not reliably stored on the series for recurring mode. The submission flow auto-creates a series for `event_mode === 'recurring'` but passes `recurringSeriesData` which doesn't include the rule. Fix: explicitly set `recurrence_rule` on the series during creation.

---

## 6. Multi-Day Events vs Series

### Decision framework

**Single event** (one row, `start_datetime` to `end_datetime` spans multiple days):
- Same structure/schedule each day
- One ticket for the whole thing
- People think of it as one thing
- Example: "Irish Fest — Aug 14-17"

**Festival series** (`series_type = 'festival'`, individual day-events):
- Different lineup/schedule per day
- Day-specific tickets
- People attend specific days
- Example: "Summerfest Day 1: Rock" / "Day 2: Jazz"

**The current model supports both.** No schema changes needed.

### Discoverability gap

Festival series only appear on `/series`, not `/events`. Proposed: surface series cards in the events feed using `series.start_date` for sort position. This is a query/display concern, not a schema change.

---

## 7. Implementation Plan

### Module Architecture

```
src/lib/recurrence/              ← NEW: Pure recurrence logic (no DB)
  index.ts                       Barrel exports
  types.ts                       Enhanced RecurrenceRule type
  generate.ts                    generateDates() — pure date generation
  validate.ts                    validateRule() — rule validation
  format.ts                      formatRule() — human-readable strings
  exclude.ts                     addExcludeDate(), removeExcludeDate()
  constants.ts                   Limits, buffer sizes, safety caps

src/data/series/                 ← EXISTING: Add new files
  convert-to-recurring.ts        NEW: Convert single event → recurring series
  replenish.ts                   NEW: Top up event buffer for recurring series
  attach-event.ts                NEW: Attach standalone event to series
  skip-date.ts                   NEW: Skip/unskip a single occurrence

src/components/recurrence/       ← NEW: Recurrence UI components
  RecurrenceForm.tsx             Full recurrence configuration form
  RecurrencePreview.tsx          Preview of next N generated dates
  ExcludeDatesEditor.tsx         Add/remove skip dates with date picker
  FrequencySelector.tsx          Daily/Weekly/Monthly with interval knob
  MonthlyPatternPicker.tsx       "On the 15th" vs "First Friday" toggle

supabase/migrations/             ← NEW: Migration for schema changes
  2026XXXX_recurring_enhancements.sql

supabase/functions/              ← NEW: Edge function for cron
  replenish-recurring/
    index.ts                     Nightly replenishment cron handler
```

### Phase 1: Core Recurrence Module — `src/lib/recurrence/`

**Goal:** Pure functions for date generation, validation, formatting. No DB calls. Fully testable. This is the foundation everything else builds on.

**Files to create:**

#### `src/lib/recurrence/types.ts`
```typescript
/**
 * RECURRENCE TYPES
 * ================
 * Enhanced recurrence rule with skip dates and monthly ordinal patterns.
 *
 * This is the TYPE definition only. The canonical DB type in
 * src/lib/supabase/types.ts should be updated to match.
 *
 * @module lib/recurrence/types
 */

/** Supported recurrence frequencies (simplified from original) */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

/** How a recurrence ends */
export type RecurrenceEndType = 'date' | 'count' | 'never';

/**
 * Enhanced recurrence rule.
 *
 * Changes from original:
 *   - Removed 'biweekly' (use weekly + interval: 2)
 *   - Removed 'yearly' (dead code, never implemented)
 *   - Added exclude_dates for skip dates
 *   - Added week_of_month for "First Friday" patterns
 */
export interface EnhancedRecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  days_of_week?: number[];
  day_of_month?: number;
  week_of_month?: number;    // 1-4 or -1 (last)
  time?: string;             // HH:MM
  duration_minutes?: number;
  end_type: RecurrenceEndType;
  end_date?: string;         // YYYY-MM-DD
  end_count?: number;
  exclude_dates?: string[];  // YYYY-MM-DD dates to skip
}
```

#### `src/lib/recurrence/generate.ts`
- `generateDates(rule, startFrom, options?)` — returns `string[]` of YYYY-MM-DD dates
- Handles: daily, weekly (with multi-day support), monthly (day_of_month OR week_of_month)
- Respects: `interval`, `end_type`, `exclude_dates`, safety caps
- Uses `date-fns` with explicit timezone (America/Chicago default)
- Every branch and edge case logged at debug level

#### `src/lib/recurrence/validate.ts`
- `validateRule(rule)` — returns `{ valid: boolean, errors: string[] }`
- Checks: frequency is valid, interval >= 1, days_of_week are 0-6, time is HH:MM, week_of_month is 1-4 or -1, exclude_dates are valid ISO dates, day_of_month and week_of_month are mutually exclusive

#### `src/lib/recurrence/format.ts`
- `formatRule(rule)` — returns human-readable string
- Examples: "Every Wednesday at 7:00 PM", "Every other Thursday at 6:30 PM", "First Friday of every month at 7:00 PM", "Daily at 9:00 AM"
- `formatExcludeDates(dates)` — "Skips Nov 25, Dec 24, Dec 31"

#### `src/lib/recurrence/exclude.ts`
- `addExcludeDate(rule, date)` — returns new rule with date added to exclude_dates
- `removeExcludeDate(rule, date)` — returns new rule with date removed
- `isDateExcluded(rule, date)` — boolean check
- All immutable — return new objects, never mutate

#### `src/lib/recurrence/constants.ts`
- `MIN_RECURRING_BUFFER = 8`
- `GENERATION_BATCH_SIZE = 12`
- `MAX_GENERATION_PER_RUN = 52`
- `DEFAULT_DURATION_MINUTES = 120`
- `DEFAULT_TIMEZONE = 'America/Chicago'`

#### `src/lib/recurrence/index.ts`
- Barrel exports for all public functions and types

### Phase 2: Schema Migration

**Goal:** Add new columns and update constraints.

```sql
-- ============================================================================
-- MIGRATION: Recurring events enhancements
-- ============================================================================
-- 1. Add is_override to events (distinguishes generated vs manually attached)
-- 2. Add generation tracking to series (last_generated_at, generation_cursor_date)
-- 3. Simplify recurrence_rule frequency values (remove biweekly/yearly)
-- 4. Add indexes for replenishment queries

-- Step 1: events.is_override
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_override boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN events.is_override IS
  'True if this event was manually attached to a series (not generated from '
  'the recurrence pattern). Override events are preserved during replenishment.';

-- Step 2: series generation tracking
ALTER TABLE series
  ADD COLUMN IF NOT EXISTS last_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS generation_cursor_date date;

COMMENT ON COLUMN series.last_generated_at IS
  'When events were last generated/replenished for this recurring series.';
COMMENT ON COLUMN series.generation_cursor_date IS
  'Last date through which events have been generated. '
  'Replenishment starts from the day after this.';

-- Step 3: Index for replenishment cron query
-- "Find recurring series with few upcoming events"
CREATE INDEX IF NOT EXISTS idx_series_recurring_replenish
  ON series (series_type, status)
  WHERE series_type = 'recurring' AND status = 'published';

-- Step 4: Index for counting upcoming events per series
CREATE INDEX IF NOT EXISTS idx_events_series_upcoming
  ON events (series_id, instance_date)
  WHERE deleted_at IS NULL AND status IN ('published', 'pending_review');
```

### Phase 3: Refactor Existing Generation

**Goal:** Replace inline date calculation in `submit-event.ts` with the recurrence module. Fix known issues.

**Changes to `src/data/submit/submit-event.ts`:**

1. **Import recurrence module** instead of inline `calculateRecurringDates` / `calculateDatesInRange`
2. **Delete** the inline functions: `calculateRecurringDates`, `calculateDatesInRange`, `addMinutesToTime`
3. **Replace** calls with `generateDates()` from the recurrence module
4. **Fix recurring series creation** — persist `recurrence_rule` on the series:
   ```typescript
   // In the recurring mode auto-series creation block (~line 115):
   const recurringSeriesData = {
     ...existingFields,
     recurrence_rule: draftData.recurrence_rule,  // <-- THIS WAS MISSING
   };
   ```
5. **Fix `createSingleEvent`** — when attaching to a series, assign sequence and set `is_series_instance`:
   ```typescript
   if (seriesId) {
     const nextSeq = await getNextSeriesSequence(supabase, seriesId);
     eventData.series_sequence = nextSeq;
     eventData.is_series_instance = true;
     eventData.is_override = true;
   }
   ```
6. **Handle `biweekly` backwards compatibility** — if any existing series have `frequency: 'biweekly'` in their `recurrence_rule`, the generation function normalizes it to `{ frequency: 'weekly', interval: 2 }` on read

**Changes to `src/lib/supabase/types.ts`:**
- Update `RecurrenceRule` interface to match enhanced version
- Keep `biweekly` in a deprecated union for read compatibility, log warning when encountered

**Changes to `src/types/series.ts`:**
- Update `formatRecurrence()` to use `recurrence/format.ts` module
- Remove inline recurrence formatting logic

### Phase 4: Convert Single Event to Recurring

**Goal:** The "Make Recurring" feature.

#### `src/data/series/convert-to-recurring.ts`

```typescript
/**
 * CONVERT TO RECURRING
 * ====================
 * Converts a standalone single event into a recurring series.
 *
 * The original event becomes the first instance. Future events are
 * generated from the provided recurrence rule.
 *
 * Flow:
 *   1. Validate: event exists, is standalone (no series_id), is not deleted
 *   2. Create series from event data + recurrence rule
 *   3. Update original event: attach to series as instance #1
 *   4. Generate future events from recurrence pattern
 *   5. Update series dates and counts
 *
 * @module data/series/convert-to-recurring
 */

export interface ConvertToRecurringParams {
  eventId: string;
  recurrenceRule: EnhancedRecurrenceRule;
  adminEmail: string;
}

export interface ConvertToRecurringResult {
  success: boolean;
  seriesId?: string;
  eventCount?: number;  // total including original
  error?: string;
}

export async function convertToRecurring(
  params: ConvertToRecurringParams
): Promise<ConvertToRecurringResult>
```

Detailed logging at every step: event read, series creation, event update, generation, series date update.

#### `src/app/api/events/[id]/make-recurring/route.ts`
- POST endpoint
- Auth: superadmin only
- Body: `{ recurrence_rule: RecurrenceRule }`
- Calls `convertToRecurring()`
- Returns: `{ seriesId, eventCount }`

#### UI: Button in superadmin toolbar + recurrence form modal
- Only shown for single events (no `series_id`)
- Opens `RecurrenceForm` component in a modal/drawer
- Shows `RecurrencePreview` with generated dates
- Confirm triggers API call

### Phase 5: Skip Dates / Exclusions

**Goal:** Allow cancelling individual occurrences and preventing regeneration.

#### `src/data/series/skip-date.ts`

```typescript
/**
 * SKIP DATE
 * =========
 * Manages excluded dates on a recurring series.
 *
 * When an admin cancels a single occurrence:
 *   1. The event's status changes to 'cancelled'
 *   2. The date is added to the series recurrence_rule.exclude_dates
 *   3. Future replenishment won't recreate an event for that date
 *
 * @module data/series/skip-date
 */

export async function skipDate(seriesId: string, date: string, adminEmail: string)
export async function unskipDate(seriesId: string, date: string, adminEmail: string)
export async function getExcludedDates(seriesId: string): Promise<string[]>
```

Each function:
- Reads the series `recurrence_rule` JSONB
- Uses `addExcludeDate()` / `removeExcludeDate()` from the recurrence module
- Writes back the updated rule
- Logs to `admin_audit_log`

#### API route
- POST `/api/series/[id]/skip-date` — body: `{ date, action: 'skip' | 'unskip' }`
- Superadmin auth

#### UI integration
- On series detail page, each event in the list shows a "Skip" action (dropdown or icon)
- Skipped dates shown with strikethrough + "Skipped" badge
- "Manage Skip Dates" link opens the `ExcludeDatesEditor` component

### Phase 6: Replenishment

**Goal:** Keep recurring series alive by generating future events automatically.

#### `src/data/series/replenish.ts`

```typescript
/**
 * REPLENISH RECURRING SERIES
 * ==========================
 * Generates upcoming events for recurring series that are running low.
 *
 * Called by:
 *   - Nightly cron (supabase/functions/replenish-recurring)
 *   - On-read fallback (series detail page, when upcoming < 2)
 *
 * For each qualifying series:
 *   1. Read recurrence_rule from series
 *   2. Find generation_cursor_date (or latest event's instance_date)
 *   3. Generate next GENERATION_BATCH_SIZE dates from cursor
 *   4. Skip exclude_dates
 *   5. Batch insert events
 *   6. Update series: generation_cursor_date, last_generated_at, total_sessions
 *
 * @module data/series/replenish
 */

/** Replenish a single series. Returns count of new events created. */
export async function replenishSeries(seriesId: string): Promise<number>

/** Replenish all published recurring series below buffer threshold. */
export async function replenishAllRecurringSeries(): Promise<{
  seriesProcessed: number;
  eventsCreated: number;
  errors: Array<{ seriesId: string; error: string }>;
}>
```

Logging: series ID, current upcoming count, events generated, dates range, any errors. Every series gets a log line.

#### `supabase/functions/replenish-recurring/index.ts`

Supabase Edge Function, triggered by cron schedule (daily 3am CT).

```typescript
/**
 * REPLENISH RECURRING — Supabase Edge Function
 * =============================================
 * Nightly cron that tops up event buffers for all recurring series.
 *
 * Schedule: 0 9 * * * (daily at 9am UTC = 3am CT)
 *
 * Calls replenishAllRecurringSeries() and logs summary.
 */
```

#### On-read fallback

In `src/data/series/get-series-detail.ts`, after fetching the series and its events:

```typescript
// If recurring series has very few upcoming events, replenish inline
if (series.series_type === 'recurring' && upcomingCount < 2) {
  logger.info(`Low buffer for series ${series.id}, triggering inline replenishment`);
  await replenishSeries(series.id);
  // Re-fetch events after replenishment
}
```

### Phase 7: Attach/Detach Events

**Goal:** Attach a standalone event to a series, or detach an event from its series.

#### `src/data/series/attach-event.ts`

```typescript
/**
 * ATTACH / DETACH EVENTS
 * ======================
 * Manage the relationship between events and series.
 *
 * Attach: links a standalone event to an existing series.
 *   - Sets series_id, is_series_instance, series_sequence
 *   - Marks as is_override = true (manually attached, not generated)
 *   - Increments series total_sessions
 *
 * Detach: removes an event from its series.
 *   - Clears series_id, is_series_instance, series_sequence, is_override
 *   - Decrements series total_sessions
 *
 * @module data/series/attach-event
 */

export async function attachToSeries(eventId: string, seriesId: string, adminEmail: string)
export async function detachFromSeries(eventId: string, adminEmail: string)
```

#### API routes
- POST `/api/events/[id]/attach` — body: `{ series_id }`
- POST `/api/events/[id]/detach`

---

## 8. Implementation Order & Dependencies

```
Phase 1: Core Recurrence Module          (no dependencies, pure functions)
  │
  ├──► Phase 2: Schema Migration         (no code dependencies)
  │
  └──► Phase 3: Refactor Generation      (depends on Phase 1)
         │
         ├──► Phase 4: Make Recurring    (depends on Phase 1, 2, 3)
         │
         ├──► Phase 5: Skip Dates        (depends on Phase 1, 2)
         │
         ├──► Phase 6: Replenishment     (depends on Phase 1, 2, 3)
         │
         └──► Phase 7: Attach/Detach     (depends on Phase 2)
```

**Phases 4-7 are independent of each other** — can be built in any order after Phase 3.

### Estimated scope per phase

| Phase | New files | Modified files | Effort |
|-------|-----------|----------------|--------|
| 1. Core module | 7 | 0 | Medium — most critical, foundation |
| 2. Schema migration | 1 | 0 | Small — SQL only |
| 3. Refactor generation | 0 | 3 | Medium — careful replacement |
| 4. Make recurring | 3 | 2 | Medium — new feature + UI |
| 5. Skip dates | 2 | 2 | Small-Medium |
| 6. Replenishment | 2 | 1 | Medium — cron setup |
| 7. Attach/detach | 2 | 1 | Small |

### Code standards for all phases

- **Logging:** Use `createLogger('ModuleName')` for every new file. Log at info level for operations, debug for details, warn for recoverable issues, error for failures. Emoji-prefix style consistent with codebase.
- **Comments:** JSDoc header on every file with module description. JSDoc on every exported function. Inline comments for non-obvious logic (especially date math).
- **Barrel exports:** Every new directory gets an `index.ts` with documented exports.
- **Naming:** kebab-case files, camelCase functions, PascalCase types. Prefix data functions with action: `convert-to-recurring.ts`, `replenish.ts`.
- **Error handling:** Every async function returns `{ success, error? }` pattern. Never throw from data functions.

---

## 9. Schema Changes Summary

### events table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `is_override` | boolean | `false` | True = manually attached to series (not generated from recurrence pattern). Override events are preserved during replenishment. |

### series table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `last_generated_at` | timestamptz | null | When events were last generated/replenished for this recurring series. |
| `generation_cursor_date` | date | null | Last date through which events have been generated. Replenishment continues from the day after. |

### recurrence_rule JSONB (on series)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `frequency` | text | **yes** | `daily`, `weekly`, `monthly`. (**Changed:** removed `biweekly` and `yearly`.) |
| `interval` | integer | **yes** | Every N frequency units. Default: 1. Biweekly = `{ frequency: 'weekly', interval: 2 }`. |
| `days_of_week` | integer[] | no | Which days (0=Sun..6=Sat). For weekly patterns. Example: `[3]` = Wednesday. |
| `day_of_month` | integer | no | For monthly on a fixed date (1-31). Mutually exclusive with `week_of_month`. |
| `week_of_month` | integer | no | **New.** For monthly ordinal patterns (1=first, 2=second, 3=third, 4=fourth, -1=last). Use with `days_of_week`. Example: `week_of_month: 1, days_of_week: [5]` = "First Friday." |
| `time` | text | no | Start time in HH:MM. Example: `"19:00"`. |
| `duration_minutes` | integer | no | Session length in minutes. Example: `120`. |
| `end_type` | text | **yes** | `date`, `count`, or `never`. |
| `end_date` | text | no | YYYY-MM-DD. Stop generating after this date. Used when `end_type = 'date'`. |
| `end_count` | integer | no | Stop after N occurrences. Used when `end_type = 'count'`. |
| `exclude_dates` | text[] | no | **New.** Array of YYYY-MM-DD dates to skip. Events won't be generated on these dates. Populated manually via "Skip" action or when cancelling a single occurrence. |

### New API routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/events/[id]/make-recurring` | POST | Superadmin | Convert single event to recurring series |
| `/api/events/[id]/attach` | POST | Superadmin | Attach event to existing series |
| `/api/events/[id]/detach` | POST | Superadmin | Detach event from series |
| `/api/series/[id]/skip-date` | POST | Superadmin | Add/remove a skip date |
| `/api/series/[id]/replenish` | POST | Superadmin | Manually trigger replenishment |

---

## 10. Open Questions

1. **Should "Make Recurring" inherit the original event's status?** If the original is `published`, should generated events also be `published` (skipping review)? Probably yes for admin-initiated conversions — they're trusted.

2. **Replenishment: published only or pending_review too?** If a recurring series is still in review, should we generate future events? Probably not until the series is published.

3. **Series in event feed:** Do we want festivals/series to appear in the main `/events` feed for discoverability? Currently only on `/series`.

4. **Cancelling a single occurrence vs the whole series:** Cancelling one event should add to `exclude_dates`. Cancelling the series should set `series.status = 'cancelled'` and stop replenishment. Both paths need clear UX.

5. **Scraper creating recurring events:** Should the scraper API support creating recurring events directly? Today it creates single events. Could add an optional `recurrence_rule` field that triggers `convertToRecurring` logic.

---

## 11. Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/recurrence/` | Core recurrence module (pure functions) |
| `src/lib/recurrence/generate.ts` | Date generation from rules |
| `src/lib/recurrence/types.ts` | Enhanced RecurrenceRule type |
| `src/data/series/convert-to-recurring.ts` | Make Recurring feature |
| `src/data/series/replenish.ts` | Event buffer replenishment |
| `src/data/series/attach-event.ts` | Attach/detach events to series |
| `src/data/series/skip-date.ts` | Skip date management |
| `src/data/submit/submit-event.ts` | Event submission (refactored) |
| `src/components/recurrence/` | Recurrence UI components |
| `supabase/functions/replenish-recurring/` | Nightly cron edge function |
| `src/lib/supabase/types.ts` | Canonical DB types (updated) |
| `src/lib/constants/series-limits.ts` | Recurrence constants (updated) |
