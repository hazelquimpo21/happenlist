# 🦸 Superadmin Event Management

> Complete guide to the superadmin event management system for Happenlist

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Feature Reference](#feature-reference)
6. [API Endpoints](#api-endpoints)
7. [State Diagram](#state-diagram)
8. [File Structure](#file-structure)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Superadmin Event Management system allows designated superadmins to:

- ✏️ **Edit ANY event** - regardless of who created it
- 🗑️ **Delete ANY event** - soft delete with full audit trail
- ♻️ **Restore deleted events** - undo soft deletes
- 🔄 **Change event status** - directly set any status
- 📋 **View complete audit history** - track all changes

This is designed for:
- **Platform owners** who need full control
- **Support staff** fixing user-submitted events
- **Content moderators** managing event quality

---

## 🏗️ Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                               │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ Event Edit     │  │ Event Review   │  │ Admin Events  │ │
│  │ Page (edit/)   │  │ Page ([id]/)   │  │ List Page     │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API ROUTES                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ /api/superadmin/events/[id]           (PATCH, DELETE)  │ │
│  │ /api/superadmin/events/[id]/restore   (POST)           │ │
│  │ /api/superadmin/events/[id]/status    (POST)           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ src/data/superadmin/                                   │ │
│  │   superadmin-event-actions.ts                          │ │
│  │   index.ts                                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTH LAYER                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ src/lib/auth/                                          │ │
│  │   is-superadmin.ts  - Check superadmin status          │ │
│  │   session.ts        - requireSuperadminAuth()          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase)                      │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ user_roles     │  │ events         │  │ admin_audit   │ │
│  │ table          │  │ table          │  │ _log table    │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ RLS Policies: Superadmins can read/update/delete all   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Defense in Depth

We use **two layers of security**:

1. **Application Layer** - `SUPERADMIN_EMAILS` env var
2. **Database Layer** - `user_roles` table + RLS policies

Both must pass for an action to succeed.

---

## 🚀 Setup Instructions

### Step 1: Run the Database Migration

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Copy contents of:
-- supabase/migrations/00012_superadmin_event_management.sql
```

This creates:
- `user_roles` table
- Helper functions (`is_superadmin_by_email()`, etc.)
- RLS policies for superadmin access
- Performance indexes

### Step 2: Add Superadmin Emails to Database

```sql
-- Add your superadmin(s) to the database
INSERT INTO user_roles (user_email, role, notes, granted_by)
VALUES
  ('your-email@example.com', 'superadmin', 'Initial setup', 'migration'),
  ('another-admin@example.com', 'superadmin', 'Co-founder', 'migration');
```

### Step 3: Configure Environment Variables

Add to your `.env.local`:

```bash
# Superadmin emails (comma-separated)
SUPERADMIN_EMAILS=your-email@example.com,another-admin@example.com

# Existing admin emails (optional, for regular admin access)
ADMIN_EMAILS=regular-admin@example.com
```

### Step 4: Verify Setup

1. Log in with a superadmin email
2. Go to `/admin/events`
3. Click on any event
4. You should see a purple "🛡️ Edit Event" button
5. Click to access the full edit form

---

## 👥 User Roles & Permissions

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    🦸 SUPERADMIN                             │
│  Can do EVERYTHING an admin can, PLUS:                       │
│  • Edit ANY event (regardless of owner)                      │
│  • Delete ANY event                                          │
│  • Restore deleted events                                    │
│  • Change event status directly                              │
│  • Manage user roles (future)                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    👨‍💼 ADMIN                                  │
│  • Approve/reject submitted events                           │
│  • Request changes on events                                 │
│  • View submission queue                                     │
│  • Access admin dashboard                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    👤 USER                                   │
│  • Submit events for review                                  │
│  • Edit own draft/changes_requested events                   │
│  • View own submission history                               │
└─────────────────────────────────────────────────────────────┘
```

### Permission Matrix

| Action                    | User | Admin | Superadmin |
|---------------------------|------|-------|------------|
| View published events     | ✅   | ✅    | ✅         |
| Submit new events         | ✅   | ✅    | ✅         |
| Edit own drafts           | ✅   | ✅    | ✅         |
| Approve/reject events     | ❌   | ✅    | ✅         |
| Edit ANY event            | ❌   | ❌    | ✅         |
| Delete ANY event          | ❌   | ❌    | ✅         |
| Restore deleted events    | ❌   | ❌    | ✅         |
| Change status directly    | ❌   | ❌    | ✅         |

---

## 📖 Feature Reference

### ✏️ Edit Any Event

**Location**: `/admin/events/[id]/edit`

Superadmins can edit:
- Title, descriptions
- Date & time
- Pricing information
- Status (directly!)
- All other event fields

All changes are:
- Logged to `admin_audit_log`
- Timestamped with editor info
- Tracked with `edit_count` increment

### 🗑️ Delete Events

**Types**:
- **Soft Delete** (default): Sets `deleted_at`, can be restored
- **Hard Delete** (API only): Permanently removes from database

**Soft Delete Flow**:
```
Event (status: published)
    │
    ▼ [superadmin deletes]
Event (deleted_at: timestamp, deleted_by: email)
    │
    ▼ [filtered out from public queries]
Hidden from users (but still in database)
```

### ♻️ Restore Events

Restores a soft-deleted event by clearing:
- `deleted_at`
- `deleted_by`
- `delete_reason`

The event returns to its previous status.

### 🔄 Change Status

Directly set any status:
- `draft`
- `pending_review`
- `changes_requested`
- `published`
- `rejected`
- `cancelled`

---

## 🔌 API Endpoints

### PATCH `/api/superadmin/events/[id]`

Edit an event.

**Request**:
```json
{
  "updates": {
    "title": "New Title",
    "description": "Updated description..."
  },
  "notes": "Fixed typo in title"
}
```

**Response**:
```json
{
  "success": true,
  "message": "✅ Event \"New Title\" updated successfully",
  "eventId": "uuid",
  "timestamp": "2024-01-15T..."
}
```

### DELETE `/api/superadmin/events/[id]`

Delete an event (soft delete by default).

**Request**:
```json
{
  "reason": "Spam event reported by users",
  "hardDelete": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "🗑️ Event \"Title\" deleted (can be restored)",
  "eventId": "uuid",
  "wasHardDelete": false
}
```

### POST `/api/superadmin/events/[id]/restore`

Restore a soft-deleted event.

**Request**: (empty body)

**Response**:
```json
{
  "success": true,
  "message": "♻️ Event \"Title\" restored successfully",
  "eventId": "uuid"
}
```

### POST `/api/superadmin/events/[id]/status`

Change event status.

**Request**:
```json
{
  "status": "published",
  "notes": "Manually publishing after review"
}
```

**Response**:
```json
{
  "success": true,
  "message": "🔄 Event status changed: draft → published",
  "eventId": "uuid",
  "newStatus": "published"
}
```

---

## 📊 State Diagram

### Event Status Flow

```
                              ┌──────────────┐
                              │    DRAFT     │
                              └──────┬───────┘
                                     │
                                     │ [user submits]
                                     ▼
                              ┌──────────────┐
                       ┌──────│   PENDING    │──────┐
                       │      │   REVIEW     │      │
                       │      └──────────────┘      │
                       │                            │
           [admin approves]              [admin requests changes]
                       │                            │
                       ▼                            ▼
                ┌──────────────┐           ┌──────────────┐
                │  PUBLISHED   │           │   CHANGES    │
                │              │           │  REQUESTED   │
                └──────────────┘           └──────┬───────┘
                       ▲                          │
                       │                          │ [user resubmits]
                       │                          │
                       └──────────────────────────┘

          [admin rejects]
                │
                ▼
         ┌──────────────┐
         │   REJECTED   │
         └──────────────┘

🦸 SUPERADMIN: Can set ANY status directly, bypassing the normal flow
```

---

## 📁 File Structure

```
src/
├── lib/auth/
│   ├── is-superadmin.ts      # 🆕 Superadmin detection utilities
│   ├── is-admin.ts           # Admin detection (existing)
│   ├── session.ts            # Updated with requireSuperadminAuth()
│   └── index.ts              # Updated exports
│
├── data/superadmin/
│   ├── superadmin-event-actions.ts   # 🆕 Edit/delete/restore actions
│   └── index.ts              # 🆕 Module exports
│
├── app/api/superadmin/events/[id]/
│   ├── route.ts              # 🆕 PATCH (edit) & DELETE endpoints
│   ├── restore/route.ts      # 🆕 POST restore endpoint
│   └── status/route.ts       # 🆕 POST status change endpoint
│
├── app/admin/events/[id]/
│   ├── page.tsx              # Updated with superadmin edit button
│   └── edit/page.tsx         # 🆕 Full edit page for superadmins
│
├── components/superadmin/
│   ├── event-edit-form.tsx   # 🆕 Comprehensive edit form
│   └── index.ts              # 🆕 Component exports
│
└── lib/utils/logger.ts       # Updated with superadmin action logging

supabase/migrations/
└── 00012_superadmin_event_management.sql  # 🆕 Database migration
```

---

## 🔐 Security Considerations

### Two-Layer Protection

1. **Environment Variable Check** (Application Layer)
   - Fast, no database call
   - Configured via `SUPERADMIN_EMAILS`
   - Checked first in all operations

2. **Database Role Check** (Database Layer)
   - RLS policies query `user_roles` table
   - Ensures security even if app layer is bypassed
   - Required for direct Supabase operations

### Audit Trail

All superadmin actions are logged to `admin_audit_log`:

```sql
{
  "action": "superadmin_edit",
  "entity_type": "event",
  "entity_id": "uuid",
  "admin_email": "superadmin@example.com",
  "changes": {
    "fields_changed": ["title", "description"],
    "details": {
      "title": { "before": "Old", "after": "New" }
    }
  },
  "notes": "Fixed typo",
  "created_at": "2024-01-15T..."
}
```

### Best Practices

1. **Keep superadmin list small** - Only platform owners
2. **Use strong authentication** - Enable 2FA for superadmin accounts
3. **Review audit logs regularly** - Monitor for unusual activity
4. **Document all changes** - Use the notes field

---

## 🔧 Troubleshooting

### "Superadmin access required" Error

**Causes**:
1. Email not in `SUPERADMIN_EMAILS` env var
2. Email not in `user_roles` table
3. Not logged in

**Solution**:
```bash
# Check env var
echo $SUPERADMIN_EMAILS

# Check database
SELECT * FROM user_roles WHERE role = 'superadmin';
```

### Edit Button Not Showing

**Check**:
1. User is logged in
2. User email is in superadmin list
3. Page is refreshing with new session

### Changes Not Saving

**Check browser console for errors**:
- API response error messages
- Network tab for 403/401 responses

**Common issues**:
- RLS policy blocking update
- Missing fields in update request
- Invalid status value

### Audit Log Not Recording

**Check**:
- `admin_audit_log` table exists
- Insert permissions are correct
- No errors in API route logs

---

## 📞 Support

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/hazelquimpo21/happenlist/issues)
2. Review server logs for detailed error messages
3. Verify both env vars AND database roles are configured

---

*Last updated: 2024-01-15*
*Version: 1.0.0*
