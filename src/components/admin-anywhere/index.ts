/**
 * ADMIN ANYWHERE MODULE
 * =====================
 * Components for superadmin event editing from any page.
 *
 * This module provides the UI for superadmins to quickly edit events
 * directly from public event pages, without navigating to /admin.
 *
 * Components:
 * - AdminToolbar: Sticky bar at top of event pages
 * - QuickEditDrawer: Slide-out panel for editing
 * - QuickEditForm: Form fields for editing
 * - StatusBadgeSelect: Status dropdown component
 *
 * Usage:
 * ```tsx
 * import { AdminToolbar } from '@/components/admin-anywhere';
 *
 * // In your event page:
 * <AdminToolbar
 *   event={event}
 *   isSuperAdmin={session?.isSuperAdmin ?? false}
 *   onEventUpdated={() => router.refresh()}
 * />
 * ```
 *
 * @module components/admin-anywhere
 */

// Main components
export { AdminToolbar } from './admin-toolbar';
export { SuperadminBar } from './superadmin-bar';
export { QuickEditDrawer } from './quick-edit-drawer';
export { QuickEditForm } from './quick-edit-form';
export { StatusBadgeSelect, STATUS_OPTIONS } from './status-badge-select';

// Types
export type { AdminToolbarEvent } from './admin-toolbar';
