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

| Column Group | Fields | Purpose |
|-------------|--------|---------|
| **Identity** | `id`, `title`, `slug` | Unique ID and URL-friendly slug |
| **Description** | `description`, `short_description`, `happenlist_summary`, `organizer_description` | Text content (see [Description Fields](#description-fields-on-events)) |
| **When** | `start_datetime`, `end_datetime`, `instance_date`, `is_all_day`, `timezone` | Date/time info |
| **Where** | `location_id` (FK) | Links to venues table |
| **Who** | `organizer_id` (FK) | Links to organizers table |
| **What kind** | `category_id` (FK) | Links to categories table |
| **Series** | `series_id` (FK), `series_sequence`, `is_series_instance` | Links to series table |
| **Pricing** | `price_type`, `price_low`, `price_high`, `price_details`, `is_free` (generated), `ticket_url` | Cost info |
| **Images** | `image_url`, `thumbnail_url`, `flyer_url` + hosted/storage variants | Visual assets |
| **Links** | `website_url`, `instagram_url`, `facebook_url`, `registration_url` | External URLs |
| **Age** | `age_low`, `age_high`, `age_restriction`, `is_family_friendly` | Audience restrictions |
| **Status** | `status`, `is_featured`, `featured_order` | Publication state |
| **Submission** | `submitted_by_email`, `submitted_by_name`, `submitted_at`, `source`, `source_url` | Who submitted it (see [Source Values](#source-values)) |
| **Review** | `reviewed_at`, `reviewed_by`, `review_notes`, `rejection_reason`, `change_request_message` | Admin review |
| **Editing** | `last_edited_at`, `last_edited_by`, `edit_count` | Edit history |
| **Soft delete** | `deleted_at`, `deleted_by`, `delete_reason` | Trash (not permanently deleted) |
| **Engagement** | `heart_count`, `view_count` | Popularity metrics |

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

| Column Group | Fields | Purpose |
|-------------|--------|---------|
| **Identity** | `id`, `title`, `slug` | Unique ID and URL |
| **Type** | `series_type` | What kind of series |
| **Schedule** | `start_date`, `end_date`, `total_sessions`, `sessions_remaining`, `recurrence_rule` | When it runs |
| **Camp/Class** | `attendance_mode`, `skill_level`, `age_low`, `age_high`, `days_of_week` | Camp/class-specific |
| **Extended care** | `core_start_time`, `core_end_time`, `extended_start_time`, `extended_end_time`, `extended_care_details` | Before/after care for camps |
| **Pricing** | `price_type`, `price_low`, `price_high`, `per_session_price`, `materials_fee`, `pricing_notes` | Cost details |
| **Registration** | `registration_url`, `capacity`, `waitlist_enabled`, `attendance_mode` | Sign-up info |
| **Grouping** | `term_name`, `parent_series_id` | Semester/program grouping |
| **Relationships** | `organizer_id`, `category_id`, `location_id` | Who/what/where |

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

### Unused/legacy columns on events

These columns exist in the database but are **not used by the application**. They are candidates for removal in a future cleanup migration:

| Column | Original purpose | Why unused |
|--------|-----------------|------------|
| `event_type` | Categorize event format | Never implemented; `series_type` on the series table serves this purpose for grouped events |
| `recurrence_parent_id` | Link recurring instances to a template event | Replaced by the series system (`series_type = 'recurring'`) |
| `is_recurrence_template` | Mark an event as a recurrence template | Replaced by the series system |
| `on_sale_date` | When tickets go on sale | Never implemented in the UI |

### Venue type ambiguity

The `venue_type` values mix two concepts: **physical type** (`venue`, `outdoor`, `online`, `various`, `tbd`) and **domain/purpose** (`entertainment`, `arts`, `sports`, `restaurant`, `community`, `education`). In practice:

- Use `outdoor`, `online`, `various`, or `tbd` when those clearly apply
- Use a domain type (`restaurant`, `education`, etc.) when the venue is primarily known for that purpose
- Use `venue` as the default/catch-all for general-purpose spaces (theaters, clubs, studios)

---

## Chrome Extension / Scraper Field Reference

The Chrome extension saves events from any website into the same database. Here's what it should populate:

### Required fields

| Field | Value | Notes |
|-------|-------|-------|
| `title` | Event name from page | Min 3 characters |
| `start_datetime` | Scraped date/time | ISO 8601 format |
| `instance_date` | Date portion only | `YYYY-MM-DD`, derived from `start_datetime` |
| `status` | `'pending_review'` | Always — goes through admin approval |
| `source` | `'scraper'` | Identifies this came from the extension |
| `source_url` | The URL being scraped | For dedup and admin reference |

### Recommended fields

| Field | Value | Notes |
|-------|-------|-------|
| `organizer_description` | Verbatim text from the event page | Preserves original wording |
| `short_description` | First 1-2 sentences | Max ~160 chars, used on cards |
| `description` | Cleaned/formatted version | General purpose |
| `price_type` | One of: `free`, `fixed`, `range`, `varies`, `donation` | Use `varies` if unclear |
| `price_low` / `price_high` | Numbers | Required for `fixed` and `range` |
| `price_details` | Full pricing text | "Early bird $20, door $30, VIP $50" |
| `end_datetime` | Event end time | ISO 8601, null if unknown |
| `category_id` | UUID of matching category | Needs lookup against `categories` table |

### Images

Images from external sites must be **re-hosted to Supabase Storage** (CDN URLs from Instagram, Facebook, etc. expire). Use the `/api/images/upload` endpoint:

| Field | Value | Notes |
|-------|-------|-------|
| `image_url` | Supabase CDN URL | After re-hosting via the upload API |
| `image_hosted` | `true` | Indicates the image is in our storage |
| `image_storage_path` | Storage bucket path | Returned by the upload API |
| `flyer_url` | Supabase CDN URL | For poster/flyer images (portrait aspect ratio) |
| `thumbnail_url` | Supabase CDN URL | Smaller version for cards |

### Location matching

The extension should try to match an existing venue before creating a new one:

1. Match by `google_place_id` (most reliable)
2. Match by `name` + `city` (fuzzy)
3. If no match, create a new `locations` row with: `name`, `address_line`, `city`, `state`, `postal_code`, `latitude`, `longitude`, `venue_type`

### Organizer matching

1. Match by `name` (case-insensitive, fuzzy)
2. If no match, create a new `organizers` row with: `name`, `slug`, `website_url`

### Full insert example

```sql
INSERT INTO events (
  -- Required
  title, start_datetime, instance_date, status, source, source_url,
  -- Descriptions
  organizer_description, short_description, description,
  -- Pricing
  price_type, price_low, price_high, price_details,
  -- Relationships
  category_id, location_id, organizer_id,
  -- Images (after re-hosting)
  image_url, image_hosted, image_storage_path,
  flyer_url, flyer_hosted, flyer_storage_path
) VALUES (
  'Jazz Night at the Pabst', '2026-02-14T19:00:00-06:00', '2026-02-14',
  'pending_review', 'scraper', 'https://example.com/jazz-night',
  'Join us for an evening of jazz...', 'Live jazz at the Pabst Theater',
  'An evening of jazz featuring local Milwaukee artists.',
  'range', 15, 50, 'General $15-30, VIP $50',
  '...category-uuid...', '...location-uuid...', '...organizer-uuid...',
  'https://your-project.supabase.co/storage/v1/...', true, 'events/abc/hero_123.jpg',
  'https://your-project.supabase.co/storage/v1/...', true, 'events/abc/flyer_123.jpg'
)
```
