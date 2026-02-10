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

When exporting events as a CSV, each row is one event. Related data is joined in:

| CSV Column | Source |
|------------|--------|
| `event_title` | `events.title` |
| `event_date` | `events.instance_date` |
| `category_name` | `categories.name` (via `events.category_id`) |
| `venue_name` | `locations.name` (via `events.location_id`) |
| `organizer_name` | `organizers.name` (via `events.organizer_id`) |
| `series_title` | `series.title` (via `events.series_id`) |

---

## Tables Reference

### 1. events (the core table)

Every row is one event on one date.

| Column Group | Fields | Purpose |
|-------------|--------|---------|
| **Identity** | `id`, `title`, `slug` | Unique ID and URL-friendly slug |
| **Description** | `description`, `short_description`, `happenlist_summary` | Text content |
| **When** | `start_datetime`, `end_datetime`, `instance_date`, `is_all_day`, `timezone` | Date/time info |
| **Where** | `location_id` (FK) | Links to venues table |
| **Who** | `organizer_id` (FK) | Links to organizers table |
| **What kind** | `category_id` (FK) | Links to categories table |
| **Series** | `series_id` (FK), `series_sequence`, `is_series_instance` | Links to series table |
| **Pricing** | `price_type`, `price_low`, `price_high`, `is_free` (generated), `ticket_url` | Cost info |
| **Images** | `image_url`, `thumbnail_url`, `flyer_url` + hosted/storage variants | Visual assets |
| **Links** | `website_url`, `instagram_url`, `facebook_url`, `registration_url` | External URLs |
| **Age** | `age_low`, `age_high`, `age_restriction`, `is_family_friendly` | Audience restrictions |
| **Status** | `status`, `is_featured`, `featured_order` | Publication state |
| **Submission** | `submitted_by_email`, `submitted_by_name`, `submitted_at`, `source` | Who submitted it |
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
- `locations.venue_type`: venue, outdoor, online, various, tbd

### Denormalized counts

`events.heart_count` and `series.heart_count` are denormalized — the `hearts` table is the source of truth. Similarly, `series.sessions_remaining` and `series.enrollment_count` need to be kept in sync with actual data. These exist for query performance and are maintained by app-level code.
