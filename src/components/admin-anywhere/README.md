# Admin Anywhere Components

> Superadmin event editing from any public event page.

---

## Quick Start

```tsx
// In your event page (server component):
import { AdminToolbar, type AdminToolbarEvent } from '@/components/admin-anywhere';
import { getSession, isSuperAdmin } from '@/lib/auth';

export default async function EventPage({ params }) {
  const [event, { session }] = await Promise.all([
    getEvent(params.slug),
    getSession(),
  ]);

  const userIsSuperAdmin = session ? isSuperAdmin(session.email) : false;

  // Build toolbar event data
  const adminToolbarEvent: AdminToolbarEvent = {
    id: event.id,
    title: event.title,
    slug: event.slug,
    status: event.status,
    // ... other fields
  };

  return (
    <>
      <AdminToolbar
        event={adminToolbarEvent}
        isSuperAdmin={userIsSuperAdmin}
      />
      {/* Rest of your page */}
    </>
  );
}
```

---

## Components

### AdminToolbar

Sticky bar at the top of event pages. Shows:
- Superadmin badge
- Event status with color-coded badge
- Series indicator (if applicable)
- Quick Edit button
- Full Edit link

```tsx
<AdminToolbar
  event={event}
  isSuperAdmin={true}
  onEventUpdated={() => router.refresh()}
/>
```

### QuickEditDrawer

Slide-out panel containing the edit form. Opens from the right side.

```tsx
<QuickEditDrawer
  event={event}
  isOpen={isDrawerOpen}
  onClose={() => setIsDrawerOpen(false)}
  onSaveSuccess={() => router.refresh()}
/>
```

### QuickEditForm

Form fields for quick editing. Includes:
- Title
- Short description
- Full description
- Start/end datetime
- Pricing (type, low, high, free toggle)
- Ticket URL
- Status dropdown
- Edit notes (for audit log)
- Delete button

### StatusBadgeSelect

Color-coded dropdown for event status.

```tsx
<StatusBadgeSelect
  value={formState.status}
  onChange={(newStatus) => handleStatusChange(newStatus)}
/>
```

---

## Hook: useAdminEdit

Hook for API calls to edit events.

```tsx
import { useAdminEdit } from '@/hooks/use-admin-edit';

function EditForm({ eventId }) {
  const {
    updateEvent,
    updateStatus,
    deleteEvent,
    restoreEvent,
    isLoading,
    error,
    success,
    reset,
  } = useAdminEdit(eventId);

  const handleSave = async () => {
    const result = await updateEvent(
      { title: 'New Title' },
      'Fixed typo'
    );
    if (result) {
      // Success!
    }
  };
}
```

---

## Data Flow

```
┌──────────────────┐
│  Event Page      │ (Server Component)
│  (page.tsx)      │
└────────┬─────────┘
         │
         │ Passes event data + isSuperAdmin
         ▼
┌──────────────────┐
│  AdminToolbar    │ (Client Component)
│                  │
└────────┬─────────┘
         │
         │ Opens on "Quick Edit" click
         ▼
┌──────────────────┐
│  QuickEditDrawer │ (Client Component)
│                  │
└────────┬─────────┘
         │
         │ Contains
         ▼
┌──────────────────┐
│  QuickEditForm   │ (Client Component)
│                  │
└────────┬─────────┘
         │
         │ Calls via useAdminEdit hook
         ▼
┌──────────────────┐
│  API Endpoints   │
│  /api/superadmin │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Supabase      │
│  events table    │
└──────────────────┘
```

---

## Status Values

| Status | Label | Color |
|--------|-------|-------|
| `draft` | Draft | Gray |
| `pending_review` | Pending Review | Amber |
| `changes_requested` | Changes Requested | Orange |
| `published` | Published | Green |
| `rejected` | Rejected | Red |
| `cancelled` | Cancelled | Gray |

---

## Environment Variables

Make sure these are set:

```env
# Superadmin emails (comma-separated)
SUPERADMIN_EMAILS=admin@example.com,superadmin@example.com
```

---

## Files

```
src/components/admin-anywhere/
├── README.md              # This file
├── index.ts               # Module exports
├── admin-toolbar.tsx      # Sticky toolbar (~120 lines)
├── quick-edit-drawer.tsx  # Slide-out panel (~120 lines)
├── quick-edit-form.tsx    # Form fields (~350 lines)
└── status-badge-select.tsx # Status dropdown (~80 lines)

src/hooks/
└── use-admin-edit.ts      # Edit API hook (~200 lines)
```

---

## Future Enhancements (Phase 2)

See [docs/ADMIN-ANYWHERE.md](/docs/ADMIN-ANYWHERE.md) for:
- Series-aware editing
- Batch updates for series events
- Image upload
- Location/organizer inline editing
