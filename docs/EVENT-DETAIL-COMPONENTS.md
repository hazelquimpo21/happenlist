# 📅 Event Detail Page Components

> Documentation for components used on the event single page (`/event/[slug]`).

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Components](#-components)
   - [EventDateTime](#-eventdatetime)
   - [EventLinks](#-eventlinks)
3. [Database Fields](#-database-fields)
4. [Running the Migration](#-running-the-migration)
5. [Component States](#-component-states)
6. [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

The event detail page displays comprehensive information about an event. This document covers the components added for:

| Feature | Component | Database Field |
|---------|-----------|----------------|
| Start & End Time | `EventDateTime` | `start_datetime`, `end_datetime` |
| Event Website | `EventLinks` | `website_url` |
| Instagram Link | `EventLinks` | `instagram_url` |
| Facebook Link | `EventLinks` | `facebook_url` |
| Registration Link | `EventLinks` | `registration_url` |
| Ticket Link | Primary CTA Button | `ticket_url` (existing) |

---

## 🧩 Components

### 🕐 EventDateTime

**Location:** `src/components/events/event-date-time.tsx`

Displays event timing with support for:
- Start time only
- Start and end time
- All-day events
- Multi-day events

#### Usage

```tsx
import { EventDateTime } from '@/components/events';

// Full variant (sidebar)
<EventDateTime
  startDatetime="2025-02-14T19:00:00"
  endDatetime="2025-02-14T22:00:00"
  isAllDay={false}
  variant="full"
  showIcon
/>

// Inline variant (within text)
<EventDateTime
  startDatetime="2025-02-14T19:00:00"
  endDatetime="2025-02-14T22:00:00"
  variant="inline"
/>

// Compact variant (cards)
<EventDateTime
  startDatetime="2025-02-14T19:00:00"
  variant="compact"
/>
```

#### Display Examples

| Scenario | Rendered Output |
|----------|-----------------|
| Single time | `7:00 PM` |
| With end time | `🕐 Starts 7:00 PM → Ends 10:00 PM` |
| All-day | `☀️ All Day Event` |
| Multi-day | Two blocks showing start/end dates |

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `startDatetime` | `string` | Required | ISO datetime string |
| `endDatetime` | `string \| null` | `null` | ISO datetime string |
| `isAllDay` | `boolean` | `false` | All-day event flag |
| `timezone` | `string` | - | Timezone display (e.g., 'CST') |
| `variant` | `'full' \| 'compact' \| 'inline'` | `'full'` | Display style |
| `showIcon` | `boolean` | `true` | Show clock icon |
| `className` | `string` | - | Additional CSS classes |

---

### 🔗 EventLinks

**Location:** `src/components/events/event-links.tsx`

Displays external links with recognizable icons for each platform.

#### Usage

```tsx
import { EventLinks, EventLink } from '@/components/events';

// Full variant (shows all links with labels)
<EventLinks
  websiteUrl="https://jazzconcert.com"
  instagramUrl="https://instagram.com/jazzevent"
  facebookUrl="https://facebook.com/events/123"
  ticketUrl="https://tickets.com/jazz"
  registrationUrl="https://rsvp.jazzconcert.com"
  variant="full"
/>

// Compact variant (icons only)
<EventLinks
  instagramUrl="https://instagram.com/event"
  facebookUrl="https://facebook.com/events/123"
  variant="compact"
/>

// Single link
<EventLink
  url="https://instagram.com/event"
  type="instagram"
  showLabel={true}
/>
```

#### Link Types & Icons

| Type | Icon | Color |
|------|------|-------|
| `website` | 🌐 Globe | Coral |
| `registration` | 📋 ClipboardList | Sage |
| `ticket` | 🎫 Ticket | Amber |
| `instagram` | 📸 Instagram | Pink |
| `facebook` | 📘 Facebook | Blue |

#### Props (EventLinks)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `websiteUrl` | `string \| null` | - | Event website URL |
| `instagramUrl` | `string \| null` | - | Instagram URL |
| `facebookUrl` | `string \| null` | - | Facebook URL |
| `ticketUrl` | `string \| null` | - | Ticket purchase URL |
| `registrationUrl` | `string \| null` | - | Registration URL |
| `variant` | `'full' \| 'compact'` | `'full'` | Display style |
| `className` | `string` | - | Additional CSS classes |

---

## 💾 Database Fields

### New Fields (Added 2026-01-06)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `website_url` | `TEXT` | Yes | Event's own website |
| `instagram_url` | `TEXT` | Yes | Instagram profile/post |
| `facebook_url` | `TEXT` | Yes | Facebook event/page |
| `registration_url` | `TEXT` | Yes | Registration/RSVP form |

### Existing Fields

| Column | Type | Description |
|--------|------|-------------|
| `start_datetime` | `TIMESTAMPTZ` | Event start (already existed) |
| `end_datetime` | `TIMESTAMPTZ` | Event end (already existed) |
| `ticket_url` | `TEXT` | Ticket purchase (already existed) |
| `is_all_day` | `BOOLEAN` | All-day flag (already existed) |

---

## 🚀 Running the Migration

### Option 1: Supabase Dashboard

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy contents of `supabase/migrations/20260106_event_links.sql`
3. Click **Run**

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed and linked
supabase db push
```

### Verify Migration

```sql
-- Run this in SQL Editor to verify columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name IN ('website_url', 'instagram_url', 'facebook_url', 'registration_url')
ORDER BY column_name;
```

Expected output:
```
 column_name      | data_type | is_nullable
------------------+-----------+-------------
 facebook_url     | text      | YES
 instagram_url    | text      | YES
 registration_url | text      | YES
 website_url      | text      | YES
```

---

## 🎭 Component States

### EventDateTime States

```
┌─────────────────────────────────────────────────────────────┐
│                    EVENT DATE TIME                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐     ┌──────────────┐                     │
│  │ Has Start    │ --> │ Has End?     │                     │
│  │ DateTime     │     │              │                     │
│  └──────────────┘     └──────┬───────┘                     │
│         │                    │                              │
│         ▼                    ▼                              │
│  ┌──────────────┐     ┌──────────────┐                     │
│  │ is_all_day?  │     │ Same Day?    │                     │
│  │              │     │              │                     │
│  └──────┬───────┘     └──────┬───────┘                     │
│         │                    │                              │
│    Yes  │  No          Yes   │   No                        │
│         ▼                    ▼                              │
│  "All Day"      "7:00 PM → 10:00 PM"  "Feb 14 → Feb 16"   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### EventLinks States

| Has Links | Renders |
|-----------|---------|
| None | Nothing (returns `null`) |
| Some | Only links with valid URLs |
| All | All 5 link types |

---

## 🐛 Troubleshooting

### Links Not Showing

| Issue | Cause | Solution |
|-------|-------|----------|
| "Links & More" section missing | No URLs in database | Add URLs to event |
| Link not appearing | URL doesn't start with `http(s)://` | Add full URL with protocol |
| Component returns null | All URL props are null/undefined | Check database values |

### Time Display Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| End time not showing | `end_datetime` is null | Add end time to event |
| Shows wrong time | Timezone mismatch | Check `start_datetime` includes timezone |
| "All Day" not showing | `is_all_day` is false | Set `is_all_day = true` |

### Debug Logging

Check browser console for these log messages:

```
🕐 [EventDateTime] Rendering: { startTime: "7:00 PM", endTime: "10:00 PM", ... }
📎 [EventLinks] Displaying 3 link(s)
📎 [EventLinks] No valid links to display
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `src/app/event/[slug]/page.tsx` | Event detail page |
| `src/components/events/event-date-time.tsx` | DateTime component |
| `src/components/events/event-links.tsx` | Links component |
| `src/components/events/index.ts` | Component exports |
| `src/lib/supabase/types.ts` | TypeScript types |
| `supabase/migrations/20260106_event_links.sql` | Database migration |

---

## 🧪 Test Checklist

### Event Detail Page
- [ ] Event with both start and end time displays correctly
- [ ] Event with only start time displays correctly
- [ ] All-day event shows "All Day Event"
- [ ] Multi-day event shows both dates
- [ ] Website link opens in new tab
- [ ] Instagram link opens in new tab
- [ ] Facebook link opens in new tab
- [ ] Registration link opens in new tab
- [ ] No links = no "Links & More" section
- [ ] Invalid URLs are not displayed

### Admin Quick Edit
- [ ] Superadmin toolbar shows on event page
- [ ] Quick edit drawer opens
- [ ] Link fields (website, instagram, facebook, registration) appear in form
- [ ] Saving links updates the event
- [ ] Changes reflect on page after refresh

### Event Submission Form (Step 5)
- [ ] Ticket URL field works
- [ ] Registration URL field works
- [ ] Website URL field works
- [ ] Instagram URL field works
- [ ] Facebook URL field works
- [ ] Links are saved with submitted event
- [ ] Links appear on published event page

---

## 🔧 Admin Edit Integration

The new link fields are also available in:

### Quick Edit Form (Superadmin)

Location: `src/components/admin-anywhere/quick-edit-form.tsx`

The quick edit drawer now includes an "External Links" section with:
- 🌐 Event Website
- 📝 Registration / RSVP URL
- 📸 Instagram
- 📘 Facebook Event

### Event Submission (Step 5: Pricing)

Location: `src/components/submit/steps/step-5-pricing.tsx`

Users can now add links when submitting events:
- Ticket Purchase URL
- Registration / RSVP URL
- Event Website
- Instagram
- Facebook Event

---

*Last updated: January 2026*

