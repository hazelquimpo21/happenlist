# Prompt: Add Series Support to the Scraper API

## Goal

The scraper Chrome extension can now detect season/multi-date pages and send multiple events that belong to the same series. The Happenlist website's scraper API (`/api/scraper/events`) currently has **zero series support** — it creates standalone events with no `series_id`, no series record, and no linking. This prompt adds that support.

**What the scraper sends (new):** When the scraper processes a season page (like Milwaukee Makers Market's 2026 season with 11 dates), it sends each event individually to `POST /api/scraper/events` with these new fields:

```json
{
  "title": "Milwaukee Makers Market: Celebrate Milwaukee / 414 Day",
  "start_datetime": "2026-04-12T10:00:00-05:00",
  "source_url": "https://www.milwaukeemakersmarket.com/2026-season",
  "is_series": true,
  "series_title": "Milwaukee Makers Market",
  "series_type": "season",
  "series_sequence": 1,
  "...other standard fields..."
}
```

All 11 events share the same `source_url`, `series_title`, `series_type`, and image. Each has a unique `start_datetime` and `series_sequence`.

## The Problem

Two things block this today:

1. **No series fields in `ScraperEventInput`** — the type doesn't accept `is_series`, `series_title`, `series_type`, `series_sequence`, or any series/recurrence fields.

2. **No series resolution logic** — even if the fields were accepted, the route doesn't create or find a matching series record, and doesn't set `series_id` / `is_series_instance` on the event.

3. **Dedup blocks sibling events** — the current dedup checks `source_url` uniquely. All events from a season page share the same `source_url`, so the 2nd-11th events would all 409 as duplicates.

## What to Build

### 1. Expand `ScraperEventInput` type in `/src/app/api/scraper/events/route.ts`

Add these optional fields to the interface:

```typescript
// -- Series (optional) --
is_series?: boolean;
series_title?: string | null;
series_type?: 'class' | 'camp' | 'workshop' | 'recurring' | 'festival' | 'season' | null;
series_sequence?: number | null;

// -- Recurrence (optional, for recurring series) --
recurrence_rule?: {
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  interval?: number;
  days_of_week?: number[];
  time?: string;
  duration_minutes?: number;
  end_type?: 'date' | 'count' | 'never';
  end_date?: string;
  end_count?: number;
} | null;
```

### 2. Add `resolveSeriesForScraper()` helper in the same file

This function finds or creates a series record when the scraper sends series fields.

```typescript
async function resolveSeriesForScraper(
  supabase: any,
  body: ScraperEventInput,
  categoryId: string | null,
  locationId: string | null,
  organizerId: string | null
): Promise<string | null> {
  if (!body.is_series || !body.series_title) return null;

  const seriesSlug = generateSlug(body.series_title);

  // 1. Try exact slug match first
  const { data: existingSeries } = await supabase
    .from('series')
    .select('id, title')
    .eq('slug', seriesSlug)
    .limit(1)
    .single();

  if (existingSeries) {
    console.log(`📚 [resolveSeriesForScraper] Matched existing series: "${existingSeries.title}" (${existingSeries.id})`);
    return existingSeries.id;
  }

  // 2. Try slug prefix match (handles "-2", "-3" suffixes from slug uniqueness)
  const { data: prefixMatches } = await supabase
    .from('series')
    .select('id, title, slug')
    .like('slug', `${seriesSlug}%`)
    .limit(5);

  if (prefixMatches && prefixMatches.length > 0) {
    // Use the first match — it's the original series
    console.log(`📚 [resolveSeriesForScraper] Prefix-matched series: "${prefixMatches[0].title}" (${prefixMatches[0].id})`);
    return prefixMatches[0].id;
  }

  // 3. Create new series
  const { data: newSeries, error: createError } = await supabase
    .from('series')
    .insert({
      title: body.series_title,
      slug: seriesSlug,
      series_type: body.series_type || 'recurring',
      category_id: categoryId,
      location_id: locationId,
      organizer_id: organizerId,
      image_url: body.image_url || null,
      thumbnail_url: body.thumbnail_url || null,
      price_type: body.price_type || 'free',
      price_low: body.price_low ?? null,
      price_high: body.price_high ?? null,
      description: body.description || null,
      short_description: body.short_description || null,
      recurrence_rule: body.recurrence_rule || null,
      attendance_mode: 'drop_in', // Season events are typically drop-in
      status: 'published',
      source: 'scraper',
    })
    .select('id')
    .single();

  if (createError) {
    console.error(`❌ [resolveSeriesForScraper] Failed to create series: ${createError.message}`);
    return null;
  }

  console.log(`📚 [resolveSeriesForScraper] Created new series: "${body.series_title}" (${newSeries.id})`);
  return newSeries.id;
}
```

### 3. Update the dedup logic in the POST handler

The current dedup (`source_url` exact match) will reject sibling events from the same season page. Fix by making dedup check `source_url + title` or `source_url + instance_date` for series events:

```typescript
// Replace the current dedup block:

// -- Deduplicate --
if (body.is_series) {
  // For series events, dedup by source_url + instance_date (same series page, same date = same event)
  const instanceDate = body.instance_date || body.start_datetime.split('T')[0];
  const { data: existing } = await supabase
    .from('events')
    .select('id, title, status')
    .eq('source_url', body.source_url)
    .eq('instance_date', instanceDate)
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({
      success: false,
      error: 'duplicate',
      message: `Series event already exists for this date: "${existing.title}" (${existing.status})`,
      existingEventId: existing.id,
    }, { status: 409 });
  }
} else {
  // Standard dedup by source_url only
  const { data: existing } = await supabase
    .from('events')
    .select('id, title, status')
    .eq('source_url', body.source_url)
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({
      success: false,
      error: 'duplicate',
      message: `Event already exists: "${existing.title}" (${existing.status})`,
      existingEventId: existing.id,
    }, { status: 409 });
  }
}
```

### 4. Wire series resolution into the POST handler

After the existing `resolveOrganizer` call, add series resolution. Then include `series_id`, `is_series_instance`, and `series_sequence` in the event insert:

```typescript
// After organizer resolution:

// -- Resolve series --
let seriesId: string | null = null;
if (body.is_series) {
  seriesId = await resolveSeriesForScraper(supabase, body, categoryId, locationId, organizerId);
}

// In eventData object, add:
series_id: seriesId,
is_series_instance: seriesId !== null,
series_sequence: body.series_sequence ?? null,
```

### 5. Update series metadata after event creation

After the event is inserted, update the series `start_date`, `end_date`, and `total_sessions` to reflect the new event:

```typescript
// After successful event insert:

if (seriesId) {
  // Update series date range and session count
  try {
    // Get min/max dates and count from all events in this series
    const { data: seriesStats } = await supabase
      .from('events')
      .select('instance_date')
      .eq('series_id', seriesId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('instance_date', { ascending: true });

    if (seriesStats && seriesStats.length > 0) {
      await supabase
        .from('series')
        .update({
          start_date: seriesStats[0].instance_date,
          end_date: seriesStats[seriesStats.length - 1].instance_date,
          total_sessions: seriesStats.length,
        })
        .eq('id', seriesId);

      console.log(`📚 [scraper/events] Updated series dates: ${seriesStats[0].instance_date} → ${seriesStats[seriesStats.length - 1].instance_date} (${seriesStats.length} sessions)`);
    }
  } catch (seriesUpdateError) {
    // Non-critical — series dates can be updated later
    console.warn('⚠️ [scraper/events] Failed to update series dates:', seriesUpdateError);
  }
}
```

### 6. Update the response to include series info

```typescript
return NextResponse.json({
  success: true,
  eventId: event.id,
  slug: event.slug,
  status: event.status,
  locationId,
  organizerId,
  seriesId,           // NEW
  seriesSequence: body.series_sequence ?? null,  // NEW
  message: seriesId
    ? `Event created and linked to series.`
    : `Event created.`,
}, { status: 201 });
```

### 7. Update the GET self-documentation

Add the series fields to the `recommended_fields` object in the GET handler so the scraper knows they're available:

```typescript
series_fields: {
  is_series: 'boolean — true if this event is part of a series',
  series_title: 'string — name of the series (e.g. "Milwaukee Makers Market")',
  series_type: 'class | camp | workshop | recurring | festival | season',
  series_sequence: 'number — position within the series (1, 2, 3...)',
  recurrence_rule: 'object — { frequency, interval, days_of_week, time, duration_minutes, end_type, end_date, end_count }',
},
deduplication: 'Standard events: deduplicated by source_url. Series events: deduplicated by source_url + instance_date (allows multiple events from same season page).',
```

## Files to Modify

| File | Change |
|------|--------|
| `src/app/api/scraper/events/route.ts` | Add series fields to `ScraperEventInput`, add `resolveSeriesForScraper()`, update dedup for series events, wire series into event insert, update series dates after insert, update response + GET docs |

## Files That Need NO Changes

| File | Why |
|------|-----|
| `src/types/series.ts` | Already has `SeriesType` including `'season'`, all display types are fine |
| `src/data/series/generate-events.ts` | Used by user submission, not scraper — `createSeries()` is a different pattern |
| `src/components/series/*` | Display components already handle all series types including season |
| `src/app/series/[slug]/page.tsx` | Series detail page already lists events by sequence — will just work |
| `src/data/series/get-series-detail.ts` | `getSeriesEvents()` already queries by `series_id` and orders by `series_sequence` |

## Testing

1. **Single event (no series):** POST a normal event without `is_series` — should work exactly as before. Verify no series record created.

2. **First series event:** POST with `is_series: true`, `series_title: "Test Season"`, `series_type: "season"`, `series_sequence: 1`. Should create a new series record AND the event linked to it.

3. **Second series event (same series):** POST with same `series_title`, `series_sequence: 2`, same `source_url` but different `start_datetime`/`instance_date`. Should match the existing series (by slug), NOT create a duplicate series. Should NOT 409 on dedup.

4. **Duplicate detection:** POST the exact same event again (same `source_url` + same `instance_date`). Should 409 as duplicate.

5. **Series detail page:** Navigate to `/series/test-season`. Should show the series with both events listed by sequence number. Image, category, description should be populated from the first event's data.

6. **11-event season:** Simulate the Milwaukee Makers Market scenario — POST all 11 events with the same `series_title`, each with different dates and venues. Verify:
   - One series record created with `series_type: 'season'`
   - All 11 events have the correct `series_id`
   - Series `start_date` = earliest event, `end_date` = latest event, `total_sessions` = 11
   - Each event has correct `series_sequence` (1-11)
   - Series detail page shows all 11 events in order
   - Each event's detail page shows a "Part of Season" badge linking to the series

## Edge Cases

- **Series title collision:** If two different organizers have a series called "Holiday Market", the slug `holiday-market` would match the wrong series. For now this is acceptable — the scraper sends one series at a time and the slug match is fast-path. If it becomes a problem later, scope the match by `organizer_id` or `category_id`.

- **Venue varies per event:** Season events often rotate venues (Milwaukee Makers Market does this). Each event gets its own `location_id` via the existing `resolveLocation()`. The series record gets the `location_id` from the first event that creates it — this is fine since the series detail page shows per-event locations via `SeriesEventsList`.

- **Image sharing:** All events from a season page share the same `image_url`. The series also gets this image. Image upload via `/api/images/upload` happens per-event from the scraper — the first upload re-hosts the image, subsequent events reference the same CDN URL.

- **Partial failures:** If 3 of 11 events fail to save, the series still exists with 8 events. The scraper can retry the failed 3 — they'll match the existing series by slug and the dedup will skip any that already saved.
