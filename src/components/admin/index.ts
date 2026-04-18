/**
 * ADMIN COMPONENTS
 * =================
 * Barrel export for admin components.
 */

export { AdminSidebar } from './admin-sidebar';
export { AdminHeader, AdminBreadcrumbs } from './admin-header';
export { StatCard, StatCardGrid } from './stat-card';
export { AdminEventCard, AdminEventCardSkeleton } from './admin-event-card';
export { AdminEventFilters } from './admin-event-filters';
export { AdminEventList } from './admin-event-list';

// Directory entity primitives (organizers, venues, performers, membership_orgs)
export { EntityCardGrid } from './entity-card-grid';
export { EntityListPage, parseEntityListParams } from './entity-list-page';
export type { EntityListParams, ExtraFilterSpec } from './entity-list-page';