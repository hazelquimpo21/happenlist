# Product Requirements Document (PRD)

## Product Overview

### Vision
Happenlist is Milwaukee's go-to events directory—a clean, curated resource for discovering what's happening in the city. Unlike cluttered event aggregators, Happenlist prioritizes quality over quantity with thoughtful curation and a delightful browsing experience.

### Problem Statement
Milwaukee residents struggle to discover local events. Existing solutions are either too broad (Facebook Events, Eventbrite), too niche (venue-specific calendars), or poorly maintained. There's no single, well-designed source for "what's happening this weekend in Milwaukee."

### Solution
A curator-driven events directory that surfaces the best of Milwaukee's events with excellent filtering, beautiful design, and reliable information.

---

## Target Users

### Phase 1: Primary Personas

**The Weekend Explorer (Sarah)**
- 28-year-old young professional
- New-ish to Milwaukee, wants to explore the city
- Browses events on her phone during lunch or commute
- Values: good design, easy filtering, trusted recommendations
- Pain points: endless scrolling, outdated info, ugly interfaces

**The Parent Planner (Marcus)**
- 38-year-old parent of two kids (ages 5 and 8)
- Needs kid-friendly activities for weekends
- Plans 1-2 weeks ahead
- Values: clear age-appropriateness, location info, parking details
- Pain points: events that say "family-friendly" but aren't really

**The Date Night Seeker (Jordan)**
- 32-year-old in a relationship
- Looking for unique date ideas beyond dinner-and-a-movie
- Browses spontaneously ("what's happening tonight?")
- Values: vibe/atmosphere info, price transparency
- Pain points: boring suggestions, sold-out events

### Phase 1: Admin Persona

**The Curator (Hazel)**
- Solo admin managing all content
- Sources events from venues, organizers, social media, other calendars
- Needs efficient workflow for adding/editing events
- Values: speed, bulk operations, easy image handling
- Pain points: repetitive data entry, broken links

---

## Feature Requirements

### Phase 1: Core Events (MVP)

#### Public Features

**Event Discovery**
- Browse all upcoming events (default: chronological by start date)
- Filter by category (single-select)
- Filter by tags (multi-select)
- Filter by date range (today, this week, this weekend, custom)
- Filter by price (free, paid, all)
- Search by keyword (title, description, venue, organizer)
- Sort by: date (default), recently added

**Event Detail Page**
- Event title, description, images (thumbnail + flyer)
- Date/time with timezone handling
- Venue with address and map link
- Organizer with link to their page
- Category and tags
- Price information
- Ticket/registration link (external)
- Source attribution link
- Share functionality

**Venue Pages**
- Venue name, address, map
- Upcoming events at this venue
- Past events (collapsed/limited)

**Organizer Pages**
- Organizer name, description, logo
- Social links (website, Instagram)
- Upcoming events by this organizer
- Past events (collapsed/limited)

**Category Pages**
- All events in a category
- Same filtering as main browse

**Navigation**
- Header: Logo, main nav (Events, Categories), search
- Footer: About, Contact, social links
- Mobile: Bottom nav or hamburger menu

#### Admin Features

**Authentication**
- Email/password login (single admin account)
- Protected admin routes
- Session management

**Event Management**
- Create new event with all fields
- Edit existing events
- Delete events (soft delete recommended)
- Duplicate event (for similar recurring events)
- Preview before publish
- Draft/Published status toggle
- Bulk status changes

**Venue Management**
- Create/edit/delete venues
- Venue lookup when creating events
- Create venue inline during event creation

**Organizer Management**
- Create/edit/delete organizers
- Organizer lookup when creating events
- Create organizer inline during event creation

**Category/Tag Management**
- View all categories and tags
- Edit category/tag names, colors, icons
- View event counts per category/tag
- (Seed data provided, rarely edited)

**Image Handling**
- Upload thumbnail image
- Upload flyer image
- Image optimization/resizing
- Alt text support

---

### Phase 2: Series (Future)

**Series Entity**
- Parent entity for recurring events
- Own detail page with all instances listed
- Shared metadata (description, organizer, venue)

**Event Types Expansion**
- Single Event (default)
- Series instance (linked to parent)
- Recurring (ongoing, no end date)
- Festival (multi-day)
- Camp (date range, specific audience)

**Series Management**
- Create series with recurrence pattern
- Auto-generate or manually add instances
- Edit series (update all instances option)
- Edit single instance (override)

---

### Phase 3: User Accounts (Future)

**User Registration**
- Email/password signup
- Email verification
- Profile creation (display name, zip code)

**Bookmarking**
- Save events to personal list
- Save series
- View all bookmarks
- Remove bookmarks

**Notifications**
- Email reminders for bookmarked events
- New events in favorite categories (opt-in)

**Personalization**
- "Interested" count on events (social proof)
- Recommended events based on bookmarks

---

### Phase 4: Business Owners (Future)

**Business Accounts**
- Business registration flow
- Verification process
- Business profile page

**Self-Service Event Submission**
- Submit events for approval
- Edit own submitted events
- View submission status

**Venue/Organizer Claiming**
- Claim existing venue as owner
- Claim organizer profile
- Verification process

**Admin Moderation**
- Approve/reject submissions
- Trust levels (auto-approve for trusted)
- Submission queue management

---

## Success Metrics

### Phase 1 KPIs
- Events listed: 50+ active events at launch
- Page views: 1,000+ monthly within 3 months
- Bounce rate: <50%
- Mobile usage: >60% of traffic
- Admin efficiency: <5 min average to add an event

### Quality Metrics
- Zero broken external links (automated checking)
- All events have images
- 100% of events have accurate date/time
- <24 hour lag for major Milwaukee events

---

## Scope Boundaries

### In Scope (Phase 1)
- Milwaukee metro area only
- English only
- Public browsing (no auth required)
- Single admin curator
- Manual event entry
- External ticketing (link out)

### Out of Scope (Phase 1)
- User accounts
- Bookmarking/saving
- Event submission by public
- Ticket sales
- Multiple cities
- API access
- Mobile app
- Email newsletters
- Comments/reviews
- Social features

---

## Dependencies

### External Services
- Supabase (database, auth, storage)
- Vercel (hosting, edge functions)
- Google Maps (address autocomplete, map embeds) — optional Phase 1

### Third-Party Integrations (Future)
- Email service (Resend, Postmark) — Phase 3
- Analytics (Plausible, Posthog) — Phase 1 nice-to-have

---

## Timeline Estimate

### Phase 1
- Database setup: 1 day
- Core UI components: 2-3 days
- Public pages (browse, detail, venue, organizer): 3-4 days
- Admin CRUD: 2-3 days
- Polish, testing, deploy: 2 days

**Total: ~2 weeks**

---

## Open Questions

1. **Map integration**: Include Google Maps embed on venue/event pages in Phase 1, or defer?
2. **Analytics**: Add basic analytics (Plausible) in Phase 1?
3. **Image CDN**: Use Supabase Storage transforms, or add Cloudinary later?
4. **SEO**: Generate OG images dynamically, or use uploaded thumbnails?
