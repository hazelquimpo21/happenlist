/**
 * =============================================================================
 * event-detail.ts — helpers for /event/[slug]
 * =============================================================================
 *
 * Pulled out of page.tsx so the page file is composition, not string
 * manipulation. Pure functions — no side effects, no component imports.
 *
 * Functions:
 *   - getTimingBadge(startDatetime)          → urgency sticker label
 *   - formatPriceSummary(event)              → "FREE" / "$15" / "$15–25" / null
 *   - formatAgeSummary(event)                → "21+" / "All ages" / null
 *   - buildGoogleCalendarUrl(event)          → add-to-calendar URL
 *   - isPastEvent(instanceDate)              → true if date is past today
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// Timing badge — drives the sticker on the hero image
// -----------------------------------------------------------------------------
// Returns null for events that aren't soon-enough to warrant a timing callout.
// Colors intentionally NOT encoded here (the previous implementation leaked
// generic rose/amber/violet tailwind classes that broke the token system).

export interface TimingBadge {
  label: string;
}

export function getTimingBadge(startDatetime: string): TimingBadge | null {
  const now = new Date();
  const start = new Date(startDatetime);
  const diffMs = start.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours <= 0 && diffHours > -12) return { label: 'Happening Now' };
  if (diffHours > 0 && diffHours <= 6) return { label: 'Starting Soon' };
  if (start.toDateString() === now.toDateString()) return { label: 'Today' };

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (start.toDateString() === tomorrow.toDateString()) return { label: 'Tomorrow' };

  if (diffDays > 0 && diffDays <= 6) {
    const startDay = start.getDay();
    if (startDay === 0 || startDay === 6) return { label: 'This Weekend' };
  }
  return null;
}

// -----------------------------------------------------------------------------
// Price summary — short string for the stamped row + ticket stub meta.
// -----------------------------------------------------------------------------

interface PriceShape {
  is_free?: boolean | null;
  price_low?: number | null;
  price_high?: number | null;
}

export function formatPriceSummary(event: PriceShape): string | null {
  if (event.is_free) return 'FREE';
  if (
    event.price_low != null &&
    event.price_high != null &&
    event.price_low !== event.price_high
  ) {
    return `$${event.price_low}–$${event.price_high}`;
  }
  if (event.price_low != null) return `$${event.price_low}`;
  if (event.price_high != null) return `$${event.price_high}`;
  return null;
}

// -----------------------------------------------------------------------------
// Age summary — for the stamped row only. Falls back to age_restriction
// (custom text like "18+") or "Family Friendly" when no numeric range set.
// -----------------------------------------------------------------------------

interface AgeShape {
  age_low?: number | null;
  age_high?: number | null;
  age_restriction?: string | null;
  is_family_friendly?: boolean | null;
}

export function formatAgeSummary(event: AgeShape): string | null {
  if (event.age_low != null && event.age_high != null && event.age_low !== event.age_high) {
    return `${event.age_low}–${event.age_high}`;
  }
  if (event.age_low != null) return `${event.age_low}+`;
  if (event.age_restriction) return event.age_restriction;
  if (event.is_family_friendly) return 'Family Friendly';
  return null;
}

// -----------------------------------------------------------------------------
// isPastEvent — one-line helper so page.tsx doesn't do inline Date math.
// -----------------------------------------------------------------------------
// Uses instance_date (YYYY-MM-DD) padded to end-of-day so events are
// considered "past" only after their instance day has fully elapsed.

export function isPastEvent(instanceDate: string): boolean {
  return new Date(instanceDate + 'T23:59:59') < new Date();
}

// -----------------------------------------------------------------------------
// Google Calendar "Add to Calendar" URL builder
// -----------------------------------------------------------------------------
// Produces a web URL the user can click to add the event to their own
// calendar. The URL template is Google's standard /calendar/render?action=TEMPLATE.

interface CalendarShape {
  title: string;
  start_datetime: string;
  end_datetime?: string | null;
  is_all_day?: boolean;
  short_description?: string | null;
  location?: { name: string; address_line?: string | null; city?: string | null } | null;
}

export function buildGoogleCalendarUrl(event: CalendarShape): string {
  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', event.title);
  if (event.short_description) params.set('details', event.short_description);
  if (event.location) {
    const loc = [event.location.name, event.location.address_line, event.location.city]
      .filter(Boolean)
      .join(', ');
    params.set('location', loc);
  }

  const formatGCal = (iso: string) =>
    iso.replace(/[-:]/g, '').replace(/\.\d+/, '').slice(0, 15) + 'Z';

  if (event.is_all_day) {
    const dateOnly = event.start_datetime.slice(0, 10).replace(/-/g, '');
    params.set('dates', `${dateOnly}/${dateOnly}`);
  } else {
    const start = formatGCal(new Date(event.start_datetime).toISOString());
    const end = event.end_datetime
      ? formatGCal(new Date(event.end_datetime).toISOString())
      : formatGCal(
          new Date(new Date(event.start_datetime).getTime() + 2 * 60 * 60 * 1000).toISOString(),
        );
    params.set('dates', `${start}/${end}`);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
