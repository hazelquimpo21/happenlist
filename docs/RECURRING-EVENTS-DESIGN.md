# Recurring Events Design

Design document for refining series/recurring event architecture.

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

## 2. Attaching a Single Event to a Recurring Series

### The problem

A user wants to submit a standalone event and say "this belongs to the Weekly Jazz Jam series." Today the `existing_series` event mode does this, but:
- The single event gets `series_id` set, but NOT `is_series_instance: true` or a meaningful `series_sequence`
- There's no validation that the event's date/time aligns with the series pattern
- The series `total_sessions` and `sessions_remaining` aren't updated

### Design: explicit attach with optional override

When attaching a single event to a recurring series:

1. **Set `is_series_instance: true`** — always, when `series_id` is non-null
2. **Auto-assign `series_sequence`** — query `MAX(series_sequence) WHERE series_id = X` and increment. This keeps sequences monotonic even with gaps.
3. **Allow date/time override** — the attached event does NOT need to match the recurrence pattern. Real-world example: "Jazz Jam Special Holiday Edition" on a Saturday instead of the usual Wednesday. The event keeps its own `start_datetime` and `end_datetime`.
4. **Mark as override** — add an `is_override` boolean on the event (default false). This distinguishes "generated from pattern" events from "manually attached" events. Useful for:
   - Knowing which events to regenerate/delete when extending the series
   - Displaying differently in the UI ("Special event" vs regular occurrence)
5. **Update series counts** — after attach, increment `total_sessions` on the series

### Schema change

```sql
ALTER TABLE events ADD COLUMN is_override boolean NOT NULL DEFAULT false;
```

### Code change in `createSingleEvent`

```typescript
// When attaching to a series, compute next sequence
if (seriesId) {
  const { data: maxSeq } = await supabase
    .from('events')
    .select('series_sequence')
    .eq('series_id', seriesId)
    .order('series_sequence', { ascending: false })
    .limit(1)
    .single();

  eventData.series_sequence = (maxSeq?.series_sequence || 0) + 1;
  eventData.is_series_instance = true;
  eventData.is_override = true;
}
```

---

## 3. Event Generation Strategy & Performance

### Current approach: eager bulk insert

At submission time, all events are generated and inserted in a single batch. For a weekly recurring event: 12 weeks = 12 rows. For a daily camp: up to 14 rows.

**This is fine for initial creation.** The batch insert is a single Supabase call. 52 rows is negligible.

### The real problem: replenishment

A weekly recurring event created today generates events through ~May 2026. In June, there are no more events to show. The system needs a way to generate more.

### Option A: Lazy generation (on-read)

Generate events when someone views the series or event listing, if the buffer is low.

```
GET /series/weekly-jazz-jam
  → check: upcoming events for this series < MIN_RECURRING_BUFFER?
  → if yes: generate next batch from stored recurrence_rule
  → return events
```

**Pros:** No cron infrastructure needed. Events exist when they're needed.
**Cons:** First visitor after buffer runs out gets a slower response. Race conditions if two requests trigger generation simultaneously. Generation happens in a read path (unexpected side effect).

### Option B: Scheduled generation (cron/edge function)

A periodic job (daily or weekly) scans all active recurring series and tops up their event buffers.

```
CRON (daily at 3am CT):
  → SELECT * FROM series WHERE series_type = 'recurring' AND status = 'published'
  → For each: count upcoming events. If < MIN_RECURRING_BUFFER, generate more from recurrence_rule
```

**Pros:** Clean separation. No read-path side effects. Predictable. Can run as a Supabase Edge Function or pg_cron.
**Cons:** Requires infrastructure. Events don't exist until the cron runs (could be up to 24h delay).

### Option C: Hybrid (recommended)

- **Cron as primary**: runs nightly, generates events for all recurring series that are below buffer threshold. This handles 99% of cases.
- **On-read fallback**: if a series detail page is loaded and upcoming_count < 2, trigger generation inline. This catches the edge case where cron hasn't run yet or failed.

**Performance numbers (estimated):**
- Supabase batch insert of 12 events: ~50-100ms
- Cron scanning 100 recurring series: ~500ms (single query to find low-buffer series, then batch inserts)
- On-read check: single `COUNT(*)` query with index on `(series_id, instance_date)` — <5ms

### Key implementation detail

Generation MUST read `recurrence_rule` from the **series** table, not from submission draft data. This means:

1. Fix `generateRecurringEvents` to also persist `recurrence_rule` on the series (it currently relies on `createSeries` which receives `seriesDraftData` but `recurrence_rule` is on `draftData`, not `seriesDraftData`)
2. The replenishment function reads `series.recurrence_rule` and the last generated event's `instance_date` to know where to continue from

### Buffer sizing

```
MIN_RECURRING_BUFFER = 8      // trigger replenishment when fewer than 8 upcoming events
GENERATION_BATCH_SIZE = 12    // generate 12 events at a time (~12 weeks for weekly)
MAX_TOTAL_EVENTS = 52         // hard cap per generation run (safety)
```

For weekly events: buffer lasts 8 weeks, replenishment adds 12 weeks. So we always have 8-20 weeks of future events. Cron running weekly means we never drop below ~7 weeks.

---

## 4. Multi-Day Events vs Series: When Is It a Series?

### The question

A 3-day music festival (Summerfest) has different lineups each day. Is that:
- **(A)** A single event spanning June 2-9 (`start_datetime` to `end_datetime`)
- **(B)** A series of type `festival` with individual day-events

### Answer: it depends on whether the days have independent content

**Use a single event when:**
- The schedule is the same structure every day (e.g., "gates open 11am, music 12-10pm" every day)
- There's one ticket for the whole thing
- People think of it as one thing, not separate things
- Example: "Milwaukee Irish Fest — Aug 14-17" → single event, 4-day span

**Use a `festival` series when:**
- Each day has a meaningfully different schedule, lineup, or theme
- Day-specific tickets exist (Saturday-only pass)
- People might attend only one day
- You want each day to appear independently in listings/search
- Example: "Summerfest Day 1: Rock Stage" / "Summerfest Day 2: Jazz Stage" → festival series with day-events

### How this maps to the current model

| Scenario | Model | `series_type` | Events |
|----------|-------|---------------|--------|
| Irish Fest (same daily structure) | Single event | n/a | 1 event: `start_datetime=Aug 14 11am`, `end_datetime=Aug 17 10pm` |
| Summerfest (different daily lineups) | Festival series | `festival` | 1 series + N day-events, each with own title/description |
| 3-day camping retreat (single experience) | Single event | n/a | 1 event spanning 3 days |
| Art fair Sat+Sun (different vendors each day) | Festival series | `festival` | 1 series + 2 day-events |

**The current model already supports both.** The `festival` series type with `consecutive` date selection generates day-events. A multi-day single event just has `end_datetime` on a later date than `start_datetime`.

### What's missing: the "umbrella" pattern

For festivals, you often want BOTH:
- The festival as a whole (for discovery: "Summerfest is happening June 2-9")
- Individual day-events (for scheduling: "I'm going Saturday for the jazz lineup")

Today, the series acts as the umbrella and day-events are the children. But a series doesn't appear in the main event listing — it only appears on `/series`. Users browsing `/events` won't see the festival unless individual day-events are published.

**Proposed solution: series-level visibility in event feeds**

Add the ability to surface a series as a "card" in the events feed, using `series.start_date` as the sort date. This is a display/query concern, not a schema change. The series card links to the series detail page which shows all day-events.

Alternatively, auto-create a "parent event" for festival series that spans the full date range and links to the series detail page. This parent event appears in event listings as the discovery point.

---

## 5. Summary of Proposed Changes

### Schema

| Change | Table | Column | Type |
|--------|-------|--------|------|
| Add override flag | `events` | `is_override` | `boolean NOT NULL DEFAULT false` |
| Ensure recurrence_rule stored | `series` | `recurrence_rule` | Already exists — ensure it's populated for recurring type |
| Track last generation | `series` | `last_generated_at` | `timestamptz NULL` |
| Track generation cursor | `series` | `generation_cursor_date` | `date NULL` — last date events were generated through |

### Type changes

| Change | File | Detail |
|--------|------|--------|
| Remove `biweekly` and `yearly` from frequency | `types.ts` | `frequency: 'daily' \| 'weekly' \| 'monthly'` |
| Add `is_override` to event types | `types.ts`, `event.ts` | Boolean field |
| Add biweekly as UI shortcut | `series-limits.ts` | `RECURRENCE_FREQUENCY_OPTIONS` entry that maps to `{ frequency: 'weekly', interval: 2 }` |

### Code changes

| Change | File | Detail |
|--------|------|--------|
| Fix `createSingleEvent` to set sequence when attaching to series | `submit-event.ts` | Query max sequence, set `is_series_instance`, `is_override` |
| Persist `recurrence_rule` on series for recurring mode | `submit-event.ts` | Pass rule to `createSeries` |
| Add replenishment function | New: `src/data/series/replenish-recurring.ts` | Reads `series.recurrence_rule` + `generation_cursor_date`, generates next batch |
| Add cron/edge function for nightly replenishment | New: `supabase/functions/replenish-recurring/` | Scans active recurring series, tops up buffers |
| Fix timezone in date calculation | `submit-event.ts` | Use date-fns with explicit timezone instead of bare `new Date()` |

### No changes needed

- Multi-day events already work as single events with `start_datetime`/`end_datetime` spanning multiple days
- Festival series already generates day-events via `consecutive` date selection
- The `festival` and `season` series types are well-modeled for their use cases

---

## 6. Open Questions

1. **Should overridden events inherit series updates?** If the series title changes, should manually-attached events update too? Probably not — they're intentionally different.

2. **Replenishment: published only or pending_review too?** If a recurring series is still in review, should we generate future events? Probably not until the series is published.

3. **Series in event feed:** Do we want festivals/series to appear in the main events feed (`/events`), or keep them separate on `/series`? This affects discoverability.

4. **Cancelling a single occurrence:** If "Jazz Jam - March 5" is cancelled, should the series stay intact with a gap, or should the cancelled event be replaced? Current model: event stays with `status: cancelled`. This seems correct — it communicates "normally happens but not this week."
