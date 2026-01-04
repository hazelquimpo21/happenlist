/**
 * ROUTE CONSTANTS
 * ===============
 * Central definition of all application routes.
 *
 * All routes are defined here for easy maintenance and type safety.
 * Use these constants instead of hardcoding route strings.
 */

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * Application routes.
 */
export const ROUTES = {
  // -------------------------------------------------------------------------
  // HOME
  // -------------------------------------------------------------------------
  home: '/',

  // -------------------------------------------------------------------------
  // EVENTS
  // -------------------------------------------------------------------------
  events: '/events',
  eventsToday: '/events/today',
  eventsWeekend: '/events/this-weekend',
  eventDetail: (slug: string, date: string) => `/event/${slug}-${date}`,
  eventsCategory: (categorySlug: string) => `/events/${categorySlug}`,
  eventsMonth: (year: number, month: string) => `/events/archive/${year}/${month}`,

  // -------------------------------------------------------------------------
  // SERIES
  // -------------------------------------------------------------------------
  series: '/series',
  seriesDetail: (slug: string) => `/series/${slug}`,
  seriesByType: (type: string) => `/series?type=${type}`,

  // -------------------------------------------------------------------------
  // VENUES
  // -------------------------------------------------------------------------
  venues: '/venues',
  venueDetail: (slug: string) => `/venue/${slug}`,

  // -------------------------------------------------------------------------
  // ORGANIZERS
  // -------------------------------------------------------------------------
  organizers: '/organizers',
  organizerDetail: (slug: string) => `/organizer/${slug}`,
  organizerClaim: (slug: string) => `/organizer/claim/${slug}`,
  organizerDashboard: '/organizer/dashboard',

  // -------------------------------------------------------------------------
  // SEARCH
  // -------------------------------------------------------------------------
  search: '/search',
  searchWithQuery: (query: string) => `/search?q=${encodeURIComponent(query)}`,

  // -------------------------------------------------------------------------
  // STATIC PAGES
  // -------------------------------------------------------------------------
  about: '/about',
  contact: '/contact',

  // -------------------------------------------------------------------------
  // AUTH ROUTES 🔐
  // -------------------------------------------------------------------------
  auth: {
    login: '/auth/login',
    loginWithRedirect: (redirect: string) =>
      `/auth/login?redirect=${encodeURIComponent(redirect)}`,
    callback: '/auth/callback',
    logout: '/auth/logout',
  },

  // Shortcut for common login redirect
  login: '/auth/login',

  // -------------------------------------------------------------------------
  // USER PAGES 👤
  // -------------------------------------------------------------------------
  my: {
    hearts: '/my/hearts',
    submissions: '/my/submissions',
    settings: '/my/settings',
  },

  // Shortcuts
  myHearts: '/my/hearts',
  mySubmissions: '/my/submissions',
  mySettings: '/my/settings',

  // -------------------------------------------------------------------------
  // SUBMIT EVENT
  // -------------------------------------------------------------------------
  submit: {
    new: '/submit/new',
    success: '/submit/success',
    edit: (id: string) => `/submit/edit/${id}`,
  },

  submitNew: '/submit/new',

  // -------------------------------------------------------------------------
  // ADMIN ROUTES 🔑
  // -------------------------------------------------------------------------
  admin: {
    home: '/admin',
    events: '/admin/events',
    eventsPending: '/admin/events/pending',
    eventReview: (id: string) => `/admin/events/${id}`,
    activity: '/admin/activity',
  },
} as const;

// ============================================================================
// NAVIGATION CONFIG
// ============================================================================

/**
 * Navigation items for the header.
 * These are the main nav links shown on desktop.
 */
export const NAV_ITEMS = [
  { label: 'Events', href: ROUTES.events },
  { label: 'Classes & Series', href: ROUTES.series },
  { label: 'Today', href: ROUTES.eventsToday },
  { label: 'This Weekend', href: ROUTES.eventsWeekend },
  { label: 'Venues', href: ROUTES.venues },
] as const;

/**
 * Footer navigation items.
 * Grouped by section.
 */
export const FOOTER_NAV = {
  discover: [
    { label: 'Events', href: ROUTES.events },
    { label: 'Classes & Series', href: ROUTES.series },
    { label: 'Venues', href: ROUTES.venues },
    { label: 'Organizers', href: ROUTES.organizers },
  ],
  about: [
    { label: 'About Us', href: ROUTES.about },
    { label: 'Contact', href: ROUTES.contact },
  ],
} as const;

// ============================================================================
// PROTECTED ROUTES CONFIG
// ============================================================================

/**
 * Routes that require authentication.
 * Used by middleware for automatic redirects.
 */
export const PROTECTED_ROUTES = {
  /** Routes requiring any authentication */
  authenticated: ['/my', '/submit', '/organizer/dashboard', '/organizer/claim'],

  /** Routes requiring admin role */
  admin: ['/admin'],

  /** Routes requiring verified organizer role */
  organizer: ['/organizer/dashboard'],
} as const;

/**
 * Where to redirect unauthenticated users.
 */
export const AUTH_REDIRECTS = {
  unauthenticated: '/auth/login',
  unauthorized: '/',
} as const;
