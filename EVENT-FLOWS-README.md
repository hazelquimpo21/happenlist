# 🎫 Happenlist Event Flows

Complete documentation for the event submission, approval, and management system.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Event States](#event-states)
4. [User Flows](#user-flows)
5. [Admin Flows](#admin-flows)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Components](#components)
9. [Installation](#installation)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Run the SQL Migration

```bash
# In Supabase Dashboard > SQL Editor
# Paste contents of: supabase/migrations/00008_event_management_complete.sql
# Click "Run"
```

### 2. Set Environment Variables

Add to your `.env.local`:

```env
# Admin emails (comma-separated)
ADMIN_EMAILS=admin@example.com,another-admin@example.com

# Enable magic link auth in Supabase Dashboard
# Go to: Authentication > Providers > Email
```

### 3. Start the Development Server

```bash
npm install
npm run dev

# Visit http://localhost:3000/submit/new
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EVENT MANAGEMENT SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌────────────┐ │
│  │   PUBLIC    │     │   DRAFTS    │     │   REVIEW    │     │  PUBLISHED │ │
│  │   SUBMIT    │ ──► │   (auto-    │ ──► │   QUEUE     │ ──► │   (live)   │ │
│  │   FORM      │     │   saved)    │     │   (admin)   │     │            │ │
│  └─────────────┘     └─────────────┘     └─────────────┘     └────────────┘ │
│         │                                       │                            │
│         │                              ┌────────┴────────┐                   │
│         │                              │                 │                   │
│         │                              ▼                 ▼                   │
│         │                     ┌─────────────┐   ┌─────────────┐             │
│         │                     │  CHANGES    │   │  REJECTED   │             │
│         │                     │  REQUESTED  │   │             │             │
│         │                     └─────────────┘   └─────────────┘             │
│         │                            │                                       │
│         └────────────────────────────┘                                       │
│                  (user edits & resubmits)                                    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Event States

### State Machine

| Status | Description | Visible to Public | Actions Available |
|--------|-------------|-------------------|-------------------|
| `draft` | In-progress submission | ❌ | User: Edit, Submit |
| `pending_review` | Awaiting admin review | ❌ | Admin: Approve, Reject, Request Changes |
| `changes_requested` | Needs user edits | ❌ | User: Edit, Resubmit |
| `published` | Live on site | ✅ | Admin: Edit, Cancel, Delete |
| `rejected` | Not approved | ❌ | User: View reason |
| `cancelled` | Was published, now cancelled | ⚠️ (with strikethrough) | Admin: Restore |
| `postponed` | Was published, now postponed | ⚠️ | Admin: Reschedule |

### State Transitions

```
draft ──────────────► pending_review
                            │
                            ├──► published ──────► cancelled
                            │         │                │
                            │         └──► postponed ──┘
                            │                    │
                            ├──► changes_requested ──► pending_review
                            │
                            └──► rejected
```

### Status Colors & Labels

```typescript
const EVENT_STATUS_LABELS = {
  draft: '📝 Draft',
  pending_review: '⏳ Pending Review',
  changes_requested: '✏️ Changes Requested',
  published: '✅ Published',
  rejected: '🚫 Rejected',
  cancelled: '❌ Cancelled',
  postponed: '⏸️ Postponed',
};
```

---

## User Flows

### 1. Submit New Event

```
User visits /submit/new
        │
        ▼
┌───────────────────┐
│   Step 1: Basic   │  Title, Description, Category
│      Info         │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Step 2: Event    │  Single, Series, or Recurring
│     Type          │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Step 3: Date     │  Start/End time, Recurrence pattern
│    & Time         │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Step 4: Location │  Existing venue, New venue, Online, TBD
│                   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Step 5: Pricing  │  Free, Fixed, Range, Varies, Donation
│                   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Step 6: Image    │  URL or Upload (optional)
│                   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Step 7: Review   │  Summary & Submit
│   & Submit        │
└─────────┬─────────┘
          │
          ▼
    Event submitted
    (pending_review)
```

### 2. View My Submissions

- Route: `/my/submissions`
- Shows all events submitted by the user
- Status badges and counts
- "Changes Requested" items highlighted
- Edit/Resubmit actions

### 3. Edit & Resubmit

When an admin requests changes:

1. User sees notification on My Submissions
2. User sees the change request message
3. User clicks "Edit & Resubmit"
4. User makes changes
5. User resubmits → back to `pending_review`

---

## Admin Flows

### 1. Review Queue

- Route: `/admin/events/pending`
- Shows all `pending_review` and `changes_requested` events
- Ordered by submission date (oldest first)
- Trust indicators:
  - How many events has this submitter had approved before?
  - Total submissions from this person

### 2. Review Actions

| Action | Status Change | User Notification |
|--------|---------------|-------------------|
| **Approve** | → `published` | Email: "Your event is live!" |
| **Reject** | → `rejected` | Email: "Event not approved" + reason |
| **Request Changes** | → `changes_requested` | Email: "Please make these changes" + message |

### 3. Admin Panel Routes

```
/admin                    Dashboard with stats
/admin/events             All events (all statuses)
/admin/events/pending     Review queue
/admin/events/[id]        Event detail + actions
/admin/activity           Audit log
```

---

## Database Schema

### New Tables

```sql
-- Event drafts for save & resume
event_drafts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  user_email TEXT,
  draft_data JSONB,      -- Partial event data
  series_draft_data JSONB,
  current_step INTEGER,
  completed_steps INTEGER[],
  submitted_event_id UUID,  -- Links to created event
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ    -- 30 days from creation
)

-- Admin audit log
admin_audit_log (
  id UUID PRIMARY KEY,
  action TEXT,           -- 'event_approved', 'event_rejected', etc.
  entity_type TEXT,
  entity_id UUID,
  admin_email TEXT,
  user_email TEXT,
  changes JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ
)
```

### New Columns on `events`

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

---

## API Reference

### Draft Management

```
POST   /api/submit/draft           Create new draft
GET    /api/submit/draft           List user's drafts
GET    /api/submit/draft/[id]      Get specific draft
PATCH  /api/submit/draft/[id]      Update draft
DELETE /api/submit/draft/[id]      Delete draft
```

### Event Submission

```
POST   /api/submit/event           Submit event for review
GET    /api/submit/series/search   Search series to link to
```

### Admin Actions

```
POST   /api/admin/events/[id]/approve         Approve event
POST   /api/admin/events/[id]/reject          Reject event
POST   /api/admin/events/[id]/request-changes Request changes
POST   /api/admin/events/[id]/delete          Soft delete
POST   /api/admin/events/[id]/restore         Restore deleted
```

---

## Components

### Form Components (`src/components/submit/`)

| Component | Description |
|-----------|-------------|
| `FormWrapper` | Main form orchestrator |
| `StepProgress` | Progress indicator bar |
| `StepHeader` | Header for each step |
| `Step1BasicInfo` | Title, description, category |
| `Step2EventType` | Single, series, recurring |
| `Step3DateTime` | Date and time picker |
| `Step4Location` | Venue selection |
| `Step5Pricing` | Price configuration |
| `Step6Image` | Image URL input |
| `Step7Review` | Final review & submit |

### Page Routes

| Route | Description |
|-------|-------------|
| `/submit/new` | New event submission form |
| `/submit/success` | Post-submission confirmation |
| `/submit/edit/[id]` | Edit existing submission |
| `/my/submissions` | User's submitted events |

---

## Installation

### 1. Prerequisites

- Node.js 18+
- Supabase project (with auth enabled)
- Magic link authentication configured

### 2. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Admin
ADMIN_EMAILS=admin@example.com

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run Migration

In Supabase SQL Editor:

```sql
-- Run this file:
-- supabase/migrations/00008_event_management_complete.sql
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development

```bash
npm run dev
```

---

## Console Logging

All operations include emoji-prefixed logging:

```
📝 [Submit] Creating draft for user@example.com
✅ [Submit] Draft created: abc-123

🎫 [Submit] Submitting event: Jazz Night
✅ [Submit] Event submitted: def-456

✅ 🎫 [AdminEvents] Event approved: Jazz Night
📋 [AdminData] Fetching pending events...
✅ [AdminData] Found 5 pending events
```

### Logging Legend

| Emoji | Meaning |
|-------|---------|
| 📝 | Draft operation |
| 🎫 | Event operation |
| ✅ | Success |
| ⚠️ | Warning |
| ❌ | Error |
| 🔍 | Search/Debug |
| 📋 | List/Fetch |
| 👤 | User/Admin action |

---

## Troubleshooting

### "Event not found" when approving

- Check the event exists in the database
- Ensure the event hasn't been soft-deleted
- Verify you're using the correct event ID

### Draft not saving

- Check user is authenticated
- Verify `event_drafts` table exists
- Check RLS policies allow insert for authenticated users

### Magic link not working

1. Enable Email provider in Supabase Dashboard
2. Check Site URL is configured correctly
3. Verify redirect URL in `signInWithMagicLink()`

### Submissions not showing in queue

- Check event status is `pending_review` or `changes_requested`
- Verify `deleted_at` is null
- Confirm you're viewing `/admin/events/pending`

### Series search not returning results

- Check series have `status = 'published'`
- Verify full-text search index exists on `series.title`
- Try simpler search terms

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── submit/
│   │   │   ├── draft/
│   │   │   │   ├── route.ts         # Create/list drafts
│   │   │   │   └── [id]/route.ts    # Get/update/delete draft
│   │   │   ├── event/route.ts       # Submit event
│   │   │   └── series/search/route.ts
│   │   └── admin/
│   │       └── events/[id]/
│   │           ├── request-changes/route.ts
│   │           ├── delete/route.ts
│   │           └── restore/route.ts
│   │
│   ├── submit/
│   │   ├── new/
│   │   │   ├── page.tsx             # Submit form page
│   │   │   └── submit-event-form.tsx
│   │   └── success/page.tsx
│   │
│   └── my/
│       └── submissions/page.tsx
│
├── components/
│   └── submit/
│       ├── form-wrapper.tsx
│       ├── step-progress.tsx
│       ├── index.ts
│       └── steps/
│           ├── step-1-basic-info.tsx
│           ├── step-2-event-type.tsx
│           ├── step-3-datetime.tsx
│           ├── step-4-location.tsx
│           ├── step-5-pricing.tsx
│           ├── step-6-image.tsx
│           ├── step-7-review.tsx
│           └── index.ts
│
├── data/
│   └── submit/
│       ├── draft-actions.ts
│       ├── submit-event.ts
│       ├── get-submissions.ts
│       ├── search-series.ts
│       └── index.ts
│
├── lib/
│   ├── auth/
│   │   ├── is-admin.ts
│   │   ├── session.ts
│   │   └── index.ts
│   └── constants/
│       └── series-limits.ts
│
└── types/
    └── submission.ts
```

---

## Next Steps

- [ ] Email notifications when event is approved/rejected
- [ ] Image upload to Supabase Storage
- [ ] Organizer profile linking
- [ ] Recurring event auto-generation
- [ ] Bulk approve/reject in admin panel
- [ ] Analytics for event views

---

Built with ❤️ using Next.js 16, Supabase, and Tailwind CSS.
