# Plan: Camps, Classes & Series Enhancements

> Design plan for robust support of classes, camps, and multi-session offerings.

---

## Current State

The series system already handles:
- Series types: `class`, `camp`, `workshop`, `recurring`, `festival`, `season`
- 1:N relationship: Series → Events (via `series_id`, `series_sequence`)
- Basic recurrence rules (daily, weekly, biweekly, monthly, yearly)
- Registration fields: `registration_required`, `registration_url`, `capacity`, `waitlist_enabled`
- Pricing: `price_type`, `price_low`, `price_high`, `is_free` on both series and events

What's missing for real-world camps/classes is covered below.

---

## Real-World Scenarios

### Camps

**Basic camp**: "Summer Art Camp", Mon-Fri, 9am-3pm, ages 6-12, $250/week

**Camp with care options**: Same camp but:
- Before care available: 7:30am-9am (+$25/week)
- After care available: 3pm-5:30pm (+$50/week)
- Some families use both, some neither

**Multi-week camp program**: Org offers same camp 6 different weeks over summer:
- Session 1: June 2-6 (Space Theme)
- Session 2: June 9-13 (Ocean Theme)
- Session 3: June 16-20 (Dinosaur Theme)
- Each week is standalone, but they're all "Summer Art Camp"

**Half-day camps**: Morning session (9am-12pm) or Afternoon session (1pm-4pm)

### Classes

**Multi-week class**: "Pottery 101", 8 Tuesdays, 7-9pm, $160 for the series

**Drop-in class**: "Open Yoga", every Wednesday 6pm, $15/class, no registration

**Drop-in + series pricing**: "Watercolor Wednesdays", $120 for 8-week session OR $20 drop-in

**Multi-day-per-week class**: "Intensive Spanish", Tue & Thu 6-8pm, 6 weeks

**Semester-based**: "Fall Pottery" (Sep-Nov), "Spring Pottery" (Feb-Apr), same instructor & venue

**Leveled**: Beginner, Intermediate, Advanced sections (same class, different skill levels)

### Recurring Events

**Weekly open event**: "Jazz Jam Night", every Thursday, no end date, $5 cover

**Monthly meetup**: "Board Game Night", first Saturday of every month, free

---

## Design Decisions

### Decision 1: Discovery Platform vs Registration System

**Recommendation: Stay as discovery platform, but with structured enough data to be useful.**

We don't need to handle actual registration, payments, or enrollment. We link to the org's registration system. But we should capture enough structured data that users can:
- See at a glance: when, how much, what ages, drop-in or register
- Filter: "show me camps with after care" or "drop-in classes this week"
- Compare: "these 3 camps all cost $200-300/week for ages 6-10"

### Decision 2: Program/Offering Grouping (The "6 Weeks of Camp" Problem)

**Option A: Flat (each week = separate series)**
- Simplest. "Summer Art Camp - Week 1 (Space)" is one series with 5 events (Mon-Fri).
- Pros: No new entity, works with existing model
- Cons: Hard to show "this org offers 6 weeks of camp" as a unified thing

**Option B: Parent series / `program_id` on series**
- Add a lightweight `programs` table or just a `parent_series_id` self-reference on `series`
- "Summer Art Camp" is the program. Each week is a series under it.
- Pros: Clean grouping, enables "see all available weeks" UI
- Cons: Another level of hierarchy

**Option C: Tags / grouping field on series**
- Add `program_name` or `group_tag` text field to series
- All weeks share "summer-art-camp-2026" tag
- Pros: Very lightweight, flexible
- Cons: No structured entity, harder to link to

**Recommendation: Option A for now (flat), with Option B as a future enhancement.**
Most orgs list each camp week separately anyway. The organizer page already groups all their series. We can add `parent_series_id` later if needed.

### Decision 3: Time Extensions (Before/After Care)

**Recommendation: Add structured time fields to series, with text fallback.**

```
series table additions:
  core_start_time    TIME     -- "09:00" (main program start)
  core_end_time      TIME     -- "15:00" (main program end)
  extended_start_time TIME    -- "07:30" (before care / early drop-off)
  extended_end_time   TIME    -- "17:30" (after care / late pickup)
  extended_care_details TEXT  -- "Before care 7:30-9am ($25/wk). After care 3-5:30pm ($50/wk)."
```

Why structured fields: enables filtering ("show camps with after care") and clean display.
Why also a text field: real-world care options are messy and this covers edge cases.

Individual events within the series inherit the series times unless overridden.

### Decision 4: Pricing Model

**Recommendation: Add `per_session_price` and `price_details` to series. Don't build a full pricing tier system.**

```
series table additions:
  per_session_price    DECIMAL   -- drop-in / single-class price (null = no drop-in)
  materials_fee        DECIMAL   -- separate supply/materials fee (null = none)
  price_details        TEXT      -- already exists, use for early-bird, discounts, etc.
  pricing_notes        TEXT      -- "Early bird: $180 before May 1. Sibling discount: 10%."
```

The `price_low`/`price_high` already on series covers the main series price. Adding `per_session_price` handles the drop-in case. Everything else (early bird, sibling discounts, materials) goes in `pricing_notes` text -- these are details the org's registration page handles.

### Decision 5: Drop-in vs Registered

**Recommendation: Add `attendance_mode` enum to series.**

```sql
attendance_mode TEXT DEFAULT 'registered'
  -- 'registered': must sign up for the full series
  -- 'drop_in': just show up to any session
  -- 'hybrid': register for series OR drop in to individual sessions
```

This is visible to users ("Drop-in Welcome!" badge) and filterable.

### Decision 6: Age Groups on Series

**Recommendation: Add `age_low`, `age_high`, `age_details` to series.**

```
series table additions:
  age_low      INTEGER   -- minimum age (null = no minimum)
  age_high     INTEGER   -- maximum age (null = no maximum)
  age_details  TEXT      -- "Ages 6-12. Must be potty-trained."
```

Events already have age fields. Series should too. Most series have a consistent age range.

### Decision 7: Skill Level

**Recommendation: Add optional `skill_level` to series.**

```sql
skill_level TEXT  -- NULL, 'beginner', 'intermediate', 'advanced', 'all_levels'
```

Useful for classes. Not relevant for camps or recurring events (stays null).

---

## Proposed Schema Changes

### Series Table Additions

```sql
ALTER TABLE series ADD COLUMN IF NOT EXISTS

  -- Schedule / Time Extensions
  core_start_time      TIME,           -- main program start time
  core_end_time        TIME,           -- main program end time
  extended_start_time  TIME,           -- before care / early drop-off
  extended_end_time    TIME,           -- after care / late pickup
  extended_care_details TEXT,          -- human-readable care options & pricing

  -- Pricing Enhancements
  per_session_price    DECIMAL(10,2),  -- drop-in / single-session price
  materials_fee        DECIMAL(10,2),  -- separate materials/supply fee
  pricing_notes        TEXT,           -- early bird, discounts, sibling rates, etc.

  -- Attendance Model
  attendance_mode      TEXT DEFAULT 'registered',
    -- 'registered' | 'drop_in' | 'hybrid'

  -- Age Restrictions
  age_low              INTEGER,        -- minimum age
  age_high             INTEGER,        -- maximum age
  age_details          TEXT,           -- e.g. "Must be potty-trained"

  -- Skill Level (classes)
  skill_level          TEXT,           -- 'beginner' | 'intermediate' | 'advanced' | 'all_levels'

  -- Day Pattern (for camps: which days of the week)
  days_of_week         INTEGER[],     -- [1,2,3,4,5] = Mon-Fri

  -- Semester / Term grouping
  term_name            TEXT,           -- "Fall 2026", "Summer Session A"

  -- Future: program grouping
  parent_series_id     UUID REFERENCES series(id);  -- for multi-week camp programs
```

### New Types

```typescript
type AttendanceMode = 'registered' | 'drop_in' | 'hybrid';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
```

### Updated RecurrenceRule

The current `RecurrenceRule` works for most cases. For camps (Mon-Fri for one week), we don't use recurrence at all -- we just set `start_date`, `end_date`, and `days_of_week` on the series, then generate the 5 daily events.

For classes that meet multiple days per week (Tue & Thu), the existing `days_of_week` in `RecurrenceRule` already handles this.

No changes needed to `RecurrenceRule`.

---

## UI/UX Considerations

### Series Detail Page Enhancements

```
┌─────────────────────────────────────────────┐
│  Summer Art Camp - Week 1: Space Theme      │
│  ────────────────────────────────────────    │
│  🏕 Camp  │  Ages 6-12  │  Mon-Fri          │
│                                              │
│  📅 June 2-6, 2026                          │
│  ⏰ 9:00 AM - 3:00 PM                       │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Extended Care Available             │   │
│  │  Before care: 7:30-9:00 AM (+$25)   │   │
│  │  After care: 3:00-5:30 PM (+$50)    │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  💰 $250/week                                │
│     Materials fee: $15                       │
│     Early bird: $220 (before May 1)         │
│                                              │
│  📋 Registration Required                    │
│  [Register →]                                │
│                                              │
│  Sessions:                                   │
│  ✓ Mon Jun 2  │  9am-3pm  │  Day 1          │
│  ✓ Tue Jun 3  │  9am-3pm  │  Day 2          │
│  ✓ Wed Jun 4  │  9am-3pm  │  Day 3          │
│  ✓ Thu Jun 5  │  9am-3pm  │  Day 4          │
│  ✓ Fri Jun 6  │  9am-3pm  │  Day 5          │
└─────────────────────────────────────────────┘
```

### Class Detail Page

```
┌─────────────────────────────────────────────┐
│  Pottery 101                                 │
│  ────────────────────────────────────────    │
│  🎓 Class  │  All Levels  │  8 Weeks        │
│                                              │
│  📅 Tuesdays, Sep 3 - Oct 22                │
│  ⏰ 7:00 - 9:00 PM                          │
│                                              │
│  💰 $160 for 8-week session                  │
│     Drop-in: $25/class                       │
│     Materials fee: $20                       │
│                                              │
│  📋 Register for series OR drop in           │
│  [Register for Full Series →]                │
│                                              │
│  Upcoming Sessions:                          │
│  ○ Tue Sep 3   │  7-9pm  │  Week 1          │
│  ○ Tue Sep 10  │  7-9pm  │  Week 2          │
│  ...                                         │
└─────────────────────────────────────────────┘
```

### Filters (Browse Pages)

New filter options for `/series` and `/events`:
- **Type**: Class, Camp, Workshop, Recurring (already exists)
- **Attendance**: Drop-in Welcome, Registration Required
- **Age Group**: Toddler (0-3), Preschool (3-5), Kids (6-12), Teens (13-17), Adults (18+)
- **Skill Level**: Beginner, Intermediate, Advanced, All Levels
- **Has After Care**: Yes (for camp search)
- **Day of Week**: Filter classes by which day they meet

### Submission Form Changes

Step 2 (Event Type) when "New Series" is selected should expand to collect:
- Series type (class/camp/workshop) -- already exists
- **NEW**: Attendance mode (registered / drop-in / hybrid)
- **NEW**: Age range (optional)
- **NEW**: Skill level (optional, shown for classes)
- **NEW**: Care options (optional, shown for camps)
  - Before care time + cost
  - After care time + cost

Step 3 (Date & Time) for camps should support:
- Start date & end date for the camp week
- Which days (default Mon-Fri, allow customization)
- Core hours (start & end time)
- This generates the daily events automatically

Step 5 (Pricing) for series should additionally show:
- Per-session / drop-in price (if hybrid attendance)
- Materials fee (optional)
- Pricing notes (free text for early bird, discounts, etc.)

---

## Implementation Phases

### Phase A: Schema + Types -- COMPLETED (2026-02-09)

**What was done:**
1. SQL migration: `supabase/migrations/20260209_series_camps_classes.sql`
2. Consolidated duplicate types (EventStatus, PriceType, RecurrenceRule) -- single source of truth in `src/lib/supabase/types.ts`
3. Added new canonical enums: `AttendanceMode`, `SkillLevel` to `src/lib/supabase/types.ts`
4. Updated series DB types (Row/Insert/Update) with all new columns
5. Updated `SeriesCard` in `src/types/series.ts` with display-relevant new fields
6. Updated `SeriesDraftData` and `NewSeriesData` in `src/types/submission.ts`
7. Added display info maps: `ATTENDANCE_MODE_INFO`, `SKILL_LEVEL_INFO` in `src/types/series.ts`
8. Added utility functions: `getAttendanceModeLabel()`, `getSkillLevelLabel()`, `formatAgeRange()`, `formatTimeDisplay()`
9. Updated `src/lib/constants/series-limits.ts` with `supportsExtendedCare`, `supportsSkillLevel`, `defaultAttendanceMode`, `defaultDaysOfWeek` per series type
10. Added `ATTENDANCE_MODE_OPTIONS` and `SKILL_LEVEL_OPTIONS` for form UI
11. Fixed naming inconsistency: `upcoming_count` → `upcoming_event_count` everywhere
12. Fixed double `updateData` race condition in step-2 submission form

**Cleanup done:**
- `EventStatus` no longer duplicated (was missing `'changes_requested'` in DB types)
- `PriceType` no longer duplicated (submission.ts now includes `'per_session'`)
- `RecurrenceRule` no longer duplicated (submission.ts imports from DB types, adds `RecurrenceRuleFormData` for strict form validation)
- `DAY_OF_WEEK_LABELS` / `DAY_OF_WEEK_SHORT` no longer duplicated (canonical in series.ts, re-exported from submission.ts)

**SQL migration must be run:** `supabase/migrations/20260209_series_camps_classes.sql`

### Phase B: Data Layer -- NEXT UP
1. Update `get-series.ts` to support new filters (attendance_mode, age, skill_level, has_extended_care)
2. Update `get-series-detail.ts` to return new fields
3. Update `submit-event.ts` / series creation to handle new fields when inserting series
4. Implement `upcoming_event_count` subquery in `search-series.ts` (currently hardcoded to 0)

### Phase C: Display (Series Detail + Cards)
1. Update series detail page to show care options, pricing, attendance mode
2. Update series cards to show key info (drop-in badge, age range, skill level)
3. Add new badges/indicators using the `ATTENDANCE_MODE_INFO` and `SKILL_LEVEL_INFO` maps

### Phase D: Submission Form
1. Update Step 2 to collect new series fields (attendance_mode, age range, skill level)
   - Use `SERIES_LIMITS[type].supportsExtendedCare` and `supportsSkillLevel` to conditionally show fields
2. Update Step 3 camp date range → auto-generate daily events
   - Use `SERIES_LIMITS[type].defaultDaysOfWeek` for camp defaults
3. Update Step 5 for per-session pricing + materials fee
4. Implement recurring event generation in `submit-event.ts` (currently advertised in UI but not implemented)

### Phase E: Filtering
1. Add filter controls to series browse page
2. Add "camps with after care" filter (uses `idx_series_extended_care` index)
3. Add age group, skill level, day of week filters (indexes already created)

---

## Open Questions

1. **Should individual events within a camp have their own detail pages?** Or just the series page? A user probably cares about "Art Camp Week 1" not "Art Camp Week 1 - Day 3". But for classes, individual sessions might matter (a guest speaker on week 4).

2. **How to handle camp themes?** If each week has a theme (Space, Ocean, Dinosaurs), where does that go? Options: series `description`, or a `theme` field, or in the series title itself.

3. **Multi-location offerings?** A yoga studio offers the same class at 2 locations. Two separate series? Or one series with location variants? (Probably: two separate series.)

4. **Instructor/teacher field?** Do we need a dedicated field, or is the organizer sufficient? For a studio with 5 instructors teaching different classes, the organizer is the studio but the instructor varies.

5. **Timezone handling for multi-day camps?** Probably fine -- the series `start_date`/`end_date` with times should use the venue's timezone. Already have `timezone` on events.

6. **Do we need a `sold_out` status or `spots_remaining` count?** Useful for discovery ("hurry, 2 spots left!") but requires real-time data from the org's registration system. Probably out of scope unless manually managed.

---

## Non-Goals (for now)

- Actual registration/payment processing
- Waitlist management
- Automated enrollment tracking
- Real-time capacity updates from external systems
- Parent/child account relationships
- Medical forms or waivers
- Transportation/bus pickup options
- Lunch/snack ordering

---

## Existing Code Cleanup (Pre-requisite)

Before building new features on the series system, these existing issues should be resolved. They'll cause problems otherwise.

### CRITICAL: Duplicate Type Definitions

**EventStatus** is defined in two places with different values:
- `src/types/submission.ts`: includes `'changes_requested'`
- `src/lib/supabase/types.ts`: missing `'changes_requested'`

**PriceType** is defined in two places with different values:
- `src/types/submission.ts`: `'free' | 'fixed' | 'range' | 'varies' | 'donation'`
- `src/lib/supabase/types.ts`: adds `'per_session'` (which the form can't create)

**RecurrenceRule** is defined in two places with different shapes:
- `src/lib/supabase/types.ts`: most fields optional (`interval?`, `time?`, `duration_minutes?`, `end_type?`)
- `src/types/submission.ts`: same fields required (`interval`, `time`, `duration_minutes`, `end_type`)

**Fix:** Single source of truth. Define each type once, import everywhere. The database types file should be the canonical source, and the submission types should import from there (adding stricter required-field wrappers if needed for form validation).

### HIGH: Naming Inconsistency

- `SeriesCard.upcoming_event_count` in `src/types/series.ts`
- `upcoming_count` in `src/data/submit/search-series.ts` and `src/components/submit/steps/step-2-event-type.tsx`

Two different names for the same concept. Pick one and use it everywhere.

### HIGH: Hardcoded `upcoming_count: 0`

In `src/data/submit/search-series.ts` (3 places), the upcoming count is hardcoded to 0 with a comment "Would need subquery to get this". The component checks this value to show a badge, so it's always hidden. Either implement the subquery or remove the display logic.

### MEDIUM: Recurring Event Generation Not Implemented

Step 3 of the submission form shows a "Recurring Pattern" UI for `event_mode === 'recurring'`, but `src/data/submit/submit-event.ts` never actually generates individual events from the recurrence rule. The feature is advertised in the form but doesn't work end-to-end. This is directly relevant to the camps/classes work since we need reliable event generation from patterns.

### MEDIUM: Unused Database Fields on Events

These fields exist in the events table but are never populated or read:
- `recurrence_parent_id`
- `is_recurrence_template`
- `recurrence_pattern`

They overlap conceptually with the series system (`series_id`, `is_series_instance`). Decide if these are needed or can be dropped to reduce confusion.

### MEDIUM: Hardcoded Timezone String

`src/components/submit/steps/step-3-datetime.tsx` hardcodes "Central Time (CT)" in the UI text, but `src/lib/constants/config.ts` defines `DEFAULT_TIMEZONE = 'America/Chicago'`. These should be linked.

### LOW: Multiple `updateData` Calls in Step 2

`src/components/submit/steps/step-2-event-type.tsx` calls `updateData` twice in sequence on mode selection. Depending on React batching, this could be fine or could cause a stale-state bug. Should be a single merged update.

### Cleanup Priority Order

1. ~~Merge duplicate type definitions (EventStatus, PriceType, RecurrenceRule)~~ -- DONE (Phase A)
2. ~~Fix naming inconsistency (upcoming_count vs upcoming_event_count)~~ -- DONE (Phase A)
3. Implement upcoming_event_count subquery or remove display code -- Phase B
4. Implement recurring event generation -- Phase D
5. Decide on recurrence_parent_id/is_recurrence_template fields -- still open
6. Fix hardcoded timezone -- still open
7. ~~Consolidate updateData calls~~ -- DONE (Phase A)
