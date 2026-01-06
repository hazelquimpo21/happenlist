# Admin Edit Anywhere

> Superadmins can edit events directly from any public event page, no need to navigate to /admin.

---

## Overview

This feature adds a floating admin toolbar to public event pages (`/event/[slug]`) that allows superadmins to:

- **Quick Edit** - Fix titles, descriptions, dates, pricing, status inline
- **Full Edit** - Link to comprehensive edit page for complex changes
- **View Status** - See current event status at a glance
- **Series Awareness** - See if event is part of a series

---

## User Roles

| Role | Admin Toolbar | Quick Edit | Full Edit | Delete |
|------|--------------|------------|-----------|--------|
| Guest | No | No | No | No |
| Attendee | No | No | No | No |
| Admin | Yes (view only) | No | No | No |
| **Superadmin** | Yes | Yes | Yes | Yes |

---

## Architecture

```
PUBLIC EVENT PAGE (/event/[slug])
        |
        v
+------------------+     +----------------------+
| Server Component |---->| AdminToolbar         |
| (page.tsx)       |     | (Client Component)   |
+------------------+     +----------------------+
        |                         |
        |                         v
        |                +----------------------+
        |                | QuickEditDrawer      |
        |                | (Slide-out panel)    |
        |                +----------------------+
        |                         |
        |                         v
        |                +----------------------+
        |                | API: /api/superadmin |
        |                | /events/[id]         |
        |                +----------------------+
        |                         |
        v                         v
+------------------------------------------+
|              SUPABASE                     |
|  events table | admin_audit_log table    |
+------------------------------------------+
```

---

## Components

### File Structure

```
src/components/admin-anywhere/
├── index.ts                  # Module exports
├── admin-toolbar.tsx         # Sticky toolbar at top of page
├── quick-edit-drawer.tsx     # Slide-out edit panel
├── quick-edit-form.tsx       # Form fields for editing
└── status-badge-select.tsx   # Status dropdown component

src/hooks/
└── use-admin-edit.ts         # Hook for edit API calls
```

### AdminToolbar

Sticky bar shown at top of event pages for superadmins:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🛡️ SUPERADMIN  │ Status: Published ✅ │ [Quick Edit] [Full Edit]│
└─────────────────────────────────────────────────────────────────┘
```

### QuickEditDrawer

Slide-out panel with editable fields:

- Title
- Short description
- Full description
- Start date & time
- End date & time
- Price type, low, high
- Free toggle
- Ticket URL
- Status
- Edit notes (for audit log)
- Delete button

---

## Quick Edit Fields

| Field | Quick Edit | Full Edit | Notes |
|-------|------------|-----------|-------|
| Title | ✅ | ✅ | |
| Short Description | ✅ | ✅ | |
| Full Description | ✅ | ✅ | |
| Start DateTime | ✅ | ✅ | |
| End DateTime | ✅ | ✅ | |
| Price Type | ✅ | ✅ | free/fixed/range/varies |
| Price Low/High | ✅ | ✅ | |
| Is Free | ✅ | ✅ | |
| Ticket URL | ✅ | ✅ | |
| Status | ✅ | ✅ | |
| Location | ❌ | ✅ | Requires venue picker |
| Organizer | ❌ | ✅ | Requires organizer picker |
| Category | ❌ | ✅ | Requires category picker |
| Images | ❌ | ✅ | URL input or upload |
| Series Settings | ❌ | ✅ | Complex, see Phase 2 |
| SEO Fields | ❌ | ✅ | meta_title, meta_description |

---

## API Endpoints

All endpoints require superadmin authentication.

### PATCH `/api/superadmin/events/[id]`

Edit event fields.

```typescript
// Request
{
  "updates": {
    "title": "New Title",
    "description": "Updated description"
  },
  "notes": "Fixed typo"
}

// Response
{
  "success": true,
  "message": "Event updated successfully",
  "eventId": "uuid"
}
```

### POST `/api/superadmin/events/[id]/status`

Change event status.

```typescript
// Request
{
  "status": "published",
  "notes": "Manually publishing"
}

// Response
{
  "success": true,
  "newStatus": "published"
}
```

### DELETE `/api/superadmin/events/[id]`

Soft delete an event.

```typescript
// Request
{
  "reason": "Spam event",
  "hardDelete": false
}

// Response
{
  "success": true,
  "message": "Event deleted"
}
```

### POST `/api/superadmin/events/[id]/restore`

Restore a soft-deleted event.

---

## States

### Event Status Values

| Status | Display | Color |
|--------|---------|-------|
| `draft` | Draft | Gray |
| `pending_review` | Pending Review | Amber |
| `changes_requested` | Changes Requested | Orange |
| `published` | Published | Green |
| `rejected` | Rejected | Red |
| `cancelled` | Cancelled | Gray |

### Drawer States

| State | Description |
|-------|-------------|
| `closed` | Drawer not visible |
| `open` | Drawer visible, idle |
| `saving` | Save in progress |
| `saved` | Save successful (auto-closes) |
| `error` | Save failed, show error message |

---

## Security

### Two-Layer Protection

1. **Application Layer**: `SUPERADMIN_EMAILS` environment variable
2. **Database Layer**: `user_roles` table + RLS policies

Both must pass for any mutation to succeed.

### Audit Trail

All edits logged to `admin_audit_log` table:

```json
{
  "action": "superadmin_edit",
  "entity_type": "event",
  "entity_id": "uuid",
  "admin_email": "superadmin@example.com",
  "changes": {
    "title": { "before": "Old", "after": "New" }
  },
  "notes": "Fixed typo"
}
```

---

## Logging

Console logging with emoji prefixes:

```
🛡️ [AdminToolbar] Superadmin detected: user@example.com
✏️ [QuickEdit] Opening drawer for event: uuid
💾 [QuickEdit] Saving changes...
✅ [QuickEdit] Event updated successfully
❌ [QuickEdit] Error: Unauthorized
```

---

## Implementation Phases

### Phase 1: Admin Edit Anywhere (Current)

**Status: Complete**

- [x] Plan & documentation
- [x] Update auth to include `isSuperAdmin` in UserSession type
- [x] Update AuthContext to check superadmin status
- [x] Create AdminToolbar component
- [x] Create QuickEditDrawer component
- [x] Create QuickEditForm component
- [x] Create StatusBadgeSelect component
- [x] Create useAdminEdit hook
- [x] Create module exports (index.ts)
- [x] Integrate into event detail page
- [ ] Test end-to-end (requires running dev server)

### Phase 2: Series-Aware Editing (Future)

**Status: Planned**

When editing an event that's part of a series, users will see:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ This event is part of "Jazz Wednesdays" series              │
│                                                                  │
│  What would you like to edit?                                    │
│                                                                  │
│  ○ Just this event (Feb 14)                                     │
│  ○ This and all future events                                   │
│  ○ The entire series template                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Scope:**
- Detect if event has `series_id`
- Show series info badge
- "Edit this event only" (default)
- "Edit all future events" (batch update)
- "Edit series template" (navigate to series edit page)

**Performance Considerations:**
- Batch updates use background jobs for large series
- Optimistic UI for immediate feedback
- Progress indicator for multi-event updates

### Phase 3: Advanced Features (Future)

**Status: Backlog**

- Inline location/organizer/category pickers in quick edit
- Image upload (not just URL)
- Slug/URL redirect system for changed titles
- Optimistic locking for concurrent edits
- Undo/revert changes

---

## Environment Variables

```bash
# Required for superadmin access
SUPERADMIN_EMAILS=admin@example.com,superadmin@example.com

# Existing (for regular admin access)
ADMIN_EMAILS=moderator@example.com
```

---

## Testing Checklist

- [ ] Superadmin sees toolbar on event page
- [ ] Non-superadmin does NOT see toolbar
- [ ] Quick edit drawer opens
- [ ] Form fields populate with current values
- [ ] Save updates event in database
- [ ] Audit log entry created
- [ ] Page refreshes with new data
- [ ] Error states display correctly
- [ ] Delete soft-deletes event
- [ ] Series badge shows for series events

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Toolbar not showing | Not superadmin | Check `SUPERADMIN_EMAILS` env var |
| Save fails with 403 | Auth issue | Verify session, check RLS policies |
| Changes not appearing | Cache | `router.refresh()` should handle this |
| Series badge missing | No series_id | Event not linked to series |

---

*Last updated: January 2026*
