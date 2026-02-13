# User Stories

> User stories for the Happenlist app, organized by persona. Written for new team members
> to understand what the app does from the user's perspective, and for AI agents to understand
> intended behavior when building features.
>
> Happenlist is a curated local events directory for Milwaukee, WI. People discover events,
> save favorites, submit their own events, and admins manage everything. A Chrome extension
> scrapes events from other websites.

---

## Public Visitor (not logged in)

A public visitor is anyone browsing the site without an account. They can discover and explore
events but cannot save, follow, or submit anything.

### PV-1: Browse upcoming events

**As a** public visitor, **I want to** browse a grid of upcoming events on the main events page **so that** I can discover what is happening in Milwaukee.

- Events are displayed as cards in a responsive grid at `/events`
- Only published events with future dates are shown
- Each card shows: title, date, venue name, category badge, price, and an image (or letter placeholder)
- Events are sorted by date (soonest first)
- Results are paginated (24 per page)

### PV-2: Filter events by category

**As a** public visitor, **I want to** filter events by category (Music, Arts & Culture, Family, Food & Drink, etc.) **so that** I can find events that match my interests.

- Category filter is available on the `/events` page via URL parameter (`?category=music`)
- Selecting a category updates the event grid to show only events in that category
- The active category is visually highlighted
- Filter state is preserved in the URL so the page can be shared or bookmarked

### PV-3: Filter events by date shortcuts

**As a** public visitor, **I want to** quickly see events happening today or this weekend **so that** I can make last-minute plans.

- `/events/today` shows events with `instance_date` equal to today
- `/events/this-weekend` shows events on the upcoming Saturday and Sunday
- These are linked from the homepage and navigation

### PV-4: Filter events by price and audience

**As a** public visitor, **I want to** filter events by free admission and audience tags (date night, families with young kids, pet friendly, etc.) **so that** I can find events that fit my situation and budget.

- Free filter: `?free=true` on `/events` shows only events where `price_type = 'free'`
- Good For filter: `?goodFor=date_night` filters by audience tags
- Good For tags are displayed as colored pills on the events page; selecting one applies the filter
- Multiple filters can be combined (e.g., `?category=music&free=true&goodFor=solo_friendly`)

### PV-5: Search for events

**As a** public visitor, **I want to** search for events by keyword **so that** I can find a specific event or topic.

- Search bar is available in the site header
- Search results page at `/search?q=jazz` shows matching events
- Search matches against event titles and descriptions

### PV-6: View event detail page

**As a** public visitor, **I want to** view full details about an event **so that** I can decide whether to attend.

- Event detail page at `/event/[slug]` shows:
  - Title, date and time, venue name and address
  - Short description (below title)
  - Good For audience pills (linking to filtered events page)
  - Happenlist Highlights editorial summary (if available)
  - "From the Organizer" quoted description (if available)
  - "About This Event" description section
  - Pricing information
  - External links (website, tickets, social media, registration)
  - Event flyer/poster in a lightbox (if available)
  - Age restriction and family-friendly badges
  - Category badge linking to category filter
  - Series badge if part of a series (linking to series page)

### PV-7: View venue, organizer, and series detail pages

**As a** public visitor, **I want to** view a venue's page, an organizer's page, or a series page **so that** I can see all related upcoming events in one place.

- `/venue/[slug]` shows venue details (name, address, map) and upcoming events at that venue
- `/organizer/[slug]` shows organizer info and their upcoming events
- `/series/[slug]` shows series details (type, schedule, pricing, age range) and its upcoming event instances
- `/venues`, `/organizers`, and `/series` provide browsable listings of each

### PV-8: Browse series (classes, camps, recurring events)

**As a** public visitor, **I want to** browse classes, camps, and recurring event series **so that** I can find ongoing activities to join.

- Series listing at `/series` shows series cards with type badge (class, camp, workshop, recurring, festival, season)
- Series can be filtered by type (`?type=class`)
- Series cards show: title, type badge, schedule info, price, age range, attendance mode (drop-in/registered), and extended care badge (for camps)

### PV-9: Get directions to a venue

**As a** public visitor, **I want to** see a venue's location on a map and get directions **so that** I can find my way to the event.

- Venue detail pages and event detail pages show the venue address
- Venues with latitude/longitude display a map component
- Address links to Google Maps for turn-by-turn directions

### PV-10: Share an event link

**As a** public visitor, **I want to** share a link to an event with friends **so that** they can see the details and decide to join.

- Each event has a permanent, shareable URL at `/event/[slug]`
- Pages have proper meta tags (title, description, image) for social media previews
- JSON-LD structured data is included for search engine rich results

---

## Registered User (logged in attendee)

A registered user has signed in via magic link email. They can save events, follow entities,
submit events, and manage their profile.

### RU-1: Sign in with magic link

**As a** registered user, **I want to** sign in by entering my email and clicking a link sent to my inbox **so that** I can access my saved events and submissions without remembering a password.

- Login page at `/auth/login` shows an email input and "Send Magic Link" button
- After submitting, Supabase sends a one-time magic link to the email
- Clicking the link in the email redirects through `/auth/callback`, creates a session, and lands on the intended page
- Session persists across page refreshes via cookies

### RU-2: Save (heart) events

**As a** registered user, **I want to** heart/save events I am interested in **so that** I can quickly find them later.

- A heart button appears on event cards and event detail pages
- Clicking the heart toggles it on/off (optimistic UI update)
- Heart count is displayed on the event
- Requires authentication; unauthenticated users see a prompt to sign in

### RU-3: View my saved events

**As a** registered user, **I want to** see all the events I have hearted on a single page **so that** I can plan which ones to attend.

- My Hearts page at `/my/hearts` lists all hearted events
- Shows event cards similar to the main events page
- Option to include past events or only show upcoming
- Events can be un-hearted from this page

### RU-4: Follow organizers, venues, and categories

**As a** registered user, **I want to** follow organizers, venues, and categories **so that** I can be notified when new events are added that match my interests.

- Follow buttons appear on organizer, venue, and category pages
- Toggling follow creates/removes a `user_follows` record
- Users can configure whether follows trigger notifications (`notify_new_events` flag)
- Follows are viewable in the user's profile/settings area

### RU-5: Manage profile settings

**As a** registered user, **I want to** set my display name and notification preferences **so that** I can control how I appear and what alerts I receive.

- Settings page at `/my/settings` shows editable profile fields:
  - Display name
  - Email notification toggle
  - Weekly digest toggle
  - Timezone preference
- Changes are saved via `PATCH /api/profile`

### RU-6: View my event submissions

**As a** registered user, **I want to** see a list of events I have submitted and their review status **so that** I can track whether my submissions are approved, pending, or need changes.

- My Submissions page at `/my/submissions` shows all events submitted by the user
- Each submission displays a status badge (draft, pending review, changes requested, published, rejected)
- Submissions with "Changes Requested" status are highlighted and show the admin's message
- User can click "Edit & Resubmit" on events that need changes

### RU-7: Sign out

**As a** registered user, **I want to** sign out of my account **so that** my session is ended on shared or public devices.

- User menu dropdown in the header includes a "Sign Out" option
- Signing out clears the session cookies and redirects to the homepage

---

## Event Submitter

Any registered user can submit events. The submission form is a 7-step wizard with
auto-saving drafts.

### ES-1: Start a new event submission

**As an** event submitter, **I want to** start a new event submission from a guided multi-step form **so that** I can add my event to Happenlist without needing admin access.

- Submit form at `/submit/new` with a step progress indicator (Steps 1-7)
- User must be logged in; unauthenticated visitors are redirected to login
- Step progress shows completed, current, and upcoming steps

### ES-2: Enter basic event info (Step 1)

**As an** event submitter, **I want to** enter the event title, description, and category **so that** the event has its core identifying information.

- Step 1 collects: title (required, 3-200 chars), description, short description, and category selection
- Validation prevents advancing without required fields
- User can select from the existing list of categories

### ES-3: Choose event type (Step 2)

**As an** event submitter, **I want to** specify whether this is a single event, part of an existing series, or a new series/recurring event **so that** it is correctly organized.

- Step 2 offers four options:
  - Single Event (one-time)
  - Part of Existing Series (search and link to an existing series)
  - New Series (create a new class/camp/workshop with multiple sessions)
  - Recurring Event (set up a repeating pattern like "every Wednesday")
- Selecting "Existing Series" shows a search field to find and link to a series
- Selecting "Recurring" shows frequency, interval, day-of-week, and end condition options

### ES-4: Set date and time (Step 3)

**As an** event submitter, **I want to** set the event's date, start time, and optional end time **so that** attendees know when it happens.

- Step 3 collects: start date, start time, end date (optional), end time (optional)
- Option for "all day" event (hides time fields)
- For recurring events, this step shows the generated dates based on the recurrence rule from Step 2

### ES-5: Select or create a venue (Step 4)

**As an** event submitter, **I want to** pick an existing venue or create a new one **so that** attendees know where the event takes place.

- Step 4 offers options: Existing Venue (search), New Venue (create), Online, or TBD
- Venue search queries `/api/submit/venues/search` with autocomplete
- New venue creation collects: name, address, city, state, zip
- Online events and TBD venues skip the address fields

### ES-6: Set pricing (Step 5)

**As an** event submitter, **I want to** specify whether the event is free or paid and enter the price details **so that** attendees know the cost.

- Step 5 offers price types: Free, Fixed Price, Price Range, Varies, Donation
- Relevant price fields (low, high, details, ticket URL) appear based on selection
- Ticket URL field for linking to the purchase page

### ES-7: Add images (Step 6)

**As an** event submitter, **I want to** add images for the event **so that** it looks appealing in the events listing.

- Step 6 accepts image URL or file upload (optional)
- Image is re-hosted to Supabase Storage via `/api/images/upload`
- Preview shows the uploaded image

### ES-8: Review and submit (Step 7)

**As an** event submitter, **I want to** review all entered details and submit the event for admin approval **so that** I can confirm everything is correct before it goes to review.

- Step 7 shows a summary of all entered data across steps 1-6
- User can click back to any step to make corrections
- "Submit for Review" button creates the event with status `pending_review`
- After submission, user is redirected to `/submit/success` confirmation page

### ES-9: Auto-save drafts

**As an** event submitter, **I want to** have my in-progress submission automatically saved **so that** I do not lose my work if I close the browser or navigate away.

- Draft data is saved to the `event_drafts` table after each step
- Drafts include: all entered data, current step, completed steps
- Returning to `/submit/new` offers to resume an existing draft
- Drafts expire after 30 days

### ES-10: Edit and resubmit after changes requested

**As an** event submitter, **I want to** edit my event after an admin requests changes and resubmit it **so that** my event can be approved and published.

- On My Submissions page, events with status `changes_requested` show the admin's message
- Clicking "Edit & Resubmit" opens the submission form pre-filled with the event's current data
- After making changes, resubmitting sets the status back to `pending_review`

---

## Organizer

An organizer is a user who has claimed an organizer profile. They manage their own events
and organizer page.

### OR-1: Claim an organizer profile

**As an** organizer, **I want to** claim an existing organizer profile as mine **so that** I can manage my events and public organizer page.

- User initiates a claim via the organizer detail page
- Creates an `organizer_users` record with status `pending`
- Admin reviews and approves/rejects the claim (status becomes `verified` or `rejected`)
- Once verified, the user's role includes organizer capabilities

### OR-2: View my organizer page

**As an** organizer, **I want to** see my organizer's public profile page **so that** I can verify how my organization appears to the public.

- Organizer page at `/organizer/[slug]` shows: name, description, logo, website, social links
- Lists all upcoming events associated with the organizer
- The organizer can see both published and pending events for their organization

### OR-3: Submit events under my organization

**As an** organizer, **I want to** submit events that are automatically associated with my organizer profile **so that** they appear on my organizer page once approved.

- When a verified organizer uses the submission form, their organizer is pre-selected
- Submitted events have `organizer_id` set to their claimed organizer
- Events still go through the admin review queue

### OR-4: View all my organization's events

**As an** organizer, **I want to** see all events associated with my organization across all statuses **so that** I can track what is published, pending, or needs changes.

- Organizer dashboard (future) or My Submissions page filtered to their organizer
- Shows events grouped or filterable by status

### OR-5: Edit my organizer profile details

**As an** organizer, **I want to** update my organizer's description, logo, website, and social media links **so that** the public page stays current.

- Organizer profile editing (when implemented) allows updating:
  - Description, logo URL, website URL, email, phone
  - Social links (Facebook, Instagram, Twitter, YouTube, TikTok)

---

## Admin

Admins review submitted events, manage the review queue, and monitor site activity.
Admin status is determined by having their email in the `ADMIN_EMAILS` environment variable.

### AD-1: View the pending review queue

**As an** admin, **I want to** see all events awaiting approval in a review queue **so that** I can efficiently process new submissions.

- Admin pending queue at `/admin/events/pending`
- Shows events with status `pending_review` and `changes_requested`
- Ordered by submission date (oldest first)
- Each event card shows: title, submitter info, category, source (user submission vs scraper), and submission date

### AD-2: Approve a pending event

**As an** admin, **I want to** approve a pending event **so that** it becomes published and visible to the public.

- On the admin event detail page (`/admin/events/[id]`), an "Approve" button is available
- Approving sets status to `published` and records `reviewed_at` and `reviewed_by`
- The action is logged in the `admin_audit_log` table
- The event immediately appears in public listings

### AD-3: Reject a pending event

**As an** admin, **I want to** reject a pending event with a reason **so that** the submitter understands why their event was not approved.

- "Reject" action requires a rejection reason (free text)
- Sets status to `rejected` and stores the `rejection_reason`
- The submitter sees the rejection reason on their My Submissions page
- Action is logged in the audit log

### AD-4: Request changes on a submission

**As an** admin, **I want to** request changes on a submitted event with a message to the submitter **so that** they can fix issues and resubmit.

- "Request Changes" action requires a message explaining what needs to change
- Sets status to `changes_requested` and stores the `change_request_message`
- The submitter sees the message on My Submissions and can edit and resubmit
- Action is logged in the audit log

### AD-5: View admin dashboard with statistics

**As an** admin, **I want to** see a dashboard with key statistics **so that** I can understand the overall state of the site.

- Admin dashboard at `/admin` shows stat cards:
  - Total published events
  - Events pending review
  - Events by status breakdown
  - Recent activity
- Stats use SQL COUNT aggregations with indexes for performance

### AD-6: View the audit log

**As an** admin, **I want to** view a log of all admin actions **so that** I can track who approved, rejected, or edited events and when.

- Audit log at `/admin/activity` shows chronological list of admin actions
- Each entry shows: action type, event title, admin email, timestamp, and notes
- Actions include: approved, rejected, changes requested, edited, deleted, restored

### AD-7: Manage events across all statuses

**As an** admin, **I want to** browse and filter all events regardless of status **so that** I can find and manage any event on the platform.

- Admin events list at `/admin/events` shows all events (published, pending, rejected, draft, cancelled, etc.)
- Filterable by status, category, and date
- Each event links to its admin detail page with available actions

---

## Superadmin

Superadmins have all admin powers plus the ability to edit any event directly from public
pages using the Admin Anywhere toolbar. Superadmin status is determined by the
`SUPERADMIN_EMAILS` environment variable. Superadmins are automatically also admins.

### SA-1: Quick edit events from any public page

**As a** superadmin, **I want to** edit an event's details directly from its public detail page **so that** I can fix errors instantly without navigating to the admin area.

- A floating Admin Toolbar appears at the top of event detail pages for superadmins
- Toolbar shows current event status and provides "Quick Edit" and "Full Edit" buttons
- "Quick Edit" opens a slide-out drawer with editable fields
- Changes are saved via `PATCH /api/superadmin/events/[id]` and logged to the audit log

### SA-2: Quick edit title, description, dates, and pricing

**As a** superadmin, **I want to** quickly fix an event's title, description, dates, and pricing from the quick edit drawer **so that** common corrections are fast.

- Quick Edit drawer fields include:
  - Title, short description, full description
  - Start date/time, end date/time
  - Price type, price low, price high, is free toggle
  - Ticket URL
  - Edit notes (for audit log)
- Save updates the event and refreshes the page with new data

### SA-3: Change event status

**As a** superadmin, **I want to** change any event's status from the quick edit drawer **so that** I can publish, cancel, or unpublish events on the spot.

- Status dropdown in the quick edit drawer shows all valid statuses with color-coded badges
- Changing status calls `PATCH /api/superadmin/events/[id]/status`
- Status change is logged in the audit log

### SA-4: Edit external links and Good For tags

**As a** superadmin, **I want to** add or update an event's website, ticket, social media links, and audience tags **so that** event pages have complete and accurate information.

- Quick Edit drawer includes fields for: website URL, ticket URL, Instagram URL, Facebook URL, registration URL
- Good For tags are shown as multi-select toggle buttons (date_night, families_young_kids, pet_friendly, etc.)
- Changes are saved along with other quick edit fields

### SA-5: Convert a single event to a recurring series

**As a** superadmin, **I want to** convert a standalone event into a recurring series **so that** weekly or monthly events do not need to be individually created.

- "Make Recurring" action available for events without a `series_id`
- Opens a recurrence configuration form with smart defaults based on the event's day/time
- Configuration includes: frequency (weekly/monthly), interval, days of week, end condition, skip dates
- Preview panel shows the next 8-12 generated dates
- Confirming creates a series, attaches the original event as instance #1, and generates future events
- Calls `POST /api/events/[id]/make-recurring`

### SA-6: Manage skip dates on recurring series

**As a** superadmin, **I want to** add or remove skip dates on a recurring series **so that** events are not generated on holidays or breaks.

- On the series detail page, each upcoming event has a "Skip" action
- Skipping a date adds it to `recurrence_rule.exclude_dates` and cancels that event instance
- Skip dates can be managed from an "Manage Skip Dates" editor
- Unskipping a date removes it from `exclude_dates` and allows regeneration
- Calls `POST /api/series/[id]/skip-date`

### SA-7: Attach or detach events from a series

**As a** superadmin, **I want to** attach a standalone event to an existing series or detach an event from its series **so that** event groupings stay accurate.

- Attach: links a standalone event to a series, sets `is_override = true`, auto-assigns `series_sequence`
- Detach: removes the event from its series, clears series-related fields
- Attached events do not need to match the recurrence pattern (e.g., "Special Holiday Edition")
- Calls `POST /api/events/[id]/attach` or `POST /api/events/[id]/detach`

### SA-8: Soft delete and restore events

**As a** superadmin, **I want to** soft delete spam or duplicate events and restore accidentally deleted ones **so that** the event database stays clean without permanent data loss.

- Delete action in the quick edit drawer sets `deleted_at`, `deleted_by`, and `delete_reason`
- Deleted events are hidden from all public queries (`WHERE deleted_at IS NULL`)
- Restore action clears `deleted_at` and makes the event visible again
- Both actions are logged in the audit log

---

## Chrome Extension User (scraper operator)

The Chrome extension user is typically an admin or team member who scrapes events from
external websites (Eventbrite, Facebook, venue sites) and submits them to Happenlist.
The extension communicates with the Happenlist API, not directly with the database.

### CE-1: Scrape an event from an external website

**As a** Chrome extension user, **I want to** scrape event details from the page I am currently viewing **so that** I can quickly add it to Happenlist without manual data entry.

- The extension extracts from the current page: title, date/time, description, venue, organizer, pricing, images
- Extracted data is shown in a preview panel within the extension popup for review before submitting
- The extension handles different source formats: Eventbrite, Facebook Events, venue websites

### CE-2: Submit a scraped event to Happenlist

**As a** Chrome extension user, **I want to** submit scraped event data to Happenlist's API **so that** it enters the admin review queue for approval.

- Submits via `POST /api/scraper/events` with Bearer token authentication
- Required fields: title, start_datetime, source_url
- Recommended fields: descriptions (organizer_description, short_description), end_datetime, pricing, category_slug
- The API auto-resolves venues (by google_place_id or fuzzy name match) and organizers (by name match)
- Events are created with status `pending_review` and `source: 'scraper'`

### CE-3: Handle duplicate events

**As a** Chrome extension user, **I want to** be warned if an event has already been scraped **so that** I do not create duplicates.

- The API deduplicates by `source_url` and returns `409 Conflict` if the URL was already scraped
- Response includes the existing event's ID and current status
- The extension shows "Already exists" with a link to the existing event rather than retrying

### CE-4: Upload event images

**As a** Chrome extension user, **I want to** capture and upload event images **so that** the event has visuals in the Happenlist listing.

- Images are uploaded via `POST /api/images/upload` with the event ID
- Supports both source URL re-hosting and base64 uploads (for images captured directly)
- Three image types: hero (main), thumbnail (card), flyer (poster)
- The extension extracts actual image URLs (e.g., from `og:image`), not page URLs
- Images are re-hosted to Supabase Storage for reliability

### CE-5: Set category and audience tags

**As a** Chrome extension user, **I want to** assign a category and Good For audience tags when scraping **so that** the event is properly categorized from the start.

- Extension provides a category dropdown with all valid category slugs
- Extension provides Good For tag toggles for audience targeting
- These are sent as `category_slug` and `good_for` in the API payload
- Reduces the amount of admin work during review

### CE-6: Set pricing information

**As a** Chrome extension user, **I want to** capture and submit pricing details from the source page **so that** event pricing is accurate in Happenlist.

- Extension extracts pricing from the page (free, fixed, range, varies, donation)
- Maps to the API's pricing fields: `price_type`, `price_low`, `price_high`, `price_details`
- For complex pricing tiers, the full breakdown goes in `price_details`
- When no pricing info is found, defaults to `price_type: 'free'` (admins fix during review)

### CE-7: Capture venue and organizer details

**As a** Chrome extension user, **I want to** capture venue address and organizer information from the source page **so that** they are linked or created in Happenlist.

- Venue data includes: name, address, city, state, postal code, google_place_id (if available)
- Organizer data includes: name, website URL
- The API automatically matches to existing venues/organizers or creates new ones
- Google Place ID matching is the most reliable dedup key for venues

---

## Future / Planned

These stories represent features that are designed or discussed but not yet implemented.
They are included here to document the product roadmap and guide future development.

### FU-1: Organizer dashboard

**As an** organizer, **I want to** see a dashboard with stats about my events (views, hearts, upcoming count) **so that** I can understand engagement and plan future events.

- Shows aggregate metrics for the organizer's events
- Lists upcoming, past, and pending events with quick actions
- Provides a link to submit new events pre-associated with the organizer

### FU-2: Email notifications for follows

**As a** registered user, **I want to** receive email notifications when an organizer, venue, or category I follow has new events **so that** I do not miss events I care about.

- Triggered when a new event is published matching a user's follows
- Respects the `notify_new_events` flag on each follow
- Respects the `email_notifications` toggle on the user's profile
- Includes event title, date, venue, and a link to the event page

### FU-3: Weekly digest email

**As a** registered user, **I want to** receive a weekly email digest of upcoming events **so that** I get a curated overview of what is happening without checking the site daily.

- Sent weekly (e.g., Wednesday morning) to users who opted in (`email_weekly_digest = true`)
- Includes: featured events, events from followed organizers/venues/categories, popular events
- Each event links directly to its detail page
- Unsubscribe link in the email

### FU-4: Event analytics for admins

**As an** admin, **I want to** see analytics on event views, hearts, and submission trends **so that** I can understand what content resonates and make editorial decisions.

- Dashboard showing: most hearted events, most viewed events, submission volume over time
- Category and source breakdowns (which categories are most popular, scraper vs user submissions)
- Useful for deciding which types of events to feature or which scrapers to prioritize

### FU-5: Ticket integration

**As a** public visitor, **I want to** see real-time ticket availability and pricing from integrated ticketing platforms **so that** I know if an event is sold out before clicking through.

- Integration with external ticketing APIs (Eventbrite, etc.)
- Display availability status (available, limited, sold out) on event cards and detail pages
- Direct deep links to the ticket purchase page

### FU-6: User-submitted event notifications

**As an** event submitter, **I want to** receive an email when my submitted event is approved, rejected, or has changes requested **so that** I know the status without checking the site.

- Triggered on status transitions: pending_review -> published, pending_review -> rejected, pending_review -> changes_requested
- Email includes the admin's message (for rejections and change requests)
- Links to My Submissions page

### FU-7: Recurring event auto-replenishment

**As a** superadmin, **I want to** have recurring series automatically generate future events **so that** weekly and monthly events do not stop appearing after the initial batch runs out.

- Nightly cron (Supabase Edge Function) scans all published recurring series
- If upcoming event count < 8, generates the next 12 events from the recurrence rule
- On-read fallback: if a series detail page has < 2 upcoming events, triggers inline generation
- Respects skip dates (exclude_dates) in the recurrence rule
- Tracks generation progress via `generation_cursor_date` on the series

### FU-8: Series in event feed

**As a** public visitor, **I want to** see classes, camps, and series surfaced in the main events feed **so that** I discover ongoing activities alongside one-time events.

- Series cards appear in the `/events` feed alongside event cards
- Sorted by `series.start_date` to fit chronologically with events
- Provides a unified discovery experience for all types of happenings

---

*Last updated: February 2026*
