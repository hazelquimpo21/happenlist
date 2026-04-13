# Happenlist Feature Guide

Consolidated feature reference for the Happenlist app -- a Next.js + Supabase local events directory focused on Milwaukee.

This document is intended for developers onboarding to the codebase and for Claude Code agents building new features. Each section covers the what, the where, and the API surface.

---

## Table of Contents

1. [Authentication and User System](#1-authentication-and-user-system)
2. [Event Submission and Approval](#2-event-submission-and-approval)
3. [Series and Recurring Events](#3-series-and-recurring-events)
4. [Admin Anywhere (Superadmin Editing)](#4-admin-anywhere-superadmin-editing)
5. [Smart Address System and Maps](#5-smart-address-system-and-maps)
6. [Event Detail Page Components](#6-event-detail-page-components)
7. [Good For Audience Tags](#7-good-for-audience-tags)
8. [Categories](#8-categories)
9. [Smart Filters](#9-smart-filters)
10. [View Tracking](#10-view-tracking)

---

## 1. Authentication and User System

### Overview

Authentication is passwordless, using Supabase Auth magic links. Users click a link in their email to log in -- no passwords are stored or managed.

### Auth Flow

1. User visits `/auth/login` and enters their email.
2. Supabase sends a magic link email.
3. User clicks the link, which redirects to `/auth/callback`.
4. The callback exchanges the token for a session and redirects the user into the app.

### User Roles

| Role | Capabilities |
|------|-------------|
| **Guest** | Browse events only. No account required. |
| **Attendee** | Submit events, heart events, follow organizers. Requires login. |
| **Organizer** | Manage their own events (edit, update status). |
| **Admin** | Approve/reject submitted events, access admin review queue. Granted via `ADMIN_EMAILS` env var. |
| **Superadmin** | Edit any event from anywhere in the app (Admin Anywhere toolbar). Granted via `SUPERADMIN_EMAILS` env var. |

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/hearts` | Heart (favorite) an event |
| GET | `/api/hearts` | List hearted events for the current user |
| POST | `/api/follows` | Follow an organizer |
| GET | `/api/profile` | Get current user profile |
| PATCH | `/api/profile` | Update current user profile |

### User Pages

- `/my/hearts` -- Events the user has hearted.
- `/my/submissions` -- Events the user has submitted, with status tracking.
- `/my/settings` -- Profile and notification preferences.

### Key Files

- `src/app/auth/` -- Login page, callback handler, auth-related routes.
- `src/contexts/auth-context.tsx` -- React context providing auth state to the component tree.
- `src/hooks/use-auth.ts` -- Hook for consuming auth state and actions in components.
- `src/lib/auth/` -- Server-side auth utilities (role checks, session helpers).

---

## 2. Event Submission and Approval

### Overview

Any logged-in user can submit an event through a guided multi-step form. Submissions enter a review queue where admins approve, reject, or request changes before events go live.

### Submission Form

The form at `/submit/new` has 7 steps:

1. **Basic Info** -- Title, category, short description.
2. **Event Type** -- One-time, recurring, series, etc.
3. **Date/Time** -- Start/end dates and times, all-day toggle, multi-day support.
4. **Location** -- Venue search (from pre-loaded venues) or manual address entry.
5. **Pricing** -- Free, paid, sliding scale, donation-based. Price fields as applicable.
6. **Image** -- Flyer or event image upload.
7. **Review** -- Summary of all entered data before final submission.

### Auto-Save Drafts

Form progress is automatically saved to the `event_drafts` table. Drafts expire after 30 days. Users can return to `/submit/new` and resume where they left off.

### Status Flow

```
draft --> pending_review --> published
                |
                +--> changes_requested --> resubmit --> pending_review
                |
                +--> rejected
```

- **draft**: User is still filling out the form.
- **pending_review**: Submitted and awaiting admin review.
- **published**: Approved and visible to all users.
- **changes_requested**: Admin asked the submitter to revise (includes a message explaining what to fix).
- **rejected**: Admin declined the submission (includes a reason).

### Admin Review

- **Review queue**: `/admin/events/pending` -- lists all events in `pending_review` status.
- **Admin actions**: Approve, reject (with reason), or request changes (with message).
- **Audit logging**: Every admin action is recorded in the `admin_audit_log` table with the admin's user ID, action type, timestamp, and any associated message.

### Key Files

- `src/app/submit/` -- Submission flow pages and layout.
- `src/components/submit/steps/` -- Individual step components (BasicInfoStep, DateTimeStep, etc.).
- `src/data/submit/` -- Data layer for draft persistence and submission.
- `src/app/admin/` -- Admin pages including the review queue.

---

## 3. Series and Recurring Events

### Overview

A series groups related events under a single parent entity. This covers everything from weekly recurring events to multi-day camps and seasonal festivals.

### Series Types

| Type | Use Case |
|------|----------|
| `class` | Ongoing class with regular sessions |
| `camp` | Multi-day camp (summer camps, day camps) |
| `workshop` | One-off or short-run workshop |
| `recurring` | Generic recurring event (weekly trivia, monthly meetup) |
| `festival` | Multi-day festival with sub-events |
| `season` | Seasonal programming (theater season, concert series) |

### Data Model

- **Series to Events** is a 1:N relationship via `series_id` foreign key on the events table.
- One series can have many event instances.

### Camp and Class Fields

These fields apply specifically to class and camp series types:

- `attendance_mode`: `registered`, `drop_in`, or `hybrid`.
- `skill_level`: Beginner, intermediate, advanced, all levels.
- Age range: Minimum and maximum age for participants.
- Extended care times: Before/after care availability for camps.

### Recurrence Rules

The `recurrence_rule` JSONB column on the series table defines how events repeat:

- `frequency`: daily, weekly, monthly.
- `interval`: Every N periods (e.g., every 2 weeks).
- `days_of_week`: Array of days (e.g., `["monday", "wednesday"]`).
- `exclude_dates`: Array of specific dates to skip.

### Auto-Replenishment

Recurring event instances are generated automatically to maintain a buffer of upcoming dates:

- **Nightly cron**: Scheduled job creates future instances as needed.
- **On-read fallback**: If the buffer is low when a series is loaded, new instances are generated on the fly.

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/events/[id]/make-recurring` | Convert a single event into a recurring series (admin) |
| POST | `/api/series/[id]/skip-date` | Add a skip date to a recurring series |
| POST | `/api/events/[id]/attach` | Attach an existing event to a series |
| POST | `/api/events/[id]/detach` | Detach an event from its series |

### Series Filtering

Events within a series (and series listings) can be filtered by:

- Series type (class, camp, workshop, etc.)
- Attendance mode (registered, drop-in, hybrid)
- Skill level
- Age range
- Extended care availability
- Day of week

### Key Files

- `src/data/series/` -- Data access layer for series CRUD and recurrence logic.
- `src/components/series/` -- Series display and management components.
- `src/app/series/` -- Series listing and detail pages.

---

## 4. Admin Anywhere (Superadmin Editing)

### Overview

Superadmins can edit any event directly from its public detail page, without navigating to the admin panel. A floating toolbar appears on event pages when a superadmin is logged in.

### Floating Toolbar

- Appears on event detail pages for users whose email is in the `SUPERADMIN_EMAILS` env var.
- Provides a quick edit drawer that opens in-place over the event page.

### Quick Edit Drawer

Editable fields in the drawer:

- Title
- Descriptions (short description, happenlist summary, organizer description, about)
- Dates (start, end)
- Pricing
- Status (published, pending, etc.)
- External links (website, Instagram, Facebook, registration, tickets)
- Good For tags

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| PATCH | `/api/superadmin/events/[id]` | Update event fields |
| POST | `/api/superadmin/events/[id]/status` | Change event status |
| DELETE | `/api/superadmin/events/[id]` | Delete an event |

### Audit Logging

All edits made through Admin Anywhere are logged to the `admin_audit_log` table, same as standard admin actions.

### Key Files

- `src/components/admin-anywhere/` -- Floating toolbar, quick edit drawer, and related UI components.

---

## 5. Smart Address System and Maps

### Overview

Happenlist maintains a pre-loaded database of Milwaukee venues to streamline event location entry. New venues can be added via Mapbox autocomplete or bulk imported from Google Maps exports.

### Pre-Loaded Venues

- 3500+ Milwaukee-area venues stored in the `locations` table.
- Fuzzy search powered by the `search_venues()` Postgres function, allowing users to find venues by partial name or address.

### Address Autocomplete

- For venues not in the database, Mapbox address autocomplete is available.
- New addresses entered this way can be saved to the locations table for future use.

### Map Display

- `VenueMap` component renders a map pin for the event's location on detail pages.

### Venue Import System

Bulk venue imports are handled by scripts in `scripts/venue-import/`:

- Accepts CSV files exported from Google Maps (saved places, lists, etc.).
- Parses and deduplicates venues before inserting into the locations table.

### Key Files

- `src/components/maps/` -- VenueMap and map-related display components.
- `scripts/venue-import/` -- CSV import scripts and utilities for bulk venue loading.

---

## 6. Event Detail Page Components

### Overview

The event detail page is composed of several specialized components, each handling a distinct aspect of the event's presentation.

### EventDateTime

Displays start and end times with support for:

- Standard time ranges (e.g., "Fri, Mar 14, 7:00 PM - 10:00 PM").
- All-day events (no specific time shown).
- Multi-day events (date range display).

### EventLinks

Renders external links associated with the event:

- Website URL
- Instagram profile
- Facebook event or page
- Registration link
- Ticket purchase link

Each link type has its own icon and label.

### Good For Pills

Displays audience tags as colored pills (e.g., "Date Night", "Families with Young Kids"). Each pill is clickable and links to the `/events` page filtered by that tag. See [Section 7](#7-good-for-audience-tags) for the full tag list.

### Description Sections

The event detail page displays three description fields:

| Field | Purpose | Display Location |
|-------|---------|-----------------|
| `short_description` | Brief tagline | Italic text directly under the event title |
| `happenlist_summary` | AI-generated editorial highlights | Highlighted "Happenlist Highlights" box (blue accent) |
| `organizer_description` | Verbatim text from the event organizer | Quoted "From the Organizer" section |

The `description` field is not displayed on the detail page but is retained for SEO fallback purposes.

### FlyerLightbox

Fullscreen viewer for event flyers. Displayed at the top of the sidebar on the event detail page. Opens a fullscreen modal when clicked.

### Image Layout

- **Flyer**: Shown at the top of the sidebar as a clickable lightbox thumbnail. This is the primary visual on the detail page.
- **Hero image**: Only displayed when no flyer exists. Falls back to a letter placeholder if no images are available.
- **Thumbnails**: Used primarily on event cards in listing grids, not prominently on the detail page.

### CTA Buttons

The sidebar shows up to two call-to-action buttons:

1. **Primary CTA** (ticket or registration, if applicable):
   - **Get Tickets** -- if `ticket_url` exists
   - **Register / RSVP** -- if `registration_url` exists (and no `ticket_url`)
2. **Learn More** -- always shown when `website_url` exists; links to the original event page. Styled as secondary when a ticket/registration button is above it, or as primary when it's the only button.

---

## 7. Good For Audience Tags

### Overview

Good For tags help users find events that match their interests or group type. They are stored as a `TEXT[]` (text array) column on the events table.

### Valid Tags

There are 14 valid slugs:

| Slug | Display Label |
|------|--------------|
| `date_night` | Date Night |
| `families_young_kids` | Families with Young Kids |
| `families_older_kids` | Families with Older Kids |
| `pet_friendly` | Pet Friendly |
| `foodies` | Foodies |
| `girls_night` | Girls Night |
| `guys_night` | Guys Night |
| `solo_friendly` | Solo Friendly |
| `outdoorsy` | Outdoorsy |
| `creatives` | Creatives |
| `music_lovers` | Music Lovers |
| `active_seniors` | Active Seniors |
| `college_crowd` | College Crowd |
| `first_timers` | First Timers |

### How Tags Are Set

- By admins during event review in the approval queue.
- By superadmins via the Admin Anywhere quick edit drawer.
- Programmatically via the scraper API during automated event ingestion.

### How Tags Are Used

- Displayed as colored pills on event detail pages (see [EventDetail components](#6-event-detail-page-components)).
- Filterable on the `/events` listing page -- users can select one or more Good For tags to narrow results.

---

## 8. Categories

### Overview

Every event belongs to exactly one category. Categories provide the primary organizational taxonomy for browsing and filtering.

### Category List

There are 15 categories:

1. Music
2. Arts & Culture
3. Family
4. Food & Drink
5. Sports & Fitness
6. Nightlife
7. Community
8. Classes & Workshops
9. Festivals
10. Theater & Film
11. Markets & Shopping
12. Talks & Lectures
13. Outdoors & Nature
14. Charity & Fundraising
15. Holiday & Seasonal

### Design Principles

- **One category per event.** If an event spans multiple areas, use the primary category and apply Good For tags for secondary angles (e.g., a family-friendly outdoor concert gets category "Music" and Good For tags `families_young_kids` + `outdoorsy`).
- **Static lookup table.** Categories rarely change. They are defined in a lookup table and referenced by ID.

---

## 9. Smart Filters

### Overview

The `/events` page has a multi-layer filter system built across Phases 1 and 2 of the Smart Filters Roadmap. Filters are URL-driven (shareable, back-button friendly) and rendered via a persistent top bar + expandable Radix Dialog drawer.

### Architecture

- **URL is source of truth**: every filter maps to a URL search param. `router.replace` updates the URL, which re-runs the server component.
- **Pure parsers in `types.ts`**: `parseFiltersFromParams` and `serializeFiltersToParams` live in a module free of `'use client'` so both server and client can use them.
- **Single badge count**: `countActiveFilters()` is the one source of truth for the filter count badge on both server and client.
- **Adding a new filter**: update `FilterState` type, parser, serializer, counter, query layer, and UI. All in documented files.

### Available Filters

| Filter | Type | URL Param | Phase |
|--------|------|-----------|-------|
| Category | single-select | `category=music` | P1 B2 |
| Good For | multi-select OR | `goodFor=foodies&goodFor=date_night` | P1 B1 |
| Time of Day | multi-select OR | `timeOfDay=evening&timeOfDay=late_night` | P1 B1 |
| Interest Preset | single-select | `interestPreset=foodies` | P1 B1 |
| Free | boolean | `free=true` | P1 B2 |
| Vibe Tag | single-select | `vibeTag=artsy` | P1 B2 |
| Noise Level | single-select | `noiseLevel=loud` | P1 B2 |
| Solo-friendly | boolean | `soloFriendly=true` | P1 B2 |
| Beginner-friendly | boolean | `beginnerFriendly=true` | P1 B2 |
| No tickets needed | boolean | `noTicketsNeeded=true` | P1 B2 |
| Drop-in OK | boolean | `dropInOk=true` | P1 B2 |
| Family-friendly | boolean | `familyFriendly=true` | P1 B2 |
| Member pricing | boolean | `memberBenefits=true` | P1 B2 |
| Membership org | single-select | `membershipOrg=<id>` | P1 B2 |
| Neighborhood / geo | composite | `neighborhood=bay-view&nearLat=43.007&nearLng=-87.896&radius=5` | P2 B4 |
| Price tier | multi-select OR | `priceTier=free&priceTier=under_10` | P2 B5 |
| Age group | multi-select OR | `ageGroup=college&ageGroup=twenty_one_plus` | P2 B5 |

### Geo / Distance Filtering

Uses Postgres `cube` + `earthdistance` extensions with a `events_within_radius()` RPC function and GiST index. 15 Milwaukee neighborhoods with center coordinates in `src/lib/constants/milwaukee-neighborhoods.ts`. Browser Geolocation API for "Use my location". Distance badge on event cards when a geo anchor is active.

### Price Tiers

6 tiers defined in `src/lib/constants/price-tiers.ts`: free, under_10, 10_to_25, 25_to_50, over_50, donation. Uses `is_free`, `price_low`, and `price_type` columns. Multi-select OR via PostgREST `.or()` with nested `and()`.

### Age Groups

6 groups defined in `src/lib/constants/age-groups.ts`: all_ages, families_young_kids, elementary, teens, college, twenty_one_plus. All predicates use `age_low` only (age_high is empty in DB). College group also checks `good_for @> {college_crowd}`.

### Key Files

- `src/components/events/filters/` -- FilterBar, FilterDrawer, FilterChip, FilterSection, EmptyFilterState, NeighborhoodPicker, types, use-filter-state hook
- `src/data/events/get-events.ts` -- Query layer with all filter predicates
- `src/lib/constants/` -- interest-presets.ts, time-of-day.ts, milwaukee-neighborhoods.ts, price-tiers.ts, age-groups.ts, vocabularies.ts
- `src/types/filters.ts` -- EventFilters type (query layer input)
- `src/app/events/page.tsx` -- Server component wiring URL params to getEvents()

### Roadmap

See `docs/filter-roadmap.md` for the full three-phase plan. Phase 1 complete, Phase 2 in progress (B4 + B5 shipped, B6 + R2 remaining), Phase 3 planned (vibe filters, trending sort).

---

## 10. View Tracking

### Overview

Anonymous per-event view tracking for future trending/popularity sorts. Ships unused -- accumulating data for Phase 3.

### How It Works

1. `<ViewTracker>` client component mounts on `/event/[slug]` detail pages.
2. On mount, reads or creates a `hl_sid` session cookie (128-bit entropy).
3. Calls `record_event_view()` SECURITY DEFINER RPC: `INSERT ... ON CONFLICT DO NOTHING`.
4. Three layers of dedup: client useRef sentinel (per event ID), cookie reuse across navigations, DB unique index on `(event_id, session_id, view_date)`.

### Key Files

- `src/components/events/view-tracker.tsx` -- Client component
- `src/data/events/record-view.ts` -- Server action + cookie management
- `supabase/migrations/20260411_1900_event_views.sql` -- Table, RLS, function, indexes
- `src/app/admin/views/page.tsx` -- Sanity dashboard (superadmin only)

---

## Related Documentation

For deeper dives into specific subsystems, see the individual docs in this directory:

- `AUTH.md` -- Detailed authentication implementation.
- `EVENTS.md` -- Event data model and query patterns.
- `SCHEMA.md` -- Full database schema reference.
- `RECURRING-EVENTS-DESIGN.md` -- Recurrence rule design and auto-replenishment logic.
- `PLAN-CAMPS-CLASSES-SERIES.md` -- Series type planning and camp/class field specifications.
- `ADMIN-ANYWHERE.md` -- Admin Anywhere toolbar implementation details.
- `SMART-ADDRESS-SYSTEM.md` -- Venue database and address autocomplete internals.
- `EVENT-DETAIL-COMPONENTS.md` -- Component-level breakdown of the event detail page.
- `filter-roadmap.md` -- Three-phase Smart Filters plan with session specs, architectural decisions, and data audit.
- `phase-reports/` -- Per-phase ship reports (phase-1-report.md, phase-2-progress.md).
