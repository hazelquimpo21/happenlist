/**
 * FIELD HEURISTICS
 * ================
 * Client-safe heuristic checks that flag suspicious scraped fields. Admin UI
 * renders a small "needs verification" pill next to fields that trip a check.
 *
 * This is the v1 "scraper confidence" surface. The scraper doesn't yet emit
 * per-field confidence on /analyze/text or /analyze/url (only overall), so we
 * do pattern-based heuristics here. Swap to real confidence when the scraper
 * ships it.
 *
 * DESIGN NOTES:
 *  - All rules are conservative: prefer false negatives over false positives.
 *    Flagging every event annoys reviewers fast.
 *  - Rules return { reason, severity } or null. Severity drives pill color:
 *    'low' = informational, 'high' = probably wrong.
 *  - This file is pure-function + no I/O → safe in both client and server
 *    components.
 *
 * WHAT TO ADD NEXT:
 *  - A `description` check (too short, all-caps).
 *  - Cross-field checks (e.g. category=music but vibe_tags has nothing musical).
 *  - Real per-field confidence from scraper.scraped_data once available.
 *
 * @module lib/admin/field-heuristics
 */

// ============================================================================
// TYPES
// ============================================================================

export type HeuristicSeverity = 'low' | 'high';

export interface HeuristicFlag {
  severity: HeuristicSeverity;
  reason: string;
}

/**
 * Minimal event shape the heuristics operate on. We read what's present and
 * ignore what isn't — callers can pass AdminEventDetails or a lighter row
 * without type gymnastics.
 */
export interface HeuristicEvent {
  title?: string | null;
  short_description?: string | null;
  description?: string | null;
  category_id?: string | null;
  category_slug?: string | null;
  organizer_name?: string | null;
  organizer_is_venue?: boolean | null;
  price_type?: string | null;
  price_low?: number | null;
  price_high?: number | null;
  ticket_url?: string | null;
  image_url?: string | null;
  image_ai_generated?: boolean | null;
  start_datetime?: string | null;
  location?: { name?: string | null } | null;
}

// Supported field keys. Use a union so callers get autocomplete + compile-time
// check against typos. Adding a field = add it here + add the rule below.
export type HeuristicField =
  | 'title'
  | 'short_description'
  | 'category'
  | 'organizer'
  | 'price'
  | 'image';

// ============================================================================
// RULE HELPERS
// ============================================================================

/**
 * Relative-time words that shouldn't appear in stored content — they rot fast.
 * Matches the scraper's own RELATIVE_TIME_BAN_RULE (writing-voice.js).
 */
const RELATIVE_TIME_WORDS = [
  'tonight', 'tomorrow', 'yesterday', 'today',
  'this weekend', 'this week', 'next week', 'last week',
  'next month', 'last month',
];

function hasRelativeTime(s: string): boolean {
  const lower = s.toLowerCase();
  return RELATIVE_TIME_WORDS.some(w => lower.includes(w));
}

function isAllCaps(s: string): boolean {
  const letters = s.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 6) return false;
  return letters === letters.toUpperCase();
}

function normalize(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

// ============================================================================
// PER-FIELD RULES
// ============================================================================

function checkTitle(ev: HeuristicEvent): HeuristicFlag | null {
  const title = (ev.title ?? '').trim();
  if (!title) return { severity: 'high', reason: 'Title is missing.' };
  if (title.length < 4) return { severity: 'high', reason: 'Title is very short — may be truncated.' };
  if (title.length > 120) return { severity: 'low', reason: 'Title is unusually long (>120 chars).' };
  if (isAllCaps(title)) return { severity: 'low', reason: 'Title is ALL CAPS — scraper should have title-cased it.' };
  if (hasRelativeTime(title)) return { severity: 'high', reason: 'Title contains relative time ("tonight", etc.).' };
  return null;
}

function checkShortDescription(ev: HeuristicEvent): HeuristicFlag | null {
  const sd = (ev.short_description ?? '').trim();
  if (!sd) return { severity: 'low', reason: 'Short description is empty — card teaser will fall back.' };
  if (sd.length < 20) return { severity: 'low', reason: 'Short description is very terse (<20 chars).' };
  if (hasRelativeTime(sd)) return { severity: 'high', reason: 'Contains relative time ("tonight", etc.) — will rot.' };
  return null;
}

function checkCategory(ev: HeuristicEvent): HeuristicFlag | null {
  if (!ev.category_id && !ev.category_slug) {
    return { severity: 'high', reason: 'No category assigned — event won\'t show up in category browse.' };
  }
  return null;
}

function checkOrganizer(ev: HeuristicEvent): HeuristicFlag | null {
  const org = normalize(ev.organizer_name);
  const venue = normalize(ev.location?.name);
  if (!org) return null;
  // If organizer name matches venue name but organizer_is_venue is false,
  // the scraper probably misclassified — "Fiserv Forum" shouldn't be the
  // organizer of a touring act booked into the room.
  if (org && venue && org === venue && ev.organizer_is_venue !== true) {
    return {
      severity: 'high',
      reason: 'Organizer name matches venue name — did you mean organizer_is_venue=true, or is the organizer unknown?',
    };
  }
  return null;
}

function checkPrice(ev: HeuristicEvent): HeuristicFlag | null {
  const type = ev.price_type ?? 'free';
  // Non-free but no price_low set — common scraper miss.
  if (type !== 'free' && type !== 'varies' && type !== 'donation' && ev.price_low == null) {
    return { severity: 'high', reason: `price_type="${type}" but price_low is empty.` };
  }
  // Has ticket_url but type is free — legitimate sometimes (RSVP via
  // Eventbrite for a free event) but worth a second look.
  if (type === 'free' && ev.ticket_url) {
    return { severity: 'low', reason: 'Marked free but has a ticket URL — verify there are no hidden fees.' };
  }
  // price_high < price_low is nonsense.
  if (ev.price_low != null && ev.price_high != null && ev.price_high < ev.price_low) {
    return { severity: 'high', reason: 'price_high is less than price_low — swap them.' };
  }
  return null;
}

function checkImage(ev: HeuristicEvent): HeuristicFlag | null {
  if (!ev.image_url) {
    return { severity: 'low', reason: 'No hero image — card will use a placeholder.' };
  }
  if (ev.image_ai_generated === true) {
    return { severity: 'low', reason: 'Image is AI-generated — swap in a real photo when available.' };
  }
  return null;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Run a single field's heuristic rule. Returns null when the field is fine.
 */
export function checkField(ev: HeuristicEvent, field: HeuristicField): HeuristicFlag | null {
  switch (field) {
    case 'title': return checkTitle(ev);
    case 'short_description': return checkShortDescription(ev);
    case 'category': return checkCategory(ev);
    case 'organizer': return checkOrganizer(ev);
    case 'price': return checkPrice(ev);
    case 'image': return checkImage(ev);
  }
}

/**
 * Run all rules and return the full { field → flag } map. Drops null entries
 * — only fields with issues appear. Useful for summary banners.
 */
export function checkAllFields(ev: HeuristicEvent): Partial<Record<HeuristicField, HeuristicFlag>> {
  const out: Partial<Record<HeuristicField, HeuristicFlag>> = {};
  const fields: HeuristicField[] = ['title', 'short_description', 'category', 'organizer', 'price', 'image'];
  for (const f of fields) {
    const flag = checkField(ev, f);
    if (flag) out[f] = flag;
  }
  return out;
}
