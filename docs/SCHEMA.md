# Database Schema & Data Model

> Complete reference for Happenlist's data model. Written for both developers
> and non-technical admins who need to understand how data is organized.

---

## How to Think About the Data

Happenlist stores **events** — things happening at specific places and times. Everything else supports events:

| Concept | Table | What it is | Example |
|---------|-------|------------|---------|
| **Event** | `events` | A single thing happening on a specific date | "Jazz Night - Feb 14" |
| **Series** | `series` | A group of related events | "Pottery 101 (6-week class)" |
| **Venue** | `locations` | A place where events happen | "Pabst Theater" |
| **Organizer** | `organizers` | Who runs the event | "Milwaukee Jazz Collective" |
| **Category** | `categories` | What kind of event | "Music", "Art", "Classes" |

---

## Entity Hierarchy

```
ORGANIZER (who)
  └── SERIES (optional grouping)
       └── EVENT (what + when)
            ├── CATEGORY (what kind)
            └── LOCATION (where)
```

**An event always has:** a title, a date, and a status.
**An event usually has:** a category, a location, and an organizer.
**An event sometimes has:** a series (if it's part of a class, camp, etc.).

### For CSV Exports

When exporting events as a CSV, each row is one event. Related data (category, venue, organizer, series) is joined in as flat columns. Here's a recommended CSV structure:

| CSV Column | Source | Example |
|------------|--------|---------|
| `event_title` | `events.title` | "Jazz Night" |
| `event_date` | `events.instance_date` | "2026-02-14" |
| `start_time` | `events.start_datetime` | "2026-02-14T19:00:00" |
| `end_time` | `events.end_datetime` | "2026-02-14T22:00:00" |
| `status` | `events.status` | "published" |
| `short_description` | `events.short_description` | "Live jazz at the Pabst" |
| `description` | `events.description` | Full description text |
| `price_type` | `events.price_type` | "range" |
| `price_low` | `events.price_low` | 15 |
| `price_high` | `events.price_high` | 50 |
| `price_details` | `events.price_details` | "GA $15-30, VIP $50" |
| `is_free` | `events.is_free` | false |
| `category_name` | `categories.name` (via `events.category_id`) | "Music" |
| `venue_name` | `locations.name` (via `events.location_id`) | "Pabst Theater" |
| `venue_address` | `locations.address_line` | "144 E Wells St" |
| `venue_city` | `locations.city` | "Milwaukee" |
| `organizer_name` | `organizers.name` (via `events.organizer_id`) | "MKE Jazz Collective" |
| `series_title` | `series.title` (via `events.series_id`) | "Winter Jazz Series" |
| `series_type` | `series.series_type` (via `events.series_id`) | "recurring" |
| `image_url` | `events.image_url` | URL to event image |
| `website_url` | `events.website_url` | External event page |
| `source` | `events.source` | "manual", "scraper", etc. |
| `age_restriction` | `events.age_restriction` | "21+" |
| `is_family_friendly` | `events.is_family_friendly` | true |
| `heart_count` | `events.heart_count` | 42 |

---

## Tables Reference

### 1. events (the core table)

Every row is one event on one date.

| Column Group | Fields | Purpose | Frontend Status |
|-------------|--------|---------|-----------------|
| **Identity** | `id`, `title`, `slug` | Unique ID and URL-friendly slug | Cards + detail + admin |
| **Description** | `description`, `short_description`, `happenlist_summary`, `organizer_description` | Text content (see [Description Fields](#description-fields-on-events)) | Detail page only (cards show none) |
| **When** | `start_datetime`, `end_datetime`, `instance_date`, `is_all_day`, `timezone` | Date/time info | Cards + detail + admin |
| **Where** | `location_id` (FK) | Links to venues table | Cards show name; detail shows full address + map |
| **Who** | `organizer_id` (FK) | Links to organizers table | Detail page only |
| **What kind** | `category_id` (FK) | Links to categories table | Cards (badge) + detail + filters |
| **Series** | `series_id` (FK), `series_sequence`, `is_series_instance` | Links to series table | Cards (badge); detail (admin toolbar) |
| **Pricing** | `price_type`, `price_low`, `price_high`, `price_details`, `is_free` (generated), `ticket_url` | Cost info | Cards show price; detail adds `price_details` + ticket button |
| **Images** | `image_url`, `thumbnail_url`, `flyer_url` + hosted/storage variants | Visual assets | Cards use `image_url`→`thumbnail_url` fallback; detail shows hero + flyer |
| **Links** | `website_url`, `instagram_url`, `facebook_url`, `registration_url` | External URLs | Detail page sidebar only |
| **Age** | `age_low`, `age_high`, `age_restriction`, `is_family_friendly` | Audience restrictions | **Not displayed on events** (only on series cards/pages). See [Cleanup Recommendations](#cleanup-recommendations) |
| **Status** | `status`, `is_featured`, `featured_order` | Publication state | Admin pages; filters queries |
| **Submission** | `submitted_by_email`, `submitted_by_name`, `submitted_at`, `source`, `source_url` | Who submitted it (see [Source Values](#source-values)) | Admin pages only |
| **Review** | `reviewed_at`, `reviewed_by`, `review_notes`, `rejection_reason`, `change_request_message` | Admin review | Admin pages only |
| **Editing** | `last_edited_at`, `last_edited_by`, `edit_count` | Edit history | Admin pages only |
| **Soft delete** | `deleted_at`, `deleted_by`, `delete_reason` | Trash (not permanently deleted) | Filters queries (never shown) |
| **Engagement** | `heart_count`, `view_count` | Popularity metrics | Heart button on cards + detail |
| **SEO** | `meta_title`, `meta_description` | Page metadata | `<head>` tags only (never visible in UI) |
| ~~**Legacy**~~ | ~~`event_type`, `recurrence_parent_id`, `is_recurrence_template`, `on_sale_date`~~ | Dropped in migration `20260211` | Removed |

#### Event Status Values

| Status | Meaning | Who sees it |
|--------|---------|-------------|
| `draft` | User is still writing it | Submitter only |
| `pending_review` | Waiting for admin approval | Submitter + Admin |
| `changes_requested` | Admin wants edits | Submitter + Admin |
| `published` | Live on the site | Everyone |
| `rejected` | Not approved | Submitter + Admin |
| `cancelled` | Was live, now cancelled | Everyone (with badge) |
| `postponed` | Date TBD | Everyone (with badge) |

#### Price Type Values

| Type | Meaning | Display |
|------|---------|---------|
| `free` | No cost | "Free" |
| `fixed` | One price | "$25" |
| `range` | Price range | "$15 - $50" |
| `varies` | Variable pricing | "Varies" |
| `donation` | Pay what you can | "Pay What You Can" |
| `per_session` | Per-session pricing | "$10/session" |

---

### 2. series (groups of events)

A series groups multiple events together. Not every event is in a series — standalone events have `series_id = NULL`.

Series cards display significantly more information than event cards — badges for attendance mode, age range, skill level, and extended care are all visible at a glance.

| Column Group | Fields | Purpose | Frontend Status |
|-------------|--------|---------|-----------------|
| **Identity** | `id`, `title`, `slug` | Unique ID and URL | Cards + detail |
| **Type** | `series_type` | What kind of series | Cards (badge) + detail + filters |
| **Schedule** | `start_date`, `end_date`, `total_sessions`, `sessions_remaining`, `recurrence_rule` | When it runs | Cards (date range, session count) + detail |
| **Camp/Class** | `attendance_mode`, `skill_level`, `age_low`, `age_high`, `days_of_week` | Camp/class-specific | Cards (all shown as badges) + detail + filters |
| **Extended care** | `core_start_time`, `core_end_time`, `extended_start_time`, `extended_end_time`, `extended_care_details` | Before/after care for camps | Cards (`has_extended_care` badge); detail (times + callout box) |
| **Pricing** | `price_type`, `price_low`, `price_high`, `per_session_price`, `materials_fee`, `pricing_notes` | Cost details | Cards (price range); detail (all pricing fields shown) |
| **Registration** | `registration_url`, `capacity`, `waitlist_enabled` | Sign-up info | Detail page CTA button; `capacity`/`waitlist_enabled` **not displayed** |
| **Grouping** | `term_name`, `parent_series_id` | Semester/program grouping | Detail shows `term_name`; `parent_series_id` **not displayed** |
| **Relationships** | `organizer_id`, `category_id`, `location_id` | Who/what/where | Cards (category + location name); detail (all) |
| **SEO** | `meta_title`, `meta_description` | Page metadata | `<head>` tags only |

#### Series Type Values

| Type | Meaning | Example |
|------|---------|---------|
| `class` | Multi-session course | "Pottery 101 - 6 weeks" |
| `camp` | Day camp or intensive | "Summer Art Camp" |
| `workshop` | Workshop series | "Bread Baking - 3 sessions" |
| `recurring` | Regular repeating event | "Weekly Jazz Jam" |
| `festival` | Multi-day festival | "Summerfest" |
| `season` | Performance season | "Symphony 2026 Season" |

#### Attendance Mode Values

| Mode | Meaning |
|------|---------|
| `registered` | Must sign up for the full series |
| `drop_in` | Show up to any individual session |
| `hybrid` | Register for full series or drop in |

#### Skill Level Values

| Level | Meaning |
|-------|---------|
| `beginner` | No experience needed |
| `intermediate` | Some experience helpful |
| `advanced` | Experienced practitioners |
| `all_levels` | Open to everyone |

---

### 3. locations (venues)

Where events happen. Called "venues" in the UI but `locations` in the database.

| Column Group | Fields | Purpose |
|-------------|--------|---------|
| **Identity** | `id`, `name`, `slug` | Unique ID and URL |
| **Address** | `address_line`, `address_line_2`, `city`, `state`, `postal_code`, `country` | Physical address |
| **Coordinates** | `latitude`, `longitude` | Map position |
| **Type** | `venue_type` | Kind of location |
| **Contact** | `website_url`, `phone` | Contact info |
| **Google data** | `google_place_id`, `rating`, `review_count`, `working_hours`, `google_category` | Imported from Google Maps |
| **Import** | `source`, `import_batch_id` | Where this venue record came from |

**Note:** The `google_category` column holds a Google Maps classification (e.g., "Music venue", "Restaurant"). This is NOT related to the `categories` table, which holds Happenlist's own event taxonomy.

#### Venue Type Values

| Type | Meaning |
|------|---------|
| `venue` | Fixed location (theater, club, studio) |
| `outdoor` | Parks, outdoor spaces |
| `online` | Virtual/online events |
| `various` | Multiple or varying locations |
| `tbd` | Location to be announced |
| `entertainment` | Entertainment venues (theaters, cinemas, bowling) |
| `arts` | Arts & culture venues (galleries, museums) |
| `sports` | Sports facilities (gyms, stadiums, fields) |
| `restaurant` | Restaurants, bars, cafes |
| `community` | Community centers, libraries, churches |
| `education` | Schools, universities, training centers |

---

### 4. organizers (who runs events)

| Field | Purpose |
|-------|---------|
| `id`, `name`, `slug` | Unique ID and URL |
| `description` | About the organizer |
| `logo_url` | Organizer logo |
| `website_url`, `email`, `phone` | Contact info |
| `social_links` | JSON: `{facebook, instagram, twitter, ...}` |
| `is_verified` | Admin-verified organizer |

---

### 5. categories (event types)

Static lookup table. Rarely changes.

| Field | Purpose |
|-------|---------|
| `id`, `name`, `slug` | Unique ID and URL |
| `icon` | Display icon name |
| `sort_order` | Display order in filters |
| `is_active` | Whether to show in UI |

---

### 6. hearts (saved events)

Users "heart" (save/like) events. One row per user-event pair.

| Field | Purpose |
|-------|---------|
| `user_id` | Who hearted it |
| `event_id` | Which event |
| `created_at` | When they saved it |

Constraint: unique on `(user_id, event_id)` — can't heart the same event twice.

---

### 7. user_follows (following entities)

Users follow organizers, venues, or categories to get updates.

| Field | Purpose |
|-------|---------|
| `user_id` | Who is following |
| `entity_type` | What they're following: `organizer`, `venue`, or `category` |
| `entity_id` | UUID of the followed entity |
| `notify_new_events` | Get notified about new events? |

Constraint: unique on `(user_id, entity_type, entity_id)`.

---

### 8. profiles (user preferences)

One profile per user, auto-created on sign-up.

| Field | Purpose |
|-------|---------|
| `id` | Matches `auth.users.id` |
| `display_name` | Shown in UI |
| `email_notifications` | Receive email alerts |
| `email_weekly_digest` | Receive weekly digest |
| `timezone` | For displaying event times |

---

### 9. event_drafts (in-progress submissions)

Stores partially-completed event submissions. Auto-expires after 30 days.

| Field | Purpose |
|-------|---------|
| `user_id`, `user_email` | Who is drafting |
| `draft_data` | JSONB with partial event fields |
| `series_draft_data` | JSONB with partial series fields (if creating a series) |
| `current_step` | Which form step they're on (1-7) |
| `completed_steps` | Array of completed step numbers |
| `submitted_event_id` | Links to the created event (after submission) |
| `expires_at` | Auto-cleanup date |

---

### 10. organizer_users (organizer claims)

Junction table linking users to organizers they manage.

| Field | Purpose |
|-------|---------|
| `user_id` | The user |
| `organizer_id` | The organizer profile |
| `role` | `member` or `admin` |
| `status` | `pending`, `verified`, or `rejected` |

---

### 11. admin_audit_log (activity tracking)

Every admin action is logged here.

| Field | Purpose |
|-------|---------|
| `action` | What happened: `event_approved`, `event_rejected`, etc. |
| `entity_type` | What type: `event`, `series`, `organizer` |
| `entity_id` | Which entity |
| `admin_email` | Who did it |
| `changes` | JSONB diff of what changed |
| `notes` | Admin's notes |

---

## Relationship Diagram

```
categories ──1:N──► events ◄──N:1── locations
                       │                  │
                       │                  └── google_place_id (dedup)
                       │
organizers ──1:N──► events
     │
     └──1:N──► series ──1:N──► events
                  │
                  └── parent_series_id (self-ref, for multi-week camp programs)

auth.users ──1:1──► profiles
     │
     ├──1:N──► hearts ◄──N:1── events
     │
     ├──1:N──► user_follows ──► (organizers | locations | categories)
     │
     ├──1:N──► event_drafts
     │
     └──1:N──► organizer_users ◄──N:1── organizers
```

---

## Design Notes

### `is_free` is a generated column

`is_free` on both `events` and `series` is a **PostgreSQL generated column**: it automatically equals `price_type = 'free'`. You cannot set it manually in INSERT or UPDATE statements — it's always computed from `price_type`. This guarantees the two fields can never drift out of sync.

### `google_category` on locations

The `google_category` column on the `locations` table holds a Google Maps classification (e.g., "Music venue", "Restaurant"). This is completely separate from the `categories` table, which holds Happenlist's own event taxonomy (e.g., "Music", "Art"). The column was renamed from `category` to `google_category` to avoid confusion.

### CHECK constraints on enum columns

All TEXT enum columns have database-level CHECK constraints that prevent invalid values:
- `events.status`: draft, pending_review, changes_requested, published, rejected, cancelled, postponed
- `events.price_type`: free, fixed, range, varies, donation, per_session
- `series.series_type`: class, camp, workshop, recurring, festival, season
- `series.status`: same as events
- `series.price_type`: same as events
- `series.attendance_mode`: registered, drop_in, hybrid
- `series.skill_level`: beginner, intermediate, advanced, all_levels
- `locations.venue_type`: venue, outdoor, online, various, tbd, entertainment, arts, sports, restaurant, community, education

### Denormalized counts

`events.heart_count` and `series.heart_count` are denormalized — the `hearts` table is the source of truth. Similarly, `series.sessions_remaining` and `series.enrollment_count` need to be kept in sync with actual data. These exist for query performance and are maintained by app-level code.

### Description fields on events

Events have four separate text fields for descriptions. Each serves a different purpose:

| Field | What it is | Who writes it | Example |
|-------|-----------|---------------|---------|
| `description` | General cleaned-up description | Admin/scraper | "Live jazz featuring the Milwaukee Trio..." |
| `short_description` | One-line teaser for cards | Admin/scraper | "Live jazz at the Pabst Theater" (max ~160 chars) |
| `happenlist_summary` | Editorial third-person summary | Happenlist staff/AI | "This intimate jazz show highlights three of Milwaukee's finest..." |
| `organizer_description` | Verbatim copy from the source | Scraper/submitter | The exact text from the event page, preserving original formatting |

For CSV exports, `description` and `short_description` are the most useful. `organizer_description` preserves the original source text for reference.

### Source values

The `source` field on events tracks where the event came from. Current values used:

| Value | Meaning |
|-------|---------|
| `manual` | Created by an admin in the database (default) |
| `scraper` | Imported by the Chrome extension or automated scraper |
| `user_submission` | Submitted through the website's submission form |
| `api` | Created via API |
| `import` | Bulk imported |

**Note:** This field does not currently have a CHECK constraint. The `source_url` field stores the original URL the event was scraped/imported from.

### Dropped legacy columns (migration `20260211`)

These columns were removed from the database. Listed here for historical reference:

| Column | Original purpose | Why removed |
|--------|-----------------|-------------|
| `event_type` | Categorize event format | Never implemented; `series_type` on series table serves this purpose |
| `recurrence_parent_id` | Link recurring instances to a template | Replaced by the series system (`series_type = 'recurring'`) |
| `is_recurrence_template` | Mark an event as a recurrence template | Replaced by the series system |
| `recurrence_pattern` | JSON recurrence rules on events | Replaced by `series.recurrence_rule` |
| `on_sale_date` | When tickets go on sale | Never implemented in the UI |

### Unused fields on events (exist but not displayed)

These fields have data in the database but are **never shown in the public frontend**. They may still be useful for future features:

| Column | Status | Notes |
|--------|--------|-------|
| `age_restriction` | **Not displayed** | Only `age_low`/`age_high` on series are shown. This text field on events is never rendered. |
| `is_family_friendly` | **Not displayed** | Exists in DB but no UI shows it. Could be a useful filter or badge but isn't implemented. |
| `age_low`, `age_high` (on events) | **Not displayed** | Series cards/pages show age ranges, but event cards/pages do not. |
| `view_count` | **Not displayed** | Tracked in DB but never shown to users (heart_count IS shown). |

### Unused fields on series

| Column | Status | Notes |
|--------|--------|-------|
| `parent_series_id` | **Not displayed** | Self-referencing FK for grouping series into programs. Schema supports it but no UI renders it. |
| `capacity` | **Not displayed** | Exists in DB, never shown in cards or detail pages. |
| `waitlist_enabled` | **Not displayed** | Same — exists but not surfaced. |

### Venue type ambiguity

The `venue_type` values mix two concepts: **physical type** (`venue`, `outdoor`, `online`, `various`, `tbd`) and **domain/purpose** (`entertainment`, `arts`, `sports`, `restaurant`, `community`, `education`). In practice:

- Use `outdoor`, `online`, `various`, or `tbd` when those clearly apply
- Use a domain type (`restaurant`, `education`, etc.) when the venue is primarily known for that purpose
- Use `venue` as the default/catch-all for general-purpose spaces (theaters, clubs, studios)

---

## Chrome Extension / Scraper Integration

The Chrome extension (and any external scraper) uses two API endpoints to save events. It should **never** have the Supabase service role key — all database access goes through these authenticated endpoints.

### Architecture (Supabase best practice)

```
Chrome Extension                  Happenlist Server                 Supabase
──────────────                  ──────────────────                 ────────
                   HTTPS + Bearer token
  ┌──────────┐   ──────────────────────►   ┌──────────────────┐
  │ Scrapes  │                             │ /api/scraper/    │   service role key
  │ event    │   POST /api/scraper/events  │ events           │ ──────────────────► DB
  │ data     │   ◄─────────── eventId ──── │ (validates,      │
  │          │                             │  deduplicates,   │
  │ Captures │   POST /api/images/upload   │  resolves venue/ │
  │ images   │   ──────────────────────►   │  organizer)      │ ──────────────────► Storage
  └──────────┘   ◄── Supabase CDN URL ─── │                  │
                                           └──────────────────┘
```

**Why not use the Supabase client directly?**
- The Chrome extension runs in the user's browser. Embedding a service role key would expose full database access to anyone who inspects the extension.
- The `SCRAPER_API_SECRET` is a simple shared secret. If compromised, you rotate one env var. If the service role key leaks, you must regenerate it and update every server.
- The API layer validates inputs, deduplicates by `source_url`, and auto-resolves venues/organizers.

### Setup

```bash
# 1. Generate a secret for the extension
openssl rand -base64 32
# → Set as SCRAPER_API_SECRET in your environment

# 2. Ensure Supabase Storage bucket exists
# Dashboard → Storage → New Bucket → "event-images" → Public

# 3. Extension config
HAPPENLIST_API_URL=https://your-domain.com
HAPPENLIST_API_SECRET=<the secret from step 1>
```

### Step 1: Create the event

```
POST /api/scraper/events
Authorization: Bearer <SCRAPER_API_SECRET>
Content-Type: application/json
```

**Required fields:**

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Min 3, max 200 chars |
| `start_datetime` | string | ISO 8601 (e.g. `2026-02-14T19:00:00-06:00`) |
| `source_url` | string | The URL being scraped (used for dedup) |

**Recommended fields:**

| Field | Type | Notes |
|-------|------|-------|
| `description` | string | Cleaned event description |
| `short_description` | string | Max 160 chars, used on cards |
| `organizer_description` | string | Verbatim from source page |
| `end_datetime` | string | ISO 8601 |
| `price_type` | string | `free`, `fixed`, `range`, `varies`, `donation` |
| `price_low` / `price_high` | number | Required for `fixed` and `range` |
| `price_details` | string | Complex pricing text |
| `category_slug` | string | e.g. `"music"`, `"art"` — looked up automatically |
| `website_url` | string | Event's external page |
| `age_restriction` | string | e.g. `"21+"` |
| `is_family_friendly` | boolean | Family-friendly flag |

**Location — provide one of:**

| Option | Fields |
|--------|--------|
| Existing venue | `location_id: "uuid"` |
| New/auto-match | `location: { name, city, address_line?, state?, postal_code?, latitude?, longitude?, google_place_id?, venue_type? }` |

The API auto-matches by `google_place_id` first, then fuzzy name match (score > 0.7), then creates a new venue.

**Organizer — provide one of:**

| Option | Fields |
|--------|--------|
| Existing organizer | `organizer_id: "uuid"` |
| New/auto-match | `organizer: { name, website_url?, email? }` |

The API auto-matches by name (case-insensitive), then creates a new organizer.

**Example request:**

```json
{
  "title": "Jazz Night at the Pabst",
  "start_datetime": "2026-02-14T19:00:00-06:00",
  "end_datetime": "2026-02-14T22:00:00-06:00",
  "source_url": "https://pabsttheater.org/event/jazz-night",
  "organizer_description": "Join us for an evening of jazz featuring the Milwaukee Trio...",
  "short_description": "Live jazz at the Pabst Theater",
  "description": "An evening of jazz featuring local Milwaukee artists.",
  "price_type": "range",
  "price_low": 15,
  "price_high": 50,
  "price_details": "General $15-30, VIP $50",
  "category_slug": "music",
  "location": {
    "name": "Pabst Theater",
    "address_line": "144 E Wells St",
    "city": "Milwaukee",
    "state": "WI",
    "google_place_id": "ChIJ..."
  },
  "organizer": {
    "name": "Milwaukee Jazz Collective",
    "website_url": "https://mkejazz.org"
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "eventId": "abc-123-def",
  "slug": "jazz-night-at-the-pabst",
  "status": "pending_review",
  "locationId": "loc-456",
  "organizerId": "org-789",
  "message": "Event created and queued for admin review."
}
```

**Dedup (409 Conflict):** If `source_url` already exists:

```json
{
  "success": false,
  "error": "duplicate",
  "message": "Event already exists: \"Jazz Night\" (published)",
  "existingEventId": "abc-123-def"
}
```

### Step 2: Upload images

After creating the event, upload images using the returned `eventId`:

```
POST /api/images/upload
Authorization: Bearer <SCRAPER_API_SECRET>
Content-Type: application/json
```

```json
{
  "eventId": "abc-123-def",
  "sourceUrl": "https://img.evbuc.com/actual-image.jpg",
  "type": "hero"
}
```

Or for base64 (captured directly by the extension):

```json
{
  "eventId": "abc-123-def",
  "base64": "data:image/jpeg;base64,/9j/4AAQ...",
  "type": "hero"
}
```

**Image types:** `hero` (main image), `thumbnail` (card image), `flyer` (poster/portrait).

**Important:** The extension must extract the actual image URL (e.g. from `og:image`), not the page URL. See `AI_DEV_DOCS_ARCHIVE/11-IMAGE-SCRAPING.md` for extraction patterns per platform.

**Response:**

```json
{
  "success": true,
  "url": "https://your-project.supabase.co/storage/v1/object/public/event-images/events/abc-123/hero_123_abc.jpg",
  "path": "events/abc-123/hero_123_abc.jpg"
}
```

**After uploading, the event's image fields are NOT automatically updated.** The extension should either:
- Include the Supabase CDN URL in the initial POST to `/api/scraper/events` (if it uploads first), or
- Accept that images will be linked later during admin review.

### API reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/scraper/events` | `POST` | Bearer token | Create event + auto-resolve venue/organizer |
| `/api/scraper/events` | `GET` | None | Endpoint documentation |
| `/api/images/upload` | `POST` | Bearer token | Upload/re-host images to Supabase Storage |
| `/api/images/upload` | `GET` | None | Endpoint documentation |
| `/api/images/test` | `GET` | None | Storage configuration health check |

---

## Cleanup Recommendations

### Done (migration: `20260211_drop_legacy_and_source_constraint.sql`)

- **Dropped dead columns:** `event_type`, `recurrence_parent_id`, `is_recurrence_template`, `on_sale_date`, `recurrence_pattern` — removed from DB and `types.ts`.
- **Added CHECK constraint** on `events.source` (`manual`, `scraper`, `user_submission`, `api`, `import`).
- **Added CHECK constraint** on `locations.source` (`manual`, `scraper`, `csv_import`, `user_submitted`, `api`).
- **Added `EventSource` type** to `types.ts` (was imported but never defined).
- **Created `/api/scraper/events`** endpoint — Chrome extension no longer needs direct DB access.

### Remaining: Decide on age/family fields for events

Events have `age_low`, `age_high`, `age_restriction`, and `is_family_friendly` — but none are displayed on event cards or event detail pages. Only series pages show age info. Options:

- **Option A: Display them.** Add age badges and a family-friendly indicator to event detail pages (and optionally cards). Useful for standalone events like 21+ bar shows or family festivals.
- **Option B: Remove from events, keep on series.** If age restrictions only matter for camps/classes, drop the event-level columns.
- **Option C: Leave as-is.** Keep for future use but note they're not displayed yet.

**Recommendation:** Option A for `age_restriction` and `is_family_friendly` — these are useful for standalone events. The `age_low`/`age_high` numeric fields make more sense on series (camps for ages 6-12) than on individual events.

### Remaining: Clean up `venue_type` taxonomy

The current enum mixes physical types and domain purposes. A cleaner approach (if worth the migration effort):

```
Physical: venue | outdoor | online | various | tbd
Domain:   entertainment | arts | sports | restaurant | community | education
```

Two options:
- **Split into two columns:** `venue_type` (physical) + `venue_domain` (purpose). More precise, more complex.
- **Collapse to fewer values:** Keep `outdoor`, `online`, `various`, `tbd` for special cases. For everything else, just use the domain type. Drop `venue` as a catch-all in favor of requiring a domain classification.

**Recommendation:** Low priority. The current approach works. Just document the usage guidance (already done above). Revisit when/if venue filtering becomes a major feature.

### Remaining: Consider a tags/labels system

Events have exactly one `category_id`. For cross-cutting concerns (an event that's "Music" AND "Food", or a "Family-friendly Outdoor Concert"), the single-category model is limiting. A lightweight tags table would help:

```sql
CREATE TABLE event_tags (
  event_id UUID REFERENCES events(id),
  tag TEXT NOT NULL,
  PRIMARY KEY (event_id, tag)
);
```

**Recommendation:** Low priority. Only pursue if category limitations become a real pain point for data entry or filtering. The current single-category model is simple and works for most events.

### Not recommended to remove

These fields are useful even though they're not displayed yet:

| Field | Why keep it |
|-------|------------|
| `parent_series_id` | Needed for multi-week camp programs (Phase 5 feature) |
| `capacity`, `waitlist_enabled` | Needed for registration features (Phase 5/6) |
| `view_count` | Analytics value even if not shown to users |
| `meta_title`, `meta_description` | Used for SEO `<head>` tags, just not visible in UI |
