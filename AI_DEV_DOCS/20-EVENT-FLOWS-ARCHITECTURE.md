# 🎫 Event Flows Architecture

> **Purpose**: Complete implementation guide for Add Event, Approve Event, Edit/Delete flows
> **For**: AI/Claude Code implementation
> **Last Updated**: 2026-01-04
> **Status**: ✅ IMPLEMENTED

---

## ✅ Implementation Status

This architecture has been fully implemented in Phase 3. Here's what was built:

| Component | Status | Location |
|-----------|--------|----------|
| **Database Migration** | ✅ Done | `supabase/migrations/00008_event_management_complete.sql` |
| **Magic Link Auth** | ✅ Done | `src/lib/auth/session.ts`, `src/app/auth/` |
| **Admin Detection** | ✅ Done | `src/lib/auth/is-admin.ts` |
| **7-Step Form** | ✅ Done | `src/components/submit/steps/` |
| **Draft Auto-save** | ✅ Done | `src/data/submit/draft-actions.ts` |
| **Event Submission** | ✅ Done | `src/data/submit/submit-event.ts` |
| **My Submissions** | ✅ Done | `src/app/my/submissions/page.tsx` |
| **Admin Actions** | ✅ Done | `src/data/admin/event-actions.ts` |
| **Soft Delete/Restore** | ✅ Done | `src/data/admin/event-actions.ts` |
| **Types** | ✅ Done | `src/types/submission.ts` |
| **API Routes** | ✅ Done | `src/app/api/submit/`, `src/app/api/admin/` |

### Key Files Created

```
src/
├── app/
│   ├── auth/login/page.tsx           # Magic link login
│   ├── auth/callback/route.ts        # Auth callback
│   ├── submit/
│   │   ├── new/page.tsx              # Submit form page
│   │   ├── new/submit-event-form.tsx # Client form component
│   │   └── success/page.tsx          # Confirmation
│   ├── my/submissions/page.tsx       # User's submissions
│   └── api/submit/                   # Submission APIs
│
├── components/submit/
│   ├── form-wrapper.tsx              # Form container
│   ├── step-progress.tsx             # Progress indicator
│   └── steps/                        # 7 form steps
│
├── data/
│   ├── submit/                       # Submission data layer
│   └── admin/event-actions.ts        # Admin actions
│
├── lib/auth/
│   ├── session.ts                    # getSession, requireAuth
│   └── is-admin.ts                   # Admin check
│
└── types/submission.ts               # All types
```

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [User Types & Authentication](#user-types--authentication)
3. [Event Statuses & State Machine](#event-statuses--state-machine)
4. [Series & Recurring Events](#series--recurring-events)
5. [Performance Considerations](#performance-considerations)
6. [Database Schema](#database-schema)
7. [File Structure](#file-structure)
8. [Implementation Order](#implementation-order)
9. [API Routes](#api-routes)
10. [Component Specifications](#component-specifications)
11. [Form Flow Details](#form-flow-details)
12. [Logging Standards](#logging-standards)
13. [Testing Checklist](#testing-checklist)

---

## Overview

### What We're Building

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HAPPENLIST EVENT FLOWS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  👤 USER                    👨‍💼 ADMIN                    🌐 PUBLIC            │
│  ────────                   ─────────                   ────────            │
│                                                                              │
│  • Submit new event         • Review submissions        • Browse events     │
│  • Create/link series       • Approve/reject            • View details      │
│  • Edit own submissions     • Request changes           • Search/filter     │
│  • Track status             • Edit any event            • See series        │
│  • Delete (soft) own        • Delete any event                              │
│                             • Manage organizers                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Auth | Supabase Magic Link | Email verification, no passwords |
| Database | Supabase PostgreSQL | RLS policies for security |
| Frontend | Next.js 14+ App Router | Server Components default |
| Forms | React Hook Form + Zod | Validation, multi-step |
| Storage | Supabase Storage | Image uploads |

---

## User Types & Authentication

### User Roles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER ROLE HIERARCHY                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  ADMIN                                                                │   │
│  │  • Full access to everything                                          │   │
│  │  • Approve/reject events                                              │   │
│  │  • Edit any content                                                   │   │
│  │  • Identified by: email in ADMIN_EMAILS env var                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              ▲                                               │
│                              │                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  ORGANIZER (future Phase 4b)                                          │   │
│  │  • User who has claimed an organizer profile                          │   │
│  │  • Can manage their organizer's events                                │   │
│  │  • May get auto-approve for events (configurable)                     │   │
│  │  • Identified by: organizers.user_id matches auth.uid()               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              ▲                                               │
│                              │                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  USER (authenticated)                                                 │   │
│  │  • Anyone with verified email (magic link)                            │   │
│  │  • Can submit events for review                                       │   │
│  │  • Can edit own submissions (before approval)                         │   │
│  │  • Can track submission status                                        │   │
│  │  • Identified by: auth.uid() exists                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              ▲                                               │
│                              │                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  GUEST (anonymous)                                                    │   │
│  │  • Can browse published events                                        │   │
│  │  • Can view series, venues, organizers                                │   │
│  │  • Cannot submit or edit                                              │   │
│  │  • Identified by: no auth session                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MAGIC LINK AUTH FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER CLICKS "SUBMIT AN EVENT"                                            │
│     │                                                                        │
│     ▼                                                                        │
│  2. CHECK: Already logged in?                                                │
│     │                                                                        │
│     ├─── YES ──► Go to /submit/new                                          │
│     │                                                                        │
│     └─── NO ──► Show login modal                                            │
│                  │                                                           │
│                  ▼                                                           │
│  3. USER ENTERS EMAIL                                                        │
│     │                                                                        │
│     ▼                                                                        │
│  4. SUPABASE SENDS MAGIC LINK                                                │
│     │                                                                        │
│     ▼                                                                        │
│  5. USER CLICKS LINK IN EMAIL                                                │
│     │                                                                        │
│     ▼                                                                        │
│  6. /auth/callback ROUTE HANDLES TOKEN                                       │
│     │                                                                        │
│     ├─── Valid ──► Create session, redirect to /submit/new                  │
│     │                                                                        │
│     └─── Invalid ──► Show error, link to retry                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Admin Detection

```typescript
// src/lib/auth/is-admin.ts
// Simple approach: check email against env var list

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
```

---

## Event Statuses & State Machine

### Status Values

| Status | Code | Description | Visible To |
|--------|------|-------------|------------|
| Draft | `draft` | User is still editing | Submitter only |
| Pending Review | `pending_review` | Submitted, awaiting admin | Submitter + Admin |
| Changes Requested | `changes_requested` | Admin needs edits | Submitter + Admin |
| Published | `published` | Live and visible | Everyone |
| Rejected | `rejected` | Not accepted | Submitter + Admin |
| Cancelled | `cancelled` | Was live, now cancelled | Everyone (with badge) |
| Postponed | `postponed` | Date TBD | Everyone (with badge) |

### State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EVENT STATUS STATE MACHINE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌─────────┐                                     │
│                              │  draft  │ ◄─── Initial state                  │
│                              └────┬────┘                                     │
│                                   │                                          │
│                                   │ user_submit                              │
│                                   ▼                                          │
│                         ┌─────────────────┐                                  │
│              ┌─────────►│ pending_review  │◄────────────┐                    │
│              │          └────────┬────────┘             │                    │
│              │                   │                      │                    │
│              │     ┌─────────────┼─────────────┐        │                    │
│              │     │             │             │        │                    │
│              │     ▼             ▼             ▼        │                    │
│              │ ┌────────┐ ┌───────────────┐ ┌────────┐  │                    │
│              │ │approved│ │changes_request│ │rejected│  │                    │
│              │ └───┬────┘ └───────┬───────┘ └────────┘  │                    │
│              │     │              │                     │                    │
│              │     │              │ user_resubmit       │                    │
│              │     │              └─────────────────────┘                    │
│              │     │                                                         │
│              │     ▼                                                         │
│              │ ┌─────────┐                                                   │
│              │ │published│                                                   │
│              │ └────┬────┘                                                   │
│              │      │                                                        │
│              │      ├──── admin_edit ────► (stays published)                 │
│              │      │                                                        │
│              │      ├──── admin_cancel ──► ┌─────────┐                       │
│              │      │                      │cancelled│                       │
│              │      │                      └─────────┘                       │
│              │      │                                                        │
│              │      └──── admin_postpone ─► ┌─────────┐                      │
│              │                              │postponed│                      │
│              │                              └────┬────┘                      │
│              │                                   │                           │
│              │                                   │ admin_reschedule          │
│              └───────────────────────────────────┘                           │
│                                                                              │
│  SOFT DELETE: Any status can transition to deleted_at = NOW()               │
│  RESTORE: Admin can clear deleted_at to restore                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Status Transition Rules

```typescript
// src/lib/events/status-transitions.ts

export const STATUS_TRANSITIONS: Record<string, {
  allowedNextStates: string[];
  requiredRole: 'user' | 'admin';
}> = {
  draft: {
    allowedNextStates: ['pending_review'],
    requiredRole: 'user', // Owner can submit
  },
  pending_review: {
    allowedNextStates: ['published', 'changes_requested', 'rejected'],
    requiredRole: 'admin',
  },
  changes_requested: {
    allowedNextStates: ['pending_review'], // Resubmit
    requiredRole: 'user',
  },
  published: {
    allowedNextStates: ['cancelled', 'postponed'],
    requiredRole: 'admin',
  },
  cancelled: {
    allowedNextStates: ['published'], // Restore
    requiredRole: 'admin',
  },
  postponed: {
    allowedNextStates: ['published', 'cancelled'],
    requiredRole: 'admin',
  },
  rejected: {
    allowedNextStates: [], // Terminal state
    requiredRole: 'admin',
  },
};
```

---

## Series & Recurring Events

### Series Types & Constraints

| Type | Use Case | Session Limits | Date Selection |
|------|----------|----------------|----------------|
| `class` | Multi-week course | 2-52 sessions | User picks each date |
| `camp` | Day camp, intensive | 2-14 days | Consecutive dates |
| `workshop` | Workshop series | 2-12 sessions | User picks each date |
| `recurring` | Weekly jam, monthly meetup | Rolling 12-week window | Pattern-based auto-gen |
| `festival` | Multi-day festival | 1-14 days | Consecutive dates |
| `season` | Theater season, sports season | 2-100 events | User picks each date |

### Series Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERIES CREATION DECISION TREE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER STARTS EVENT SUBMISSION                                                │
│  │                                                                           │
│  ▼                                                                           │
│  ┌─────────────────────────────────────────────────┐                         │
│  │  "Is this event..."                             │                         │
│  │                                                 │                         │
│  │  ○ A single, one-time event                     │                         │
│  │  ○ Part of an existing series                   │                         │
│  │  ○ The start of a NEW series                    │                         │
│  │  ○ A recurring event (repeats weekly/monthly)   │                         │
│  └─────────────────────────────────────────────────┘                         │
│           │           │           │           │                              │
│           ▼           ▼           ▼           ▼                              │
│       ┌───────┐  ┌─────────┐ ┌─────────┐ ┌──────────┐                        │
│       │Single │  │Link to  │ │Create   │ │Setup     │                        │
│       │Event  │  │Existing │ │New      │ │Recurring │                        │
│       │Form   │  │Series   │ │Series   │ │Pattern   │                        │
│       └───┬───┘  └────┬────┘ └────┬────┘ └────┬─────┘                        │
│           │           │           │           │                              │
│           │           │           │           │                              │
│           │      ┌────┴────┐ ┌────┴────────┐  │                              │
│           │      │Search   │ │Series Info: │  │                              │
│           │      │existing │ │• Title      │  │                              │
│           │      │series   │ │• Type       │  │                              │
│           │      │by name  │ │• Total #    │  │                              │
│           │      └────┬────┘ └──────┬──────┘  │                              │
│           │           │             │         │                              │
│           ▼           ▼             ▼         ▼                              │
│  ┌──────────────────────────────────────────────────┐                        │
│  │              DATE/TIME SELECTION                  │                       │
│  │  (Different UI based on series type)              │                       │
│  └──────────────────────────────────────────────────┘                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Recurring Event Generation Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RECURRING EVENT GENERATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PROBLEM: Can't generate infinite events for "every Tuesday forever"        │
│                                                                              │
│  SOLUTION: Rolling window generation                                         │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │   TODAY                        +12 weeks                             │    │
│  │     │                              │                                 │    │
│  │     ▼                              ▼                                 │    │
│  │  ───┼──●──●──●──●──●──●──●──●──●──●──●──●───┼─────────────────────   │    │
│  │     │  ▲  ▲  ▲  ▲  ▲  ▲  ▲  ▲  ▲  ▲  ▲  ▲  │                        │    │
│  │     │  │  │  │  │  │  │  │  │  │  │  │  │  │                        │    │
│  │     │  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘                        │    │
│  │     │         12 events generated                                    │    │
│  │     │                                                                │    │
│  │     └── GENERATION WINDOW ──────────────────┘                        │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  HOW IT WORKS:                                                               │
│                                                                              │
│  1. User creates recurring series with pattern                               │
│     • Pattern: { frequency: 'weekly', days_of_week: [2], time: '19:00' }    │
│     • End: date, count, or 'never'                                          │
│                                                                              │
│  2. On creation, generate first 12 weeks of events                          │
│     • Each event: status='published', series_id=X, is_series_instance=true  │
│     • Auto-increment series_sequence                                        │
│                                                                              │
│  3. CRON JOB (weekly): Check all recurring series                           │
│     • If < 8 events remaining in future, generate more                      │
│     • Respect end_date or end_count                                         │
│                                                                              │
│  4. ALTERNATIVE: On-demand generation                                       │
│     • When user views calendar 3+ months ahead, generate those events       │
│     • Lazy generation = less upfront cost                                   │
│                                                                              │
│  RECOMMENDATION: Start with upfront 12-week generation, add cron later      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Series Event Limits

```typescript
// src/lib/constants/series-limits.ts

export const SERIES_LIMITS = {
  class: {
    minSessions: 2,
    maxSessions: 52,
    dateSelection: 'manual',      // User picks each date
    description: 'Multi-session class (2-52 sessions)',
  },
  camp: {
    minSessions: 2,
    maxSessions: 14,
    dateSelection: 'consecutive', // User picks start, we fill days
    description: 'Day camp or intensive (2-14 days)',
  },
  workshop: {
    minSessions: 2,
    maxSessions: 12,
    dateSelection: 'manual',
    description: 'Workshop series (2-12 sessions)',
  },
  recurring: {
    minSessions: 1,
    maxSessions: null,            // No limit, rolling generation
    dateSelection: 'pattern',     // Define recurrence pattern
    generationWindow: 12,         // Weeks ahead to generate
    description: 'Recurring event (weekly, monthly, etc.)',
  },
  festival: {
    minSessions: 1,
    maxSessions: 14,
    dateSelection: 'consecutive',
    description: 'Multi-day festival (1-14 days)',
  },
  season: {
    minSessions: 2,
    maxSessions: 100,
    dateSelection: 'manual',
    description: 'Performance season (2-100 events)',
  },
} as const;
```

---

## Performance Considerations

### Potential Bottlenecks & Solutions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PERFORMANCE CONSIDERATIONS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. LARGE SERIES EVENT LISTS                                                 │
│     ─────────────────────────                                                │
│     Problem:  Season with 100 events = slow page load                        │
│     Solution: Paginate with limit 20, load more on scroll                    │
│     Implementation:                                                          │
│       • Default: Show next 10 upcoming events                                │
│       • "Show all X events" expands with pagination                          │
│       • Past events collapsed by default                                     │
│                                                                              │
│  2. SERIES SEARCH/LINK DROPDOWN                                              │
│     ─────────────────────────────                                            │
│     Problem:  1000+ series = slow search                                     │
│     Solution: Debounced search, server-side filtering                        │
│     Implementation:                                                          │
│       • Debounce input 300ms                                                 │
│       • Search via API, not client-side filter                               │
│       • Limit results to 20, show "X more matches"                           │
│       • Index: CREATE INDEX idx_series_title_search ON series USING gin(...) │
│                                                                              │
│  3. CASCADE UPDATES (Series → Events)                                        │
│     ───────────────────────────────                                          │
│     Problem:  Updating series title should update all event displays         │
│     Solution: Don't duplicate; join at query time                            │
│     Implementation:                                                          │
│       • Events don't store series_title                                      │
│       • Query joins series table when needed                                 │
│       • Cache series info in Next.js for 60s                                 │
│                                                                              │
│  4. RECURRING EVENT GENERATION                                               │
│     ─────────────────────────────                                            │
│     Problem:  Generating 52 events at once = timeout                         │
│     Solution: Batch insert, background job for large sets                    │
│     Implementation:                                                          │
│       • ≤12 events: Synchronous insert                                       │
│       • >12 events: Queue job, show "generating..." status                   │
│       • Use INSERT ... SELECT generate_series() for speed                    │
│                                                                              │
│  5. IMAGE UPLOADS                                                            │
│     ──────────────────                                                       │
│     Problem:  Large images slow upload and display                           │
│     Solution: Client-side resize before upload                               │
│     Implementation:                                                          │
│       • Max dimensions: 2000x2000px                                          │
│       • Max file size: 5MB                                                   │
│       • Generate thumbnail on upload (400x300)                               │
│       • Use Supabase Image Transformation if available                       │
│                                                                              │
│  6. ADMIN QUEUE WITH MANY PENDING                                            │
│     ─────────────────────────────                                            │
│     Problem:  500 pending events = slow admin page                           │
│     Solution: Virtual scrolling, pagination                                  │
│     Implementation:                                                          │
│       • Default: 25 per page                                                 │
│       • Sort by submitted_at DESC                                            │
│       • Filters: by category, by source (scraped vs manual)                  │
│       • Bulk actions: select all on page, approve/reject                     │
│                                                                              │
│  7. DRAFT AUTO-SAVE                                                          │
│     ──────────────────                                                       │
│     Problem:  Too frequent saves = database spam                             │
│     Solution: Debounced saves, diff-based updates                            │
│     Implementation:                                                          │
│       • Auto-save every 30 seconds if changes                                │
│       • Debounce: Wait 2s after typing stops                                 │
│       • Show "Saving..." / "Saved" indicator                                 │
│       • Store drafts in separate table (less strict schema)                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Indexes (Add to Migration)

```sql
-- Performance indexes for event flows

-- Fast series search by title
CREATE INDEX IF NOT EXISTS idx_series_title_search
  ON series USING gin(to_tsvector('english', title));

-- Find user's submissions quickly
CREATE INDEX IF NOT EXISTS idx_events_submitted_by
  ON events(submitted_by_email, created_at DESC)
  WHERE submitted_by_email IS NOT NULL;

-- Admin queue ordering
CREATE INDEX IF NOT EXISTS idx_events_pending_queue
  ON events(status, submitted_at DESC)
  WHERE status IN ('pending_review', 'changes_requested');

-- Drafts cleanup (expire old drafts)
CREATE INDEX IF NOT EXISTS idx_drafts_expires
  ON event_drafts(expires_at)
  WHERE submitted_event_id IS NULL;

-- Series events ordered for display
CREATE INDEX IF NOT EXISTS idx_events_series_display
  ON events(series_id, instance_date ASC)
  WHERE series_id IS NOT NULL AND status = 'published';
```

---

## Database Schema

### SQL Migration

```sql
-- ============================================================================
-- MIGRATION: 00007_event_submission_flows.sql
-- ============================================================================
-- Adds support for:
--   • Public event submission
--   • Draft saving
--   • Edit request workflow
--   • Soft delete
--   • User/submitter tracking
--
-- Run in Supabase SQL Editor after existing migrations.
-- ============================================================================

-- ============================================================================
-- 1. EXTEND EVENTS TABLE
-- ============================================================================

-- Submission tracking
ALTER TABLE events ADD COLUMN IF NOT EXISTS submitted_by_email TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS submitted_by_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Changes requested flow
ALTER TABLE events ADD COLUMN IF NOT EXISTS change_request_message TEXT;

-- Soft delete
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- Edit tracking
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_edited_by TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_submitted_by
  ON events(submitted_by_email, created_at DESC)
  WHERE submitted_by_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_pending_queue
  ON events(status, submitted_at DESC)
  WHERE status IN ('pending_review', 'changes_requested');

CREATE INDEX IF NOT EXISTS idx_events_not_deleted
  ON events(instance_date)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. CREATE EVENT DRAFTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,

  -- Draft data (flexible JSON for partial event)
  draft_data JSONB NOT NULL DEFAULT '{}',

  -- Form progress
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],

  -- Series draft (if creating new series)
  series_draft_data JSONB,

  -- Link to submitted event (when complete)
  submitted_event_id UUID REFERENCES events(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '30 days'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_drafts_user ON event_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_expires ON event_drafts(expires_at) WHERE submitted_event_id IS NULL;

-- RLS
ALTER TABLE event_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own drafts" ON event_drafts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON event_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE event_drafts IS 'Stores incomplete event submissions for users to resume';

-- ============================================================================
-- 3. UPDATE EVENTS RLS FOR SUBMITTERS
-- ============================================================================

-- Submitters can view their own events (any status)
CREATE POLICY "Submitters view own events" ON events
  FOR SELECT
  USING (
    submitted_by_email IS NOT NULL
    AND submitted_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Submitters can update their drafts and changes_requested events
CREATE POLICY "Submitters update own drafts" ON events
  FOR UPDATE
  USING (
    status IN ('draft', 'changes_requested')
    AND submitted_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('draft', 'changes_requested', 'pending_review')
  );

-- Submitters can insert new events as drafts
CREATE POLICY "Users can create draft events" ON events
  FOR INSERT
  WITH CHECK (
    status = 'draft'
    AND submitted_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 4. UPDATE SERIES RLS FOR SUBMITTERS
-- ============================================================================

-- Submitters can create series (as drafts)
CREATE POLICY "Users can create draft series" ON series
  FOR INSERT
  WITH CHECK (
    status = 'draft'
  );

-- ============================================================================
-- 5. ADD AUDIT LOG ACTION TYPES
-- ============================================================================

-- Document new action types (just for reference)
COMMENT ON TABLE admin_audit_log IS '
Extended action types for event flows:

SUBMISSION:
  • event_drafted      - User started a draft
  • event_submitted    - User submitted for review
  • event_resubmitted  - User resubmitted after changes requested

ADMIN REVIEW:
  • event_approved     - Admin approved → published
  • event_rejected     - Admin rejected (with reason)
  • event_changes_req  - Admin requested changes (with message)

EDITING:
  • event_edited       - Event was edited
  • event_edit_requested - User requested edit (if not owner)

DELETION:
  • event_soft_deleted - Event soft deleted
  • event_restored     - Deleted event restored

SERIES:
  • series_created     - New series created
  • series_event_added - Event linked to series
';

-- ============================================================================
-- 6. HELPER VIEWS
-- ============================================================================

-- My submissions view (for authenticated users)
CREATE OR REPLACE VIEW v_my_submissions AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.status,
  e.instance_date,
  e.start_datetime,
  e.image_url,
  e.submitted_at,
  e.reviewed_at,
  e.review_notes,
  e.rejection_reason,
  e.change_request_message,
  e.created_at,
  e.updated_at,
  c.name as category_name,
  c.slug as category_slug,
  l.name as location_name,
  l.city as location_city,
  s.title as series_title,
  s.slug as series_slug
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN series s ON e.series_id = s.id
WHERE e.submitted_by_email IS NOT NULL
  AND e.deleted_at IS NULL
ORDER BY e.created_at DESC;

-- Admin submission queue
CREATE OR REPLACE VIEW v_admin_submission_queue AS
SELECT
  e.*,
  c.name as category_name,
  l.name as location_name,
  l.city as location_city,
  o.name as organizer_name,
  s.title as series_title,
  (
    SELECT COUNT(*) FROM events e2
    WHERE e2.submitted_by_email = e.submitted_by_email
    AND e2.status = 'published'
  ) as submitter_approved_count
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN series s ON e.series_id = s.id
WHERE e.status IN ('pending_review', 'changes_requested')
  AND e.deleted_at IS NULL
ORDER BY
  e.submitted_at ASC NULLS LAST;

-- ============================================================================
-- 7. CLEANUP FUNCTION (run via cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_drafts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM event_drafts
  WHERE expires_at < now()
    AND submitted_event_id IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_drafts IS 'Removes expired drafts. Run daily via cron.';

-- ============================================================================
-- DONE!
-- ============================================================================
```

### TypeScript Types

```typescript
// src/types/submission.ts

import type { Database } from '@/lib/supabase/types';

// ============================================================================
// EVENT SUBMISSION TYPES
// ============================================================================

/** Event status values */
export type EventStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'published'
  | 'rejected'
  | 'cancelled'
  | 'postponed';

/** Draft data stored as JSONB (flexible schema) */
export interface EventDraftData {
  // Step 1: Basic Info
  title?: string;
  description?: string;
  short_description?: string;
  category_id?: string;

  // Step 2: Series/Single
  event_mode?: 'single' | 'existing_series' | 'new_series' | 'recurring';
  series_id?: string;
  new_series?: {
    title: string;
    series_type: string;
    description?: string;
    total_sessions?: number;
  };
  recurrence_rule?: RecurrenceRule;

  // Step 3: Date/Time
  start_datetime?: string;
  end_datetime?: string;
  instance_date?: string;
  is_all_day?: boolean;
  timezone?: string;
  additional_dates?: string[]; // For multi-session manual selection

  // Step 4: Location
  location_mode?: 'existing' | 'new' | 'online' | 'tbd';
  location_id?: string;
  new_location?: {
    name: string;
    address_line: string;
    city: string;
    state?: string;
    postal_code?: string;
  };

  // Step 5: Pricing
  price_type?: string;
  price_low?: number;
  price_high?: number;
  price_details?: string;
  is_free?: boolean;
  ticket_url?: string;

  // Step 6: Media
  image_url?: string;
  thumbnail_url?: string;

  // Step 7: Additional
  organizer_id?: string;
  website_url?: string;

  // Metadata
  source?: 'user_submission';
}

/** Recurrence rule for recurring events */
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  interval: number;
  days_of_week?: number[]; // 0=Sun, 1=Mon, etc.
  day_of_month?: number;
  time: string; // "19:00"
  duration_minutes: number;
  end_type: 'date' | 'count' | 'never';
  end_date?: string;
  end_count?: number;
}

/** Full draft record from database */
export interface EventDraft {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  draft_data: EventDraftData;
  series_draft_data: Partial<SeriesDraftData> | null;
  current_step: number;
  completed_steps: number[];
  submitted_event_id: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

/** Series draft data */
export interface SeriesDraftData {
  title: string;
  series_type: string;
  description?: string;
  short_description?: string;
  total_sessions?: number;
  price_type?: string;
  price_low?: number;
  price_high?: number;
  is_free?: boolean;
  registration_url?: string;
  category_id?: string;
  location_id?: string;
  organizer_id?: string;
  image_url?: string;
}

// ============================================================================
// SUBMISSION FLOW TYPES
// ============================================================================

/** Form step configuration */
export interface FormStep {
  id: number;
  name: string;
  description: string;
  icon: string;
  required: boolean;
  validate: (data: EventDraftData) => string[];
}

/** Form steps configuration */
export const FORM_STEPS: FormStep[] = [
  {
    id: 1,
    name: 'Basic Info',
    description: 'Title, description, and category',
    icon: 'FileText',
    required: true,
    validate: (data) => {
      const errors: string[] = [];
      if (!data.title?.trim()) errors.push('Title is required');
      if (!data.category_id) errors.push('Category is required');
      return errors;
    },
  },
  {
    id: 2,
    name: 'Event Type',
    description: 'Single event, series, or recurring',
    icon: 'Layers',
    required: true,
    validate: (data) => {
      const errors: string[] = [];
      if (!data.event_mode) errors.push('Please select event type');
      return errors;
    },
  },
  {
    id: 3,
    name: 'Date & Time',
    description: 'When does it happen?',
    icon: 'Calendar',
    required: true,
    validate: (data) => {
      const errors: string[] = [];
      if (!data.start_datetime) errors.push('Start date/time is required');
      return errors;
    },
  },
  {
    id: 4,
    name: 'Location',
    description: 'Where does it happen?',
    icon: 'MapPin',
    required: true,
    validate: (data) => {
      const errors: string[] = [];
      if (!data.location_mode) errors.push('Please select location type');
      if (data.location_mode === 'existing' && !data.location_id) {
        errors.push('Please select a venue');
      }
      if (data.location_mode === 'new' && !data.new_location?.name) {
        errors.push('Venue name is required');
      }
      return errors;
    },
  },
  {
    id: 5,
    name: 'Pricing',
    description: 'Cost and ticket info',
    icon: 'Ticket',
    required: true,
    validate: (data) => {
      const errors: string[] = [];
      if (!data.price_type) errors.push('Please select pricing type');
      return errors;
    },
  },
  {
    id: 6,
    name: 'Image',
    description: 'Event image (optional)',
    icon: 'Image',
    required: false,
    validate: () => [],
  },
  {
    id: 7,
    name: 'Review',
    description: 'Review and submit',
    icon: 'CheckCircle',
    required: true,
    validate: () => [],
  },
];

// ============================================================================
// ADMIN TYPES
// ============================================================================

/** Submission in admin queue */
export interface SubmissionQueueItem {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  instance_date: string;
  start_datetime: string;
  submitted_at: string | null;
  submitted_by_email: string | null;
  submitted_by_name: string | null;
  image_url: string | null;
  category_name: string | null;
  location_name: string | null;
  location_city: string | null;
  series_title: string | null;
  submitter_approved_count: number;
}

/** Admin action params */
export interface ApproveParams {
  event_id: string;
  admin_email: string;
  notes?: string;
}

export interface RejectParams {
  event_id: string;
  admin_email: string;
  reason: string;
  notes?: string;
}

export interface RequestChangesParams {
  event_id: string;
  admin_email: string;
  message: string;
  notes?: string;
}
```

---

## File Structure

```
src/
├── app/
│   │
│   ├── (auth)/                              # AUTH ROUTES
│   │   ├── login/
│   │   │   └── page.tsx                     # Email input for magic link
│   │   ├── callback/
│   │   │   └── route.ts                     # Handle magic link callback
│   │   └── logout/
│   │       └── route.ts                     # Clear session
│   │
│   ├── submit/                              # PUBLIC SUBMISSION
│   │   ├── layout.tsx                       # Submission layout (auth required)
│   │   ├── page.tsx                         # /submit landing - my drafts list
│   │   │
│   │   ├── new/                             # CREATE NEW EVENT
│   │   │   ├── page.tsx                     # Multi-step form container
│   │   │   └── steps/
│   │   │       ├── step-1-basic.tsx         # Title, description, category
│   │   │       ├── step-2-type.tsx          # Single/series/recurring
│   │   │       ├── step-3-datetime.tsx      # When
│   │   │       ├── step-4-location.tsx      # Where
│   │   │       ├── step-5-pricing.tsx       # Cost & tickets
│   │   │       ├── step-6-image.tsx         # Upload image
│   │   │       └── step-7-review.tsx        # Review & submit
│   │   │
│   │   ├── [draftId]/                       # CONTINUE DRAFT
│   │   │   └── page.tsx                     # Resume editing
│   │   │
│   │   ├── success/
│   │   │   └── page.tsx                     # Submission confirmed
│   │   │
│   │   └── my-submissions/
│   │       └── page.tsx                     # Track all my submissions
│   │
│   ├── admin/
│   │   └── events/
│   │       ├── pending/
│   │       │   └── page.tsx                 # Submission queue (enhanced)
│   │       └── [id]/
│   │           ├── page.tsx                 # Event detail (view/edit)
│   │           ├── edit/
│   │           │   └── page.tsx             # Full edit form
│   │           └── components/
│   │               ├── review-panel.tsx     # Approve/reject/request changes
│   │               ├── edit-form.tsx        # Admin edit form
│   │               └── history-log.tsx      # Audit history
│   │
│   └── api/
│       ├── auth/
│       │   └── callback/
│       │       └── route.ts                 # OAuth callback handler
│       │
│       ├── submit/
│       │   ├── draft/
│       │   │   ├── route.ts                 # POST: create draft
│       │   │   └── [id]/
│       │   │       └── route.ts             # GET/PUT/DELETE draft
│       │   │
│       │   ├── event/
│       │   │   └── route.ts                 # POST: submit for review
│       │   │
│       │   └── series/
│       │       ├── search/
│       │       │   └── route.ts             # GET: search existing series
│       │       └── route.ts                 # POST: create new series
│       │
│       └── admin/
│           └── events/
│               └── [id]/
│                   ├── approve/
│                   │   └── route.ts         # POST: approve
│                   ├── reject/
│                   │   └── route.ts         # POST: reject
│                   ├── request-changes/
│                   │   └── route.ts         # POST: request changes
│                   └── delete/
│                       └── route.ts         # POST: soft delete
│
├── components/
│   ├── auth/
│   │   ├── index.ts
│   │   ├── auth-provider.tsx                # Session context
│   │   ├── login-modal.tsx                  # Magic link login
│   │   ├── login-form.tsx                   # Email input form
│   │   └── user-menu.tsx                    # Logged in user dropdown
│   │
│   ├── submit/
│   │   ├── index.ts
│   │   ├── form-container.tsx               # Multi-step form wrapper
│   │   ├── form-navigation.tsx              # Step indicator & nav
│   │   ├── form-actions.tsx                 # Save/Next/Back buttons
│   │   ├── auto-save-indicator.tsx          # "Saving..." / "Saved"
│   │   │
│   │   ├── fields/                          # Form field components
│   │   │   ├── index.ts
│   │   │   ├── title-input.tsx
│   │   │   ├── description-editor.tsx       # Rich text or textarea
│   │   │   ├── category-select.tsx
│   │   │   ├── date-time-picker.tsx
│   │   │   ├── location-picker.tsx          # Search/create venue
│   │   │   ├── price-input.tsx
│   │   │   ├── image-upload.tsx
│   │   │   └── series-selector.tsx          # Link to existing series
│   │   │
│   │   ├── series/                          # Series creation
│   │   │   ├── index.ts
│   │   │   ├── series-type-picker.tsx
│   │   │   ├── multi-date-picker.tsx        # Pick multiple dates
│   │   │   ├── recurrence-builder.tsx       # Build RRULE
│   │   │   └── series-preview.tsx           # Show generated dates
│   │   │
│   │   └── preview/
│   │       ├── index.ts
│   │       └── event-preview-card.tsx       # Preview before submit
│   │
│   └── admin/
│       ├── review/
│       │   ├── index.ts
│       │   ├── review-panel.tsx             # Main approve/reject UI
│       │   ├── changes-form.tsx             # Request changes form
│       │   └── rejection-form.tsx           # Rejection reason form
│       │
│       └── edit/
│           ├── index.ts
│           └── admin-event-form.tsx         # Full admin edit form
│
├── data/
│   ├── auth/
│   │   ├── index.ts
│   │   └── get-session.ts                   # Get current user
│   │
│   ├── submit/
│   │   ├── index.ts
│   │   ├── create-draft.ts
│   │   ├── update-draft.ts
│   │   ├── delete-draft.ts
│   │   ├── get-draft.ts
│   │   ├── get-user-drafts.ts
│   │   ├── submit-event.ts                  # Draft → pending_review
│   │   └── get-user-submissions.ts
│   │
│   ├── series/
│   │   ├── search-series.ts                 # For linking
│   │   └── create-series.ts                 # Create new series
│   │
│   └── admin/
│       ├── approve-event.ts
│       ├── reject-event.ts
│       ├── request-changes.ts
│       ├── soft-delete-event.ts
│       └── restore-event.ts
│
├── lib/
│   ├── auth/
│   │   ├── index.ts
│   │   ├── is-admin.ts                      # Check admin status
│   │   └── require-auth.ts                  # Middleware helper
│   │
│   ├── events/
│   │   ├── index.ts
│   │   ├── status-transitions.ts            # State machine rules
│   │   └── generate-recurring.ts            # Generate events from pattern
│   │
│   └── validation/
│       ├── index.ts
│       ├── event-schema.ts                  # Zod schemas
│       └── series-schema.ts
│
└── types/
    └── submission.ts                        # All submission types
```

---

## Implementation Order

### Phase 1: Foundation (Do First)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: FOUNDATION                                                         │
│  Priority: HIGH | Effort: MEDIUM                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1.1 DATABASE MIGRATION                                                      │
│      □ Run 00007_event_submission_flows.sql                                  │
│      □ Verify tables created                                                 │
│      □ Test RLS policies                                                     │
│                                                                              │
│  1.2 AUTH SETUP                                                              │
│      □ Enable magic link in Supabase dashboard                               │
│      □ Create /app/(auth)/login/page.tsx                                     │
│      □ Create /app/(auth)/callback/route.ts                                  │
│      □ Create auth provider component                                        │
│      □ Create login modal component                                          │
│      □ Add user menu to header                                               │
│                                                                              │
│  1.3 TYPES & VALIDATION                                                      │
│      □ Create types/submission.ts                                            │
│      □ Create lib/validation/event-schema.ts (Zod)                           │
│      □ Create lib/auth/is-admin.ts                                           │
│                                                                              │
│  1.4 LOGGING SETUP                                                           │
│      □ Add submission log prefixes to logger.ts                              │
│      □ Create submitLogger instance                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Submission Form (Core Feature)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: SUBMISSION FORM                                                    │
│  Priority: HIGH | Effort: HIGH                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  2.1 DRAFT API                                                               │
│      □ data/submit/create-draft.ts                                           │
│      □ data/submit/update-draft.ts                                           │
│      □ data/submit/get-draft.ts                                              │
│      □ API routes: /api/submit/draft/*                                       │
│                                                                              │
│  2.2 FORM INFRASTRUCTURE                                                     │
│      □ components/submit/form-container.tsx                                  │
│      □ components/submit/form-navigation.tsx                                 │
│      □ components/submit/form-actions.tsx                                    │
│      □ components/submit/auto-save-indicator.tsx                             │
│                                                                              │
│  2.3 FORM STEPS (one at a time)                                              │
│      □ Step 1: Basic Info (title, desc, category)                            │
│      □ Step 2: Event Type (single/series/recurring)                          │
│      □ Step 3: Date/Time                                                     │
│      □ Step 4: Location                                                      │
│      □ Step 5: Pricing                                                       │
│      □ Step 6: Image                                                         │
│      □ Step 7: Review & Submit                                               │
│                                                                              │
│  2.4 SUBMIT FLOW                                                             │
│      □ data/submit/submit-event.ts                                           │
│      □ /submit/success page                                                  │
│      □ Email notification (optional)                                         │
│                                                                              │
│  2.5 MY SUBMISSIONS                                                          │
│      □ data/submit/get-user-submissions.ts                                   │
│      □ /submit/my-submissions page                                           │
│      □ Status badges and tracking                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 3: Series Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: SERIES INTEGRATION                                                 │
│  Priority: MEDIUM | Effort: MEDIUM                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  3.1 SERIES SEARCH/LINK                                                      │
│      □ components/submit/fields/series-selector.tsx                          │
│      □ data/series/search-series.ts                                          │
│      □ API: /api/submit/series/search                                        │
│                                                                              │
│  3.2 NEW SERIES CREATION                                                     │
│      □ components/submit/series/series-type-picker.tsx                       │
│      □ components/submit/series/multi-date-picker.tsx                        │
│      □ data/series/create-series.ts                                          │
│                                                                              │
│  3.3 RECURRING EVENTS                                                        │
│      □ components/submit/series/recurrence-builder.tsx                       │
│      □ lib/events/generate-recurring.ts                                      │
│      □ components/submit/series/series-preview.tsx                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 4: Admin Review

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: ADMIN REVIEW                                                       │
│  Priority: HIGH | Effort: MEDIUM                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  4.1 ENHANCED ADMIN QUEUE                                                    │
│      □ Update /admin/events/pending page                                     │
│      □ Add filters: source, category, submitter                              │
│      □ Show submitter history (how many approved before)                     │
│                                                                              │
│  4.2 REVIEW ACTIONS                                                          │
│      □ components/admin/review/review-panel.tsx                              │
│      □ data/admin/request-changes.ts                                         │
│      □ API: /api/admin/events/[id]/request-changes                           │
│                                                                              │
│  4.3 ADMIN EDIT                                                              │
│      □ /admin/events/[id]/edit page                                          │
│      □ components/admin/edit/admin-event-form.tsx                            │
│                                                                              │
│  4.4 SOFT DELETE                                                             │
│      □ data/admin/soft-delete-event.ts                                       │
│      □ data/admin/restore-event.ts                                           │
│      □ API routes                                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Routes

### Authentication

```typescript
// POST /api/auth/login
// Request: { email: string }
// Response: { success: true } (magic link sent)

// GET /api/auth/callback?token=xxx&type=magiclink
// Handles Supabase callback, sets session, redirects
```

### Draft Management

```typescript
// POST /api/submit/draft
// Request: { draft_data: EventDraftData }
// Response: { id: string, draft: EventDraft }

// GET /api/submit/draft/[id]
// Response: { draft: EventDraft }

// PUT /api/submit/draft/[id]
// Request: { draft_data: EventDraftData, current_step: number }
// Response: { draft: EventDraft }

// DELETE /api/submit/draft/[id]
// Response: { success: true }
```

### Event Submission

```typescript
// POST /api/submit/event
// Request: { draft_id: string } or { event_data: EventDraftData }
// Response: { event_id: string, status: 'pending_review' }
```

### Series

```typescript
// GET /api/submit/series/search?q=pottery&limit=20
// Response: { series: SeriesCard[] }

// POST /api/submit/series
// Request: { series_data: SeriesDraftData, events: EventDraftData[] }
// Response: { series_id: string, event_ids: string[] }
```

### Admin Actions

```typescript
// POST /api/admin/events/[id]/approve
// Request: { notes?: string }
// Response: { success: true, event_id: string }

// POST /api/admin/events/[id]/reject
// Request: { reason: string, notes?: string }
// Response: { success: true }

// POST /api/admin/events/[id]/request-changes
// Request: { message: string, notes?: string }
// Response: { success: true }

// POST /api/admin/events/[id]/delete
// Request: { reason?: string }
// Response: { success: true }

// POST /api/admin/events/[id]/restore
// Response: { success: true }
```

---

## Component Specifications

### Form Container

```typescript
// components/submit/form-container.tsx

interface FormContainerProps {
  draftId?: string;           // If editing existing draft
  initialData?: EventDraftData;
}

// Features:
// - Manages form state across steps
// - Auto-saves to draft every 30s or on step change
// - Tracks completed steps
// - Handles final submission
// - Shows validation errors
```

### Form Navigation

```typescript
// components/submit/form-navigation.tsx

interface FormNavigationProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  disabled?: boolean;
}

// Visual: Horizontal stepper with icons
// Completed steps: Green check
// Current step: Highlighted
// Future steps: Grayed out (unless completed)
```

### Series Selector

```typescript
// components/submit/fields/series-selector.tsx

interface SeriesSelectorProps {
  value: string | null;       // series_id
  onChange: (id: string | null) => void;
  onCreateNew: () => void;    // Switch to series creation mode
}

// Features:
// - Searchable dropdown
// - Shows series type badge
// - Shows upcoming event count
// - "Create new series" option
// - Debounced search (300ms)
```

### Recurrence Builder

```typescript
// components/submit/series/recurrence-builder.tsx

interface RecurrenceBuilderProps {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule) => void;
}

// Features:
// - Frequency picker (weekly, biweekly, monthly)
// - Day of week selector (for weekly)
// - Time picker
// - Duration input
// - End condition (date, count, or never)
// - Preview of next 5 occurrences
```

### Review Panel

```typescript
// components/admin/review/review-panel.tsx

interface ReviewPanelProps {
  event: SubmissionQueueItem;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onRequestChanges: (message: string) => void;
}

// Features:
// - Three main action buttons
// - Quick approve (one click)
// - Reject with required reason
// - Request changes with message
// - Optional notes for audit log
```

---

## Form Flow Details

### Step 1: Basic Info

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: BASIC INFO                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Fields:                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Event Title *                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ Summer Jazz Concert                                          │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │  Max 100 characters                                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Category *                                                          │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ 🎵 Music                                               ▼    │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │  Select the best fit                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Description                                                         │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ Join us for an evening of smooth jazz under the stars...   │    │    │
│  │  │                                                              │    │    │
│  │  │                                                              │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │  Describe your event                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Short Description (for listings)                                    │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ Smooth jazz under the stars at Lakefront                    │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │  Max 160 characters • Shows on event cards                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Validation:                                                                 │
│  - title: required, 3-100 chars                                             │
│  - category_id: required                                                     │
│  - description: optional, max 5000 chars                                     │
│  - short_description: optional, max 160 chars                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Event Type

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: EVENT TYPE                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  What kind of event is this?                                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ○ Single Event                                                      │    │
│  │    A one-time event on a specific date                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ○ Part of Existing Series                                           │    │
│  │    Add this event to a series that already exists                    │    │
│  │    ┌─────────────────────────────────────────────────────────┐      │    │
│  │    │  Search series: [_________________] 🔍                   │      │    │
│  │    │                                                          │      │    │
│  │    │  📚 Pottery 101 - Spring 2025  (Class, 4 sessions left)  │      │    │
│  │    │  🎵 Weekly Jazz Jam           (Recurring, Tuesdays)      │      │    │
│  │    └─────────────────────────────────────────────────────────┘      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ○ Start a New Series                                                │    │
│  │    Create a class, camp, workshop, or festival                       │    │
│  │    ┌─────────────────────────────────────────────────────────┐      │    │
│  │    │  Series Type:                                            │      │    │
│  │    │  ○ Class (multi-week course)                             │      │    │
│  │    │  ○ Camp (consecutive days)                               │      │    │
│  │    │  ○ Workshop (series of sessions)                         │      │    │
│  │    │  ○ Festival (multi-day event)                            │      │    │
│  │    │  ○ Season (collection of performances)                   │      │    │
│  │    └─────────────────────────────────────────────────────────┘      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ○ Recurring Event                                                   │    │
│  │    Repeats weekly, biweekly, or monthly                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 3: Date & Time (varies by event type)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: DATE & TIME                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FOR SINGLE EVENT:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Date: [February 14, 2025]   Time: [7:00 PM] - [10:00 PM]           │    │
│  │  □ All day event                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  FOR CLASS/WORKSHOP (manual dates):                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Session 1: [March 1, 2025]   [10:00 AM] - [12:00 PM]    [🗑️]       │    │
│  │  Session 2: [March 8, 2025]   [10:00 AM] - [12:00 PM]    [🗑️]       │    │
│  │  Session 3: [March 15, 2025]  [10:00 AM] - [12:00 PM]    [🗑️]       │    │
│  │                                                                      │    │
│  │  [+ Add another session]                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  FOR CAMP/FESTIVAL (consecutive):                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Start Date: [June 10, 2025]                                         │    │
│  │  End Date:   [June 14, 2025]   (5 days)                              │    │
│  │                                                                      │    │
│  │  Daily Times: [9:00 AM] - [3:00 PM]                                  │    │
│  │  □ Same time each day                                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  FOR RECURRING:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Repeats: [Weekly ▼]    Every: [1] week(s)                          │    │
│  │                                                                      │    │
│  │  On: □ Sun  □ Mon  ☑ Tue  □ Wed  □ Thu  □ Fri  □ Sat               │    │
│  │                                                                      │    │
│  │  Time: [7:00 PM] - [9:00 PM]                                        │    │
│  │                                                                      │    │
│  │  Ends: ○ Never                                                       │    │
│  │        ○ On date: [December 31, 2025]                                │    │
│  │        ○ After [52] occurrences                                      │    │
│  │                                                                      │    │
│  │  Preview:                                                            │    │
│  │  • Tuesday, Feb 4, 2025 at 7:00 PM                                   │    │
│  │  • Tuesday, Feb 11, 2025 at 7:00 PM                                  │    │
│  │  • Tuesday, Feb 18, 2025 at 7:00 PM                                  │    │
│  │  ... and 49 more                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Logging Standards

### Log Prefixes

```typescript
// Add to lib/utils/logger.ts

const SUBMISSION_PREFIXES: Record<string, string> = {
  // Draft actions
  draft_created: '📝 💾',
  draft_updated: '✏️ 💾',
  draft_deleted: '🗑️ 💾',
  draft_loaded: '📂 💾',

  // Submission actions
  event_submitted: '📤 🎫',
  event_resubmitted: '🔄 🎫',

  // Admin review
  event_approved: '✅ 🎫',
  event_rejected: '🚫 🎫',
  event_changes_requested: '📝 🎫',

  // Delete/restore
  event_soft_deleted: '🗑️ 🎫',
  event_restored: '♻️ 🎫',

  // Series
  series_created: '📚 ➕',
  series_linked: '🔗 📚',
  recurring_generated: '🔄 📅',

  // Auth
  user_login: '🔐 👤',
  user_logout: '🚪 👤',
};

export const submitLogger = createLogger('Submit');
```

### Example Log Output

```
📝 💾 [Submit] Draft created (draft:abc123..., user:john@example.com, 142ms)
✏️ 💾 [Submit] Draft updated: step 3 complete (draft:abc123..., 89ms)
📤 🎫 [Submit] Event submitted for review (event:xyz789..., draft:abc123..., 234ms)

✅ 🎫 [AdminEvents] Event approved: "Summer Jazz Concert" (event:xyz789..., admin:admin@happenlist.com, 156ms)

📚 ➕ [Submit] Series created: "Pottery 101 - Spring 2025" (series:def456..., type:class, 312ms)
🔄 📅 [Submit] Generated 12 recurring events (series:ghi789..., pattern:weekly, 523ms)
```

---

## Testing Checklist

### Authentication

- [ ] Magic link email is sent
- [ ] Magic link successfully logs in user
- [ ] Session persists across page refreshes
- [ ] Logout clears session
- [ ] Protected routes redirect to login
- [ ] Admin routes only accessible to admins

### Draft Management

- [ ] Create new draft
- [ ] Auto-save updates draft
- [ ] Load existing draft
- [ ] Delete draft
- [ ] Expired drafts are cleaned up
- [ ] User can only see own drafts

### Submission Form

- [ ] Navigate between steps
- [ ] Validation prevents advancing with errors
- [ ] Can go back to previous steps
- [ ] Data persists across steps
- [ ] Category dropdown works
- [ ] Date/time pickers work
- [ ] Location search/create works
- [ ] Price inputs validate correctly
- [ ] Image upload works
- [ ] Review shows all entered data
- [ ] Submit creates event with status pending_review

### Series Integration

- [ ] Search existing series
- [ ] Link event to series
- [ ] Create new series during submission
- [ ] Multi-date picker works
- [ ] Recurrence builder works
- [ ] Generated dates preview is accurate
- [ ] Correct number of events created

### Admin Review

- [ ] Pending queue shows all pending events
- [ ] Filters work (category, source, date)
- [ ] Approve changes status to published
- [ ] Reject requires reason
- [ ] Request changes sets status and message
- [ ] User sees feedback on my-submissions page
- [ ] User can resubmit after changes requested

### Edit & Delete

- [ ] Admin can edit any event
- [ ] Soft delete sets deleted_at
- [ ] Deleted events hidden from public
- [ ] Restore clears deleted_at
- [ ] Audit log captures all actions

---

## Environment Variables

```env
# Add to .env.local

# Admin emails (comma-separated)
ADMIN_EMAILS=admin@happenlist.com,your@email.com

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Site URL for magic link redirect
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Email config for notifications
# RESEND_API_KEY=xxx
```

---

## NPM Packages to Install

```bash
# Form handling
npm install react-hook-form zod @hookform/resolvers

# Date handling (if not already installed)
npm install date-fns

# Optional: Rich text editor for descriptions
npm install @tiptap/react @tiptap/starter-kit

# Optional: Image cropping
npm install react-image-crop
```

---

## Quick Start for Implementer

```bash
# 1. Run the SQL migration
# Go to Supabase Dashboard > SQL Editor
# Paste: 00007_event_submission_flows.sql
# Click Run

# 2. Enable Magic Link in Supabase
# Dashboard > Authentication > Providers > Email
# Enable "Confirm email" and "Magic Link"

# 3. Set environment variables
# Add ADMIN_EMAILS to .env.local

# 4. Install packages
npm install react-hook-form zod @hookform/resolvers

# 5. Start with Phase 1 files:
# - src/app/(auth)/login/page.tsx
# - src/app/(auth)/callback/route.ts
# - src/components/auth/auth-provider.tsx
# - src/components/auth/login-modal.tsx
# - src/lib/auth/is-admin.ts
# - src/types/submission.ts

# 6. Test auth flow before building forms
```

---

**Good luck, future implementer! You've got this! 🚀**
