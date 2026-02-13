# Chrome Extension Scraper Integration

Complete reference for the Chrome extension that scrapes event data from websites and sends it to the Happenlist API.

---

## Overview

Happenlist has a Chrome extension that scrapes event data from websites such as Eventbrite, Facebook Events, venue sites, and other event listing pages. The extension has its own separate backend service hosted on Render, independent from the Happenlist Next.js application deployed on Vercel.

The workflow:

1. The Chrome extension scrapes structured event data from a web page.
2. The extension sends the scraped data to its own backend on Render.
3. The Render backend processes the data, extracts images, and generates summaries.
4. The Render backend calls the Happenlist API to create the event and upload images.
5. The event lands in the admin review queue with status `pending_review`.
6. An admin reviews, edits, approves, or rejects the event before it goes live.

---

## Architecture Diagram

```
Chrome Extension (browser)
    |
    v
Extension Backend (Render)
    | Processes scraped data,
    | extracts images, generates summaries
    v
Happenlist API (Vercel/Next.js)
    | POST /api/scraper/events   <-- Create event
    | POST /api/images/upload    <-- Upload images
    v
Supabase (PostgreSQL + Storage)
    |
    v
Admin Review Queue --> Published Events
```

---

## Authentication

All requests from the extension backend to the Happenlist API use Bearer token authentication.

**Header format:**

```
Authorization: Bearer <SCRAPER_API_SECRET>
```

**How it works:**

- The `SCRAPER_API_SECRET` environment variable is set on the Happenlist server (Vercel).
- The same secret is configured on the extension backend (Render).
- The extension itself (running in the browser) never has direct access to the Supabase service role key. It communicates only with its own Render backend.
- If the secret is compromised, rotate the single `SCRAPER_API_SECRET` environment variable on both Vercel and Render.
- In development, if `SCRAPER_API_SECRET` is not set, the API allows unauthenticated requests with a console warning.

---

## API Endpoint: Create Event

```
POST /api/scraper/events
```

Creates a new event from scraped data. The event is always created with status `pending_review`.

### Required Fields

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | string | Min 3 characters, max 200 characters |
| `start_datetime` | string | ISO 8601 with timezone offset (e.g., `2026-02-14T19:00:00-06:00`) |
| `source_url` | string | URL of the page being scraped; used for deduplication |

### Recommended Fields

| Field | Type | Description |
|-------|------|-------------|
| `organizer_description` | string | Verbatim description text from the source page |
| `short_description` | string | Max 160 characters; first sentence or tagline for card displays |
| `description` | string | Cleaned/formatted event description |
| `happenlist_summary` | string | AI-generated editorial summary, 2-3 sentences, third person |
| `end_datetime` | string | ISO 8601 with timezone offset |
| `price_type` | string | One of: `free`, `fixed`, `range`, `varies`, `donation`, `per_session` |
| `price_low` | number | Lowest price in dollars (e.g., `25`) |
| `price_high` | number | Highest price in dollars (e.g., `50`) |
| `price_details` | string | Complex pricing text that does not fit into low/high (e.g., "VIP $100, GA $50") |
| `category_slug` | string | One of the 15 valid category slugs (see below) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `website_url` | string | Event or organizer website |
| `instagram_url` | string | Instagram link |
| `facebook_url` | string | Facebook link |
| `registration_url` | string | Registration/RSVP link |
| `ticket_url` | string | Ticket purchase link |
| `age_low` | number | Minimum age (e.g., `21`) |
| `age_high` | number | Maximum age (e.g., `65`) |
| `age_restriction` | string | Human-readable age note (e.g., "21+", "All ages") |
| `is_family_friendly` | boolean | Whether suitable for families/children |
| `good_for` | string[] | Array of audience tags (see below) |
| `is_all_day` | boolean | Whether this is an all-day event (defaults to `false`) |
| `timezone` | string | IANA timezone (defaults to `America/Chicago`) |
| `scraped_data` | object | Raw scraped JSON blob for debugging; stored but not displayed |

### Location

Provide either an existing location ID or a location object. Do not send both.

**Option A: Existing location**

```json
{
  "location_id": "uuid-of-existing-location"
}
```

**Option B: New or matched location**

```json
{
  "location": {
    "name": "The Paramount Theatre",
    "city": "Austin",
    "address_line": "713 Congress Ave",
    "state": "TX",
    "postal_code": "78701",
    "latitude": 30.2672,
    "longitude": -97.7431,
    "google_place_id": "ChIJ...",
    "venue_type": "venue"
  }
}
```

The `name` and `city` fields are required in the location object. All others are optional but strongly recommended.

**Location matching priority:**

1. **google_place_id** -- exact match (most reliable)
2. **Fuzzy name match** -- uses the `search_venues` RPC; requires similarity score > 0.7
3. **Create new** -- if no match is found, a new location is created with source `scraper`

### Organizer

Provide either an existing organizer ID or an organizer object. Do not send both.

**Option A: Existing organizer**

```json
{
  "organizer_id": "uuid-of-existing-organizer"
}
```

**Option B: New or matched organizer**

```json
{
  "organizer": {
    "name": "Austin Symphony Orchestra",
    "website_url": "https://austinsymphony.org",
    "email": "info@austinsymphony.org"
  }
}
```

Only `name` is required. The API matches by name using case-insensitive exact match (`ilike`). If no match is found, a new organizer is created.

### Success Response (201)

```json
{
  "success": true,
  "eventId": "uuid-of-new-event",
  "slug": "the-event-title-2026-02-14",
  "status": "pending_review",
  "locationId": "uuid-or-null",
  "organizerId": "uuid-or-null",
  "message": "Event created and queued for admin review."
}
```

### Duplicate Response (409)

Returned when an event with the same `source_url` already exists:

```json
{
  "success": false,
  "error": "duplicate",
  "message": "Event already exists: \"Concert in the Park\" (pending_review)",
  "existingEventId": "uuid-of-existing-event"
}
```

### Validation Error Response (400)

```json
{
  "error": "Validation failed",
  "details": [
    "title is required",
    "start_datetime is required (ISO 8601)"
  ]
}
```

---

## API Endpoint: Upload Images

```
POST /api/images/upload
```

Upload an event image to Supabase Storage. Call this after creating the event, using the `eventId` from the create response.

### Method 1: Re-host from URL

Download an image from an external URL and re-host it in Supabase Storage:

```json
{
  "eventId": "uuid-of-event",
  "sourceUrl": "https://cdn.example.com/event-hero.jpg",
  "type": "hero"
}
```

### Method 2: Upload base64 data

Upload a base64-encoded image directly:

```json
{
  "eventId": "uuid-of-event",
  "base64": "data:image/jpeg;base64,/9j/4AAQ...",
  "type": "thumbnail"
}
```

### Image Types

| Type | Description |
|------|-------------|
| `hero` | Main event image (default if `type` is omitted) |
| `thumbnail` | Smaller card image |
| `flyer` | Event flyer/poster |

### Success Response (200)

```json
{
  "success": true,
  "url": "https://your-project.supabase.co/storage/v1/object/public/event-images/events/uuid/hero_1234.jpg",
  "path": "events/uuid/hero_1234.jpg"
}
```

The `url` is the public Supabase CDN URL that can be used directly.

### Important: Extract Actual Image URLs

The `sourceUrl` must be an actual image URL, not a page URL. Extract image URLs from:

- `og:image` meta tag
- Direct CDN URLs (e.g., `https://img.evbuc.com/...`)
- Image `src` attributes

If the URL does not appear to be an image, the API returns a 400 error with a hint:

```json
{
  "error": "Invalid source URL - does not appear to be an image URL",
  "hint": "Make sure you're passing the actual image URL (e.g., from og:image), not the page URL",
  "sourceUrl": "https://eventbrite.com/e/some-event"
}
```

If the image is already hosted in Supabase Storage, the API short-circuits and returns the existing URL with `alreadyHosted: true`.

---

## Description Fields Strategy

The event detail page displays three description fields. Each serves a distinct purpose and appears in a specific section on the page. The extension should populate all three when possible.

### organizer_description (Required -- always send this)

The verbatim description text from the source page. Always send this field. Do not clean, summarize, or modify it. This preserves the original content exactly as the organizer wrote it. Displayed in a quoted "From the Organizer" section on the detail page.

### short_description (Strongly recommended)

A brief tagline or first sentence, max 160 characters. Displayed as italic text directly below the event title on the detail page, and used on event cards and in meta descriptions. If the source has a subtitle or tagline, use that. Otherwise, extract the first meaningful sentence from the description.

### happenlist_summary (Strongly recommended)

An AI-generated editorial summary written in third person, 2-3 sentences. Displayed in a highlighted "Happenlist Highlights" box on the detail page. This should read like a recommendation: what the event is, why it is interesting, and who it is for. Example:

> "The Austin Symphony Orchestra presents an evening of Beethoven's greatest works at The Paramount Theatre. This family-friendly concert features the iconic Fifth Symphony and is perfect for both classical music enthusiasts and first-time concertgoers."

### description (Optional -- not displayed on detail page)

A cleaned and formatted version of the event description. This field is **not shown on the event detail page** but is still used as an SEO fallback (when `meta_description` and `short_description` are both missing) and may be used in search indexing. Skip this field if it would be identical to `organizer_description` -- no need to duplicate data.

---

## Pricing Rules

The `is_free` column is a generated column in the database -- it is computed automatically from `price_type`. Never send `is_free` directly. Set `price_type` instead.

If `price_type` is not provided or is invalid, it defaults to `free`.

| Source Text | price_type | price_low | price_high | price_details |
|-------------|-----------|-----------|------------|---------------|
| "Free" | `free` | -- | -- | -- |
| "Free admission" | `free` | -- | -- | -- |
| "$25" | `fixed` | `25` | -- | -- |
| "$25.00 per person" | `fixed` | `25` | -- | -- |
| "$15 - $50" | `range` | `15` | `50` | -- |
| "$15 GA / $50 VIP" | `range` | `15` | `50` | `"$15 GA / $50 VIP"` |
| "Prices vary" | `varies` | -- | -- | -- |
| "Starting at $10" | `varies` | `10` | -- | `"Starting at $10"` |
| "Suggested donation $20" | `donation` | `20` | -- | `"Suggested donation $20"` |
| "Pay what you can" | `donation` | -- | -- | `"Pay what you can"` |
| "$30/session, 6 sessions" | `per_session` | `30` | -- | `"$30/session, 6 sessions"` |

When pricing is complex or does not fit neatly into `price_low` / `price_high`, put the full pricing text into `price_details`.

---

## Date/Time Rules

- Always send dates in ISO 8601 format with a timezone offset. Example: `2026-02-14T19:00:00-06:00`
- Do not send UTC times without an offset. The offset is essential for correct local time display.
- The `instance_date` field (YYYY-MM-DD) is automatically derived from `start_datetime` on the server. Do not send it.
- The default timezone is `America/Chicago` (Central Time). Only set `timezone` if the event is in a different timezone.
- For all-day events, set `is_all_day: true` and use midnight as the time (e.g., `2026-02-14T00:00:00-06:00`).

---

## Category Slugs

There are 15 valid `category_slug` values. Send one of these strings:

| Slug | Description |
|------|-------------|
| `music` | Concerts, live music, DJ sets |
| `arts-culture` | Art exhibits, gallery openings, cultural events |
| `family` | Family-friendly activities, kids events |
| `food-drink` | Food festivals, tastings, dining events |
| `sports-fitness` | Sports events, races, fitness classes |
| `nightlife` | Bar events, club nights, late-night entertainment |
| `community` | Meetups, neighborhood events, civic gatherings |
| `classes-workshops` | Educational classes, hands-on workshops |
| `festivals` | Multi-day festivals, street fairs |
| `theater-film` | Theater performances, film screenings |
| `markets-shopping` | Farmers markets, pop-up shops, craft fairs |
| `talks-lectures` | Speaker events, panels, lectures |
| `outdoors-nature` | Hikes, nature walks, outdoor activities |
| `charity-fundraising` | Charity events, galas, fundraisers |
| `holiday-seasonal` | Holiday celebrations, seasonal events |

If the event does not fit a category, omit `category_slug` rather than guessing.

---

## Good For Tags

The `good_for` field accepts an array of audience tag strings. These help users filter events by who they are best suited for.

Valid values:

| Tag | Description |
|-----|-------------|
| `date_night` | Romantic outings or couples activities |
| `families_young_kids` | Suitable for families with young children (under 6) |
| `families_older_kids` | Suitable for families with older children (6-12) |
| `pet_friendly` | Pets are welcome |
| `foodies` | Food and drink enthusiasts |
| `girls_night` | Fun group outings for women |
| `guys_night` | Fun group outings for men |
| `solo_friendly` | Comfortable for solo attendees |
| `outdoorsy` | Nature and outdoor enthusiasts |
| `creatives` | Artists, makers, and creative types |
| `music_lovers` | Music fans and audiophiles |
| `active_seniors` | Active older adults |
| `college_crowd` | College students and young adults |
| `first_timers` | Newcomers or people trying something for the first time |

Example:

```json
{
  "good_for": ["date_night", "foodies", "first_timers"]
}
```

---

## Deduplication

Events are deduplicated by `source_url`. If an event with the same `source_url` already exists in the database (regardless of its status), the API returns a `409 Conflict` response with the existing event's ID.

**Best practices:**

- Use the canonical URL of the event page, not shortened or tracking URLs.
- Strip UTM parameters and tracking query strings before sending.
- The extension should handle 409 responses gracefully -- display a message like "Event already exists" rather than treating it as an error.
- The 409 response includes the `existingEventId`, which can be used to link to the existing event or to upload additional images for it.

---

## Fields NOT to Send

The following fields are managed by the server. Do not include them in the request body:

| Field | Reason |
|-------|--------|
| `is_free` | Generated column, computed from `price_type` |
| `status` | Always set to `pending_review` by the API |
| `meta_title` | Auto-generated from event title |
| `meta_description` | Auto-generated from event description |
| `instance_date` | Auto-derived from `start_datetime` |
| `image_url` / `thumbnail_url` / `flyer_url` | Use `POST /api/images/upload` instead. Only send these directly if you already have a Supabase CDN URL from a prior upload. |

---

## Other API Endpoints

### GET /api/scraper/events

Returns documentation for the event creation endpoint, including required fields, recommended fields, location/organizer options, and deduplication behavior. Useful as a quick reference from the command line:

```bash
curl https://happenlist.com/api/scraper/events
```

### GET /api/images/upload

Returns documentation for the image upload endpoint, including both re-host and base64 upload methods:

```bash
curl https://happenlist.com/api/images/upload
```

### GET /api/images/test

Storage health check. Verifies that Supabase Storage is configured correctly, including environment variables, bucket existence, and public access settings. Returns a structured check report:

```bash
curl https://happenlist.com/api/images/test
```

### POST /api/images/test

Performs an actual test upload of a 1x1 pixel PNG to verify write access, then cleans up the test file.

### POST /api/events/[id]/make-recurring (superadmin, planned)

Convert a single event into a recurring event series. Requires superadmin authentication.

### POST /api/events/[id]/attach (superadmin, planned)

Attach an event to an existing recurring series. Requires superadmin authentication.

### POST /api/events/[id]/detach (superadmin, planned)

Detach an event from its recurring series, making it standalone again. Requires superadmin authentication.

---

## Typical Extension Workflow

A complete workflow for scraping and submitting an event:

```
1. User clicks extension on an Eventbrite page
2. Extension scrapes: title, date, price, description, image URLs, venue info
3. Extension sends scraped data to Render backend
4. Render backend:
   a. Cleans and validates the data
   b. Generates happenlist_summary via AI
   c. Extracts og:image URL for the hero image
5. Render backend calls POST /api/scraper/events
   - If 409: event already exists, notify user
   - If 201: continue with image upload
6. Render backend calls POST /api/images/upload with the eventId
7. Extension shows success: "Event submitted for review"
8. Admin reviews the event in the Happenlist admin panel
9. Admin approves, edits, or rejects the event
```

---

## Key Files in Happenlist Codebase

| File | Purpose |
|------|---------|
| `src/app/api/scraper/events/route.ts` | Event creation endpoint (POST) and self-documentation (GET) |
| `src/app/api/images/upload/route.ts` | Image upload endpoint (POST) and self-documentation (GET) |
| `src/app/api/images/test/route.ts` | Storage health check (GET) and test upload (POST) |

---

## Example: Full Event Creation Request

```bash
curl -X POST https://happenlist.com/api/scraper/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SCRAPER_API_SECRET" \
  -d '{
    "title": "Austin Symphony: Beethoven Night",
    "start_datetime": "2026-03-15T19:30:00-05:00",
    "end_datetime": "2026-03-15T21:30:00-05:00",
    "source_url": "https://austinsymphony.org/concerts/beethoven-night-2026",
    "organizer_description": "Join us for an unforgettable evening of Beethoven...",
    "short_description": "An evening of Beethoven classics at The Paramount.",
    "description": "Join us for an unforgettable evening featuring Beethoven'\''s Fifth Symphony and Moonlight Sonata, performed by the full Austin Symphony Orchestra.",
    "happenlist_summary": "The Austin Symphony Orchestra presents a night dedicated to Beethoven at The Paramount Theatre. The program features the iconic Fifth Symphony alongside the Moonlight Sonata, making it a great pick for classical music fans and newcomers alike.",
    "price_type": "range",
    "price_low": 25,
    "price_high": 85,
    "price_details": "$25 balcony / $55 orchestra / $85 premium",
    "category_slug": "music",
    "ticket_url": "https://austinsymphony.org/tickets",
    "website_url": "https://austinsymphony.org",
    "is_family_friendly": true,
    "good_for": ["date_night", "music_lovers", "first_timers"],
    "location": {
      "name": "The Paramount Theatre",
      "city": "Austin",
      "address_line": "713 Congress Ave",
      "state": "TX",
      "postal_code": "78701",
      "latitude": 30.2672,
      "longitude": -97.7431,
      "google_place_id": "ChIJLwPMoJm1RIYRx8VB5erIlQY",
      "venue_type": "venue"
    },
    "organizer": {
      "name": "Austin Symphony Orchestra",
      "website_url": "https://austinsymphony.org",
      "email": "info@austinsymphony.org"
    }
  }'
```

## Example: Image Upload Request

```bash
curl -X POST https://happenlist.com/api/images/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SCRAPER_API_SECRET" \
  -d '{
    "eventId": "uuid-returned-from-create",
    "sourceUrl": "https://cdn.austinsymphony.org/images/beethoven-night-hero.jpg",
    "type": "hero"
  }'
```
