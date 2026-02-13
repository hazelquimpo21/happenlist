# Event Flows & Series Guide

> Complete guide to event submission, approval, series, and management.

---

## Quick Start

### Run the SQL Migration

```sql
-- In Supabase Dashboard > SQL Editor
-- Run: supabase/migrations/00008_event_management_complete.sql
```

### Set Environment Variables

```env
# Admin emails (comma-separated)
ADMIN_EMAILS=admin@example.com,you@example.com
```

### Test it

```bash
npm run dev
# Visit http://localhost:3000/submit/new
```

---

## Architecture Overview

```
PUBLIC SUBMIT    DRAFTS         REVIEW QUEUE      PUBLISHED
    |              |                |                 |
    v              v                v                 v
+--------+    +--------+     +-------------+    +---------+
| Submit | -> | Draft  | --> | Pending     | -> | Live    |
| Form   |    | (auto- |     | Review      |    | Event   |
|        |    | saved) |     | (admin)     |    |         |
+--------+    +--------+     +------+------+    +---------+
                                    |
                      +-------------+-------------+
                      |             |             |
                      v             v             v
               +-----------+ +-----------+ +-----------+
               | Changes   | | Rejected  | | Cancelled |
               | Requested | |           | |           |
               +-----------+ +-----------+ +-----------+
```

---

## Event Status Values

| Status | Description | Visible To |
|--------|-------------|------------|
| `draft` | User still editing | Submitter only |
| `pending_review` | Awaiting admin approval | Submitter + Admin |
| `changes_requested` | Admin needs edits | Submitter + Admin |
| `published` | Live on site | Everyone |
| `rejected` | Not approved | Submitter + Admin |
| `cancelled` | Was live, now cancelled | Everyone (with badge) |
| `postponed` | Date TBD | Everyone (with badge) |

### Status Badges

```typescript
const STATUS_LABELS = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  changes_requested: 'Changes Requested',
  published: 'Published',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  postponed: 'Postponed',
};
```

### State Transitions

```
draft --> pending_review
               |
               +--> published --> cancelled
               |         |            |
               |         +--> postponed
               |                  |
               +--> changes_requested --> pending_review
               |
               +--> rejected
```

---

## User Flows

### Submit New Event

```
/submit/new

Step 1: Basic Info      -> Title, Description, Category
Step 2: Event Type      -> Single, Series, or Recurring
Step 3: Date & Time     -> When does it happen?
Step 4: Location        -> Existing venue, New, Online, TBD
Step 5: Pricing         -> Free, Fixed, Range, Varies
Step 6: Image           -> URL or Upload (optional)
Step 7: Review          -> Summary & Submit

--> Event submitted (status: pending_review)
```

### My Submissions Page

- Route: `/my/submissions`
- Shows all events submitted by user
- Status badges and counts
- "Changes Requested" items highlighted
- Edit/Resubmit actions available

### Edit & Resubmit Flow

1. Admin requests changes (sets status to `changes_requested`)
2. User sees notification on My Submissions
3. User sees the change request message
4. User clicks "Edit & Resubmit"
5. User makes changes
6. User resubmits -> back to `pending_review`

---

## Admin Flows

### Review Queue

- Route: `/admin/events/pending`
- Shows all `pending_review` and `changes_requested` events
- Ordered by submission date (oldest first)
- Trust indicators: submitter's approval history

### Review Actions

| Action | Result | User Notification |
|--------|--------|-------------------|
| **Approve** | Status -> `published` | Event is live! |
| **Reject** | Status -> `rejected` | Not approved + reason |
| **Request Changes** | Status -> `changes_requested` | Please edit + message |

### Admin Routes

```
/admin                    Dashboard with stats
/admin/events             All events (all statuses)
/admin/events/pending     Review queue
/admin/events/[id]        Event detail + actions
/admin/activity           Audit log
```

---

## Series & Recurring Events

### Series Types

| Type | Use Case | Sessions |
|------|----------|----------|
| `class` | Multi-week course | 2-52 |
| `camp` | Day camp, intensive | 2-14 |
| `workshop` | Workshop series | 2-12 |
| `recurring` | Weekly jam, monthly meetup | Rolling (auto-replenished) |
| `festival` | Multi-day festival | 1-14 |
| `season` | Theater/sports season | 2-100 |

### Series Architecture

```
     SERIES (parent)              EVENTS (instances)
    +--------------+            +------------------+
    | id           |      1:N   | id               |
    | title        | ---------> | series_id (FK)   |
    | series_type  |            | series_sequence  |
    | recurrence   |            | is_series_instance|
    | _rule (JSONB)|            | is_override      |
    | total_sessions|            +------------------+
    | generation_  |
    | cursor_date  |
    +--------------+
```

### Series Routes

```
/series              Browse all series
/series?type=class   Filter by type
/series/[slug]       Series detail with event list
```

### Creating a Series

User selects in Step 2 of submit form:

1. **Single Event** - One-time event
2. **Part of Existing Series** - Link to existing (event is attached as override)
3. **New Series** - Create new class/camp/workshop
4. **Recurring Event** - Weekly/monthly pattern

### Making an Existing Event Recurring

Admins can convert any standalone event into a recurring series:

1. View the event detail page (superadmin toolbar)
2. Click **"Make Recurring"** action
3. Configure: frequency, interval, day(s), time, end condition, skip dates
4. Preview generated dates
5. Confirm — system creates a series and generates future events

The original event becomes instance #1. Future events are auto-generated from the `recurrence_rule`. See [RECURRING-EVENTS-DESIGN.md](./RECURRING-EVENTS-DESIGN.md) for full architecture.

### Recurrence Options

| Pattern | Configuration |
|---------|--------------|
| Every Wednesday | `frequency: weekly, days_of_week: [3]` |
| Every other Thursday | `frequency: weekly, interval: 2, days_of_week: [4]` |
| First Friday of every month | `frequency: monthly, week_of_month: 1, days_of_week: [5]` |
| Mon/Wed/Fri | `frequency: weekly, days_of_week: [1, 3, 5]` |
| Monthly on the 15th | `frequency: monthly, day_of_month: 15` |

### Skip Dates (Exclusions)

Recurring events can skip specific dates (holidays, breaks):
- Stored as `exclude_dates` array in the `recurrence_rule` JSONB
- When a single occurrence is cancelled, its date is auto-added to `exclude_dates`
- Replenishment respects skip dates — won't regenerate skipped events
- Admin can manage skip dates from the series detail page

### Event Replenishment

Recurring series auto-generate future events via:
- **Nightly cron** (primary): tops up event buffer when upcoming count < 8
- **On-read fallback**: if series has < 2 upcoming events when viewed, generates inline
- Reads `recurrence_rule` and `generation_cursor_date` from the series

### Attaching / Detaching Events

- **Attach**: Link a standalone event to an existing series. Sets `is_override = true`, auto-assigns `series_sequence`. The event doesn't need to match the recurrence pattern (e.g., "Special Holiday Edition").
- **Detach**: Remove an event from its series. Clears `series_id`, `is_series_instance`, etc.

---

## Database Schema

### Events Table (New Columns)

```sql
-- Submission tracking
submitted_by_email TEXT
submitted_by_name TEXT
submitted_at TIMESTAMPTZ

-- Change request flow
change_request_message TEXT

-- Soft delete
deleted_at TIMESTAMPTZ
deleted_by TEXT
delete_reason TEXT

-- Edit tracking
last_edited_at TIMESTAMPTZ
last_edited_by TEXT
edit_count INTEGER DEFAULT 0

-- Review tracking
reviewed_at TIMESTAMPTZ
reviewed_by TEXT
review_notes TEXT
rejection_reason TEXT

-- Source tracking
source TEXT DEFAULT 'manual'  -- 'user_submission', 'scraper', 'manual'
```

### Event Drafts Table

```sql
event_drafts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  user_email TEXT,
  draft_data JSONB,           -- Partial event data
  series_draft_data JSONB,
  current_step INTEGER,
  completed_steps INTEGER[],
  submitted_event_id UUID,    -- Links to created event
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ      -- 30 days from creation
)
```

### Admin Audit Log

```sql
admin_audit_log (
  id UUID PRIMARY KEY,
  action TEXT,                -- 'event_approved', 'event_rejected', etc.
  entity_type TEXT,
  entity_id UUID,
  admin_email TEXT,
  user_email TEXT,
  changes JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ
)
```

---

## API Reference

### Draft Management

```typescript
// Create draft
POST /api/submit/draft
Body: { draft_data: EventDraftData }
Response: { id: string, draft: EventDraft }

// Get draft
GET /api/submit/draft/[id]
Response: { draft: EventDraft }

// Update draft
PUT /api/submit/draft/[id]
Body: { draft_data: EventDraftData, current_step: number }
Response: { draft: EventDraft }

// Delete draft
DELETE /api/submit/draft/[id]
Response: { success: true }
```

### Event Submission

```typescript
// Submit for review
POST /api/submit/event
Body: { draft_id: string } OR { event_data: EventDraftData }
Response: { event_id: string, status: 'pending_review' }
```

### Series

```typescript
// Search series (for linking)
GET /api/submit/series/search?q=pottery&limit=20
Response: { series: SeriesCard[] }

// Create series with events
POST /api/submit/series
Body: { series_data: SeriesDraftData, events: EventDraftData[] }
Response: { series_id: string, event_ids: string[] }
```

### Recurring Events

```typescript
// Convert single event to recurring series
POST /api/events/[id]/make-recurring
Body: { recurrence_rule: RecurrenceRule }
Response: { success: true, seriesId: string, eventCount: number }

// Attach event to existing series
POST /api/events/[id]/attach
Body: { series_id: string }
Response: { success: true }

// Detach event from series
POST /api/events/[id]/detach
Response: { success: true }

// Add or remove a skip date on a recurring series
POST /api/series/[id]/skip-date
Body: { date: "YYYY-MM-DD", action: "skip" | "unskip" }
Response: { success: true, exclude_dates: string[] }

// Manually trigger replenishment
POST /api/series/[id]/replenish
Response: { success: true, eventsCreated: number }
```

### Admin Actions

```typescript
// Approve
POST /api/admin/events/[id]/approve
Body: { notes?: string }
Response: { success: true }

// Reject
POST /api/admin/events/[id]/reject
Body: { reason: string, notes?: string }
Response: { success: true }

// Request changes
POST /api/admin/events/[id]/request-changes
Body: { message: string, notes?: string }
Response: { success: true }

// Soft delete
POST /api/admin/events/[id]/delete
Body: { reason?: string }
Response: { success: true }

// Restore
POST /api/admin/events/[id]/restore
Response: { success: true }
```

---

## File Structure

```
src/
├── app/
│   ├── submit/
│   │   ├── new/page.tsx              # Submit form
│   │   ├── success/page.tsx          # Confirmation
│   │   └── edit/[id]/page.tsx        # Edit submission
│   │
│   ├── my/submissions/page.tsx       # User's submissions
│   │
│   ├── series/
│   │   ├── page.tsx                  # Series listing
│   │   └── [slug]/page.tsx           # Series detail
│   │
│   ├── admin/
│   │   ├── events/
│   │   │   ├── pending/page.tsx      # Review queue
│   │   │   └── [id]/page.tsx         # Event detail
│   │   └── activity/page.tsx         # Audit log
│   │
│   └── api/
│       ├── submit/
│       │   ├── draft/route.ts        # Draft CRUD
│       │   └── event/route.ts        # Submit event
│       └── admin/
│           └── events/[id]/
│               ├── approve/route.ts
│               ├── reject/route.ts
│               ├── request-changes/route.ts
│               └── delete/route.ts
│
├── components/submit/
│   ├── form-wrapper.tsx              # Multi-step container
│   ├── step-progress.tsx             # Progress indicator
│   └── steps/
│       ├── step-1-basic-info.tsx
│       ├── step-2-event-type.tsx
│       ├── step-3-datetime.tsx
│       ├── step-4-location.tsx
│       ├── step-5-pricing.tsx
│       ├── step-6-image.tsx
│       └── step-7-review.tsx
│
├── components/series/
│   ├── series-card.tsx
│   ├── series-grid.tsx
│   └── series-type-badge.tsx
│
├── data/
│   ├── submit/
│   │   ├── draft-actions.ts          # Draft CRUD
│   │   ├── submit-event.ts           # Submit logic
│   │   └── get-submissions.ts        # User's submissions
│   │
│   ├── series/
│   │   ├── get-series.ts             # List/filter
│   │   └── get-series-detail.ts      # Single series
│   │
│   └── admin/
│       └── event-actions.ts          # Approve/reject/etc.
│
└── types/
    ├── submission.ts                 # Event submission types
    └── series.ts                     # Series types
```

---

## Logging Standards

```
[Submit] Draft created (draft:abc123, user:john@example.com)
[Submit] Draft updated: step 3 complete (draft:abc123)
[Submit] Event submitted for review (event:xyz789)

[AdminEvents] Event approved: "Summer Jazz Concert"
[AdminEvents] Event rejected: "Spam Event"
[AdminEvents] Changes requested for: "Jazz Night"

[Series] Series created: "Pottery 101" (type:class)
[Series] Generated 12 recurring events
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Event not found" when approving | Soft-deleted or wrong ID | Check `deleted_at` is null |
| Draft not saving | Auth issue | Verify user is logged in |
| Submissions not in queue | Wrong status | Check status is `pending_review` |
| Series search no results | Status filter | Check series `status = 'published'` |

---

## Test Checklist

### Submission Form
- [ ] Navigate between steps
- [ ] Validation prevents advancing with errors
- [ ] Can go back to previous steps
- [ ] Data persists across steps
- [ ] Auto-save works
- [ ] Final submit creates pending_review event

### Admin Review
- [ ] Queue shows all pending events
- [ ] Filters work (category, source)
- [ ] Approve changes status to published
- [ ] Reject requires reason
- [ ] Request changes sets message
- [ ] User sees feedback

### Series
- [ ] Search existing series works
- [ ] Link event to series works
- [ ] Create new series works
- [ ] Events show series badge

---

## Related Documentation

| Doc | Description |
|-----|-------------|
| [AUTH.md](./AUTH.md) | Authentication, user roles, permissions |
| [ADMIN-ANYWHERE.md](./ADMIN-ANYWHERE.md) | Superadmin edit from any event page |
| [SUPERADMIN-EVENT-MANAGEMENT.md](../AI_DEV_DOCS_ARCHIVE/SUPERADMIN-EVENT-MANAGEMENT.md) | Full superadmin system reference |
