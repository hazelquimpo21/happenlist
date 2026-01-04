# Happenlist Phase 2: Series & Recurring Events

This document covers the Phase 2 implementation for multi-session events (classes, camps, workshops) and recurring events.

---

## Quick Setup

```bash
# 1. Install any new dependencies (none required for Phase 2)
npm install

# 2. Run the SQL migration in Supabase
#    Go to: Supabase Dashboard > SQL Editor
#    Paste contents of: supabase/migrations/00006_series_and_recurring.sql
#    Click "Run"

# 3. Start development server
npm run dev

# 4. Visit http://localhost:3000/series
```

---

## What's New in Phase 2

### Series Types

| Type | Description | Example |
|------|-------------|---------|
| `class` | Multi-session educational class | "Pottery 101 - 6 Week Course" |
| `camp` | Day camp or intensive | "Summer Art Camp - June 10-14" |
| `workshop` | Workshop series | "Bread Baking - 3 Sessions" |
| `recurring` | Repeating event (weekly/monthly) | "Weekly Jazz Jam - Every Tuesday" |
| `festival` | Multi-day festival | "Summerfest 2025 - July 4-7" |
| `season` | Performance season | "Symphony 2025 Season" |

### New Pages

| URL | Description |
|-----|-------------|
| `/series` | Browse all series (classes, camps, etc.) |
| `/series?type=class` | Filter by type |
| `/series?category=music` | Filter by category |
| `/series/[slug]` | Series detail with event list |

### Updated Event Cards

Event cards now show a **series badge** when an event is part of a series. Clicking the badge navigates to the parent series.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       SERIES SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │    Series    │ ───1:N──│   Events     │                      │
│  │ (parent)     │         │ (instances)  │                      │
│  └──────────────┘         └──────────────┘                      │
│         │                        │                               │
│         │                        │                               │
│  series_type:                    series_id: FK to series        │
│  - class                         series_sequence: 1, 2, 3...    │
│  - camp                          is_series_instance: true       │
│  - workshop                                                      │
│  - recurring                                                     │
│  - festival                                                      │
│  - season                                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── app/
│   └── series/
│       ├── page.tsx              # /series index page
│       ├── series-filters.tsx    # Client-side filter controls
│       └── [slug]/
│           ├── page.tsx          # /series/[slug] detail page
│           └── series-json-ld.tsx# SEO structured data
│
├── components/
│   └── series/
│       ├── index.ts              # Component exports
│       ├── series-card.tsx       # Card for grids
│       ├── series-grid.tsx       # Responsive grid layout
│       ├── series-type-badge.tsx # Type indicator (Class, Camp, etc.)
│       ├── series-price.tsx      # Price display
│       ├── series-header.tsx     # Detail page hero
│       ├── series-events-list.tsx# Events within series
│       ├── series-link-badge.tsx # Badge on event cards
│       └── series-skeleton.tsx   # Loading states
│
├── data/
│   └── series/
│       ├── index.ts              # Data function exports
│       ├── get-series.ts         # List/filter series
│       └── get-series-detail.ts  # Single series + events
│
└── types/
    └── series.ts                 # TypeScript types
```

---

## Database Schema

### Series Table

```sql
CREATE TABLE series (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,

  -- Type & Session Info
  series_type TEXT NOT NULL,        -- class, camp, workshop, recurring, festival, season
  total_sessions INTEGER,           -- NULL for open-ended
  sessions_remaining INTEGER,       -- Auto-updated via trigger

  -- Dates
  start_date DATE,
  end_date DATE,

  -- Recurrence (for recurring type)
  recurrence_rule JSONB,            -- { frequency, days_of_week, time, etc. }

  -- Relationships
  organizer_id UUID,
  category_id UUID,
  location_id UUID,

  -- Pricing
  price_type TEXT,                  -- free, fixed, range, per_session
  price_low DECIMAL,
  price_high DECIMAL,
  is_free BOOLEAN,

  -- Registration
  registration_url TEXT,
  registration_required BOOLEAN,

  -- Media & SEO
  image_url TEXT,
  thumbnail_url TEXT,
  meta_title TEXT,
  meta_description TEXT,

  -- Status
  status TEXT DEFAULT 'draft',      -- draft, published, cancelled, completed
  is_featured BOOLEAN,

  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Events Table Updates

```sql
-- New columns on events table
ALTER TABLE events ADD COLUMN series_id UUID REFERENCES series(id);
ALTER TABLE events ADD COLUMN series_sequence INTEGER;
ALTER TABLE events ADD COLUMN is_series_instance BOOLEAN DEFAULT false;
```

---

## State Diagram

```
                    ┌───────────┐
                    │   draft   │
                    └─────┬─────┘
                          │ publish
                          ▼
    ┌─────────────────────────────────────────┐
    │              published                   │
    │  (visible to public, events active)      │
    └────────┬─────────────────┬───────────────┘
             │                 │
   all events│                 │ manual action
     passed  │                 │
             ▼                 ▼
    ┌─────────────┐    ┌────────────┐
    │  completed  │    │ cancelled  │
    │  (archived) │    │ (removed)  │
    └─────────────┘    └────────────┘
```

---

## Component Usage

### Display a Series Grid

```tsx
import { SeriesGrid } from '@/components/series';
import { getSeries } from '@/data/series';

export default async function Page() {
  const { series } = await getSeries({ type: 'class', limit: 8 });

  return (
    <SeriesGrid
      series={series}
      showCategory
    />
  );
}
```

### Series Card with Badge

```tsx
import { SeriesCard } from '@/components/series';

<SeriesCard
  series={series}
  variant="featured"
  showCategory
  showSessions
/>
```

### Series Type Badge

```tsx
import { SeriesTypeBadge } from '@/components/series';

<SeriesTypeBadge type="class" size="lg" />
<SeriesTypeBadge type="recurring" showIcon showLabel />
```

### Event Card with Series Link

Events that belong to a series automatically show a badge:

```tsx
import { EventCard } from '@/components/events';

// If event has series_id, series_slug, series_title,
// the badge appears automatically
<EventCard event={event} showSeriesBadge />
```

---

## Data Fetching

### Get Series List

```typescript
import { getSeries } from '@/data/series';

// Basic query
const { series, total, hasMore } = await getSeries({
  page: 1,
  limit: 12,
});

// With filters
const { series } = await getSeries({
  type: 'class',
  categorySlug: 'arts-culture',
  isFree: true,
  orderBy: 'start-date-asc',
});
```

### Get Series Detail

```typescript
import { getSeriesBySlug, getSeriesEvents } from '@/data/series';

// Get series
const series = await getSeriesBySlug('pottery-101-spring-2025');

// Get events in series
const events = await getSeriesEvents(series.id, {
  includePast: false, // Only upcoming
  limit: 20,
});
```

### Get Featured Series

```typescript
import { getFeaturedSeries } from '@/data/series';

const featured = await getFeaturedSeries(4);
```

---

## Recurrence Rule Format

For recurring events, the `recurrence_rule` JSONB field uses this structure:

```json
{
  "frequency": "weekly",
  "interval": 1,
  "days_of_week": [2],
  "time": "19:00",
  "duration_minutes": 120,
  "end_type": "date",
  "end_date": "2025-12-31"
}
```

### Frequency Options

| Frequency | Description |
|-----------|-------------|
| `daily` | Every day |
| `weekly` | Every week |
| `biweekly` | Every 2 weeks |
| `monthly` | Every month |
| `yearly` | Every year |

### Days of Week

| Value | Day |
|-------|-----|
| 0 | Sunday |
| 1 | Monday |
| 2 | Tuesday |
| 3 | Wednesday |
| 4 | Thursday |
| 5 | Friday |
| 6 | Saturday |

---

## SEO & Structured Data

### Schema.org Types

| Series Type | Schema |
|-------------|--------|
| class, workshop, camp | `Course` |
| recurring, festival, season | `EventSeries` |

Example JSON-LD for a class:

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Pottery 101",
  "description": "Learn the basics of wheel throwing...",
  "provider": {
    "@type": "Organization",
    "name": "Milwaukee Art Studio"
  },
  "hasCourseInstance": [
    { "@type": "CourseInstance", "startDate": "2025-03-01" },
    { "@type": "CourseInstance", "startDate": "2025-03-08" }
  ]
}
```

---

## Console Logging

Phase 2 uses consistent emoji-prefixed logging:

```
📚 [getSeries] Fetching series with params: { type: 'class' }
✅ [getSeries] Found 8 series (total: 24)

📖 [getSeriesBySlug] Fetching series: pottery-101
✅ [getSeriesBySlug] Found series: Pottery 101

🎫 [getSeriesEvents] Fetching events for series: abc-123
✅ [getSeriesEvents] Found 6 events

📊 [getSeriesStats] Calculating stats for series: abc-123
✅ [getSeriesStats] Stats: { totalEvents: 6, upcomingEvents: 4 }
```

---

## Testing Checklist

- [ ] Series index page loads at `/series`
- [ ] Type filters work (`?type=class`, `?type=recurring`)
- [ ] Category filters work (`?category=music`)
- [ ] Free filter works (`?free=true`)
- [ ] Search works (`?q=pottery`)
- [ ] Pagination works
- [ ] Series detail page loads at `/series/[slug]`
- [ ] Events list shows within series
- [ ] Related series appear
- [ ] Event cards show series badge (when applicable)
- [ ] Series badge links to correct series page
- [ ] JSON-LD validates (Google Rich Results Test)

---

## Migration Checklist

1. **Run SQL Migration**
   - Go to Supabase Dashboard > SQL Editor
   - Paste `supabase/migrations/00006_series_and_recurring.sql`
   - Click "Run"

2. **Verify Tables**
   - Check `series` table was created
   - Check `events` table has new columns:
     - `series_id`
     - `series_sequence`
     - `is_series_instance`

3. **Create Test Data**
   - Create a test series in Supabase Studio
   - Link some events to the series
   - Verify display on frontend

---

## Next Steps (Phase 3) ✅ COMPLETED

The following features have been implemented in Phase 3:

- [x] User authentication (Magic link / passwordless)
- [x] Event submission with 7-step form
- [x] Admin review queue with approve/reject/request-changes
- [x] User submissions dashboard
- [x] Status tracking with color-coded badges
- [x] Admin audit logging

See `AI_DEV_DOCS/20-EVENT-FLOWS-ARCHITECTURE.md` for complete Phase 3 documentation.

---

## Future Features (Phase 4+)

- [ ] Heart/save events and series
- [ ] Series enrollment tracking
- [ ] Email notifications for series/event updates
- [ ] Recurring event auto-generation

---

## Troubleshooting

### "Series not found" on detail page

- Check the series `status` is `published`
- Check the series `slug` matches the URL
- Check RLS policies are allowing select

### Series badge not showing on event cards

- Ensure event has `series_id`, `series_slug`, and `series_title`
- Ensure `is_series_instance` is `true`
- Check the `showSeriesBadge` prop is not `false`

### Events not appearing in series

- Ensure events have `series_id` set
- Ensure events `status` is `published`
- Check `series_sequence` for ordering

---

Built with Next.js 16, Supabase, and Tailwind CSS.
