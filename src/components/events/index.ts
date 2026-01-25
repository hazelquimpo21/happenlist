/**
 * EVENTS COMPONENTS INDEX
 * =======================
 * Central export for event-related components.
 *
 * 📦 COMPONENTS:
 *   - EventCard: Primary card for grids (uses EventImage internally)
 *   - EventImage: Smart image with fallback (can be used standalone)
 *   - EventGrid: Responsive grid layout
 *   - EventPrice: Price display with formatting
 *   - EventDate: Date/time display with formatting (for cards)
 *   - EventDateTime: Enhanced date/time display (for detail pages)
 *   - EventLinks: External links (website, social, tickets)
 *   - SectionHeader: Section title with optional "See all" link
 *   - FlyerLightbox: Fullscreen flyer viewer
 */

export { EventCard } from './event-card';
export { EventImage } from './event-image';
export { EventGrid } from './event-grid';
export { EventPrice } from './event-price';
export { EventDate } from './event-date';
export { EventDateTime, formatTimeRange } from './event-date-time';
export { EventLinks, EventLink } from './event-links';
export { SectionHeader } from './section-header';
export { FlyerLightbox } from './flyer-lightbox';