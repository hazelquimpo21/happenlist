/**
 * ROUTE CONSTANTS
 * ===============
 * Central definition of all application routes.
 */

/**
 * Public routes accessible to everyone.
 */
export const ROUTES = {
  // Home
  home: '/',

  // Events
  events: '/events',
  eventsToday: '/events/today',
  eventsWeekend: '/events/this-weekend',
  eventDetail: (slug: string, date: string) => `/event/${slug}-${date}`,
  eventsCategory: (categorySlug: string) => `/events/${categorySlug}`,
  eventsMonth: (year: number, month: string) => `/events/archive/${year}/${month}`,

  // Venues
  venues: '/venues',
  venueDetail: (slug: string) => `/venue/${slug}`,

  // Organizers
  organizers: '/organizers',
  organizerDetail: (slug: string) => `/organizer/${slug}`,

  // Search
  search: '/search',
  searchWithQuery: (query: string) => `/search?q=${encodeURIComponent(query)}`,

  // Static pages
  about: '/about',
  contact: '/contact',

  // Auth (Phase 3)
  login: '/login',
  signup: '/signup',

  // User pages (Phase 3)
  myHearts: '/my/hearts',
  mySettings: '/my/settings',

  // Dashboard (Phase 4)
  dashboard: '/dashboard',
} as const;

/**
 * Navigation items for the header.
 */
export const NAV_ITEMS = [
  { label: 'Events', href: ROUTES.events },
  { label: 'Today', href: ROUTES.eventsToday },
  { label: 'This Weekend', href: ROUTES.eventsWeekend },
  { label: 'Venues', href: ROUTES.venues },
] as const;

/**
 * Footer navigation items.
 */
export const FOOTER_NAV = {
  discover: [
    { label: 'Events', href: ROUTES.events },
    { label: 'Venues', href: ROUTES.venues },
    { label: 'Organizers', href: ROUTES.organizers },
  ],
  about: [
    { label: 'About Us', href: ROUTES.about },
    { label: 'Contact', href: ROUTES.contact },
  ],
} as const;
