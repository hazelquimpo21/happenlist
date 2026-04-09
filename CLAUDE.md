# Happenlist — Design System Reference (v3)

## Design Philosophy

Happenlist is a curated local events directory for Milwaukee. The design feels like a **vibrant city festival poster** — bold, multi-chromatic, human-centered. Not a database. Not a generic Tailwind template.

Core principles:
- **Category colors create identity** — each event type is visually distinct via unique color
- **Day + time over calendar date** — people plan around their schedule ("Sat · 7pm")
- **Browse-first UX** — Jamie (primary user) is in discovery mode, low effort, high openness
- **Mobile-first** — horizontal scroll cards on mobile, grids on desktop
- **Sans-serif only** — Plus Jakarta Sans everywhere, no serif fonts

## Color System

### Neutral Scale
| Token | Hex | Usage |
|-------|-----|-------|
| `ink` | #020203 | Primary text, headlines |
| `night` | #141416 | Dark backgrounds (hero, weekend section) |
| `slate` | #27272A | Heavy text |
| `zinc` | #71717A | Secondary text, metadata |
| `silver` | #A1A1AA | Disabled, placeholder |
| `mist` | #E4E4E7 | Borders, dividers |
| `cloud` | #F4F4F5 | Subtle backgrounds |
| `ice` | #e0f0f5 | Cool tint backgrounds |
| `white` | #FAFAFA | Page background |
| `pure` | #FFFFFF | Card backgrounds |

### Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `blue` | #008bd2 | Primary brand, CTAs, links, selected states |
| `orange` | #d95927 | Secondary accent |

### Category Identity Colors (15 unique)
| Category | Slug | Hex |
|----------|------|-----|
| Music | `music` | #008bd2 |
| Arts & Culture | `arts` | #008e91 |
| Food & Drink | `food` | #d95927 |
| Family | `family` | #e7b746 |
| Sports | `sports` | #E85D45 |
| Community | `community` | #D94B7A |
| Nightlife | `nightlife` | #7B2D8E |
| Classes | `classes` | #009768 |
| Festivals | `festivals` | #d48700 |
| Workshops | `workshops` | #5B4FC4 |
| Markets | `markets` | #ace671 |
| Talks | `talks` | #008bd2 |
| Outdoors | `outdoors` | #6BAD5A |
| Charity | `charity` | #D94B7A |
| Holiday | `holiday` | #e7b746 |

Color map: `src/lib/constants/category-colors.ts` — use `getCategoryColor(slug)` → `{ bg, text, accent, light }`.

### Semantic Colors
- **Selection states**: `border-blue bg-blue/10 text-blue` (forms, toggles, pills)
- **Hearts**: `text-rose` when hearted, `text-zinc` when not
- **Free badges**: `bg-emerald-light text-emerald`
- **Overlays/modals**: `bg-ink/50` backdrop
- **Hover links**: `text-blue hover:text-blue-dark`

## Typography
- **Font**: Plus Jakarta Sans (via `next/font/google`), one family for everything
- **Body class**: `font-body` — resolves to Plus Jakarta Sans
- **Type scale**: `text-hero` (4.5rem), `text-display` (3rem), `text-h1`–`text-h4`, `text-body`, `text-body-sm`, `text-caption`

## Homepage Flow (User Story)
Jamie opens Happenlist on a Thursday evening. She doesn't know what she wants — she just wants to discover something cool.

1. **Hero** — full-bleed image slideshow with crossfade, time-aware greeting ("Good evening, Milwaukee"), filter pills
2. **Editor's Picks** — 3 featured event cards (desktop grid, mobile horizontal scroll)
3. **Events by Category** — top 3 categories with real event cards, alternating white/cloud backgrounds
4. **This Weekend** — dark `bg-ink` section, horizontal scroll compact cards
5. **Just Added** — numbered list rows (01, 02, 03...) with category dots
6. **CTA** — brand blue block ("Find your next experience")

## Card Design

### EventCard (`src/components/events/event-card.tsx`)
- No top border — clean edge, shadow-card only
- Category badge: opaque pill on image (top-left), category bg color
- Date: `text-blue font-semibold` — "Today · 7pm", "Sat · 7pm", "Apr 12 · 7pm"
- Shadow: `shadow-card` → `shadow-card-lifted` + `-translate-y-1` on hover
- Free badge: `bg-emerald-light text-emerald`
- Parent badge: child count label in category accent @ 15% opacity

### CompactEventCard (homepage inline)
- Narrower (w-64), 3:2 aspect image, time badge overlay, category pill below image
- Dark variant for "This Weekend" section: `bg-night border-pure/5`

## Custom Icons
`src/components/icons/category-icons.tsx` — 15 bold geometric SVGs, `currentColor`, 24x24 viewBox.
Use `getCategoryIcon(iconName)` to get the component.

## Parent Events
Events support one level of parent-child nesting (festivals → acts, theatrical runs → performances).

- `getChildEvents`, `getParentEventInfo`, `getChildEventCount` in data layer
- Main feeds filter `WHERE parent_event_id IS NULL` to hide children
- **ChildEventsSchedule**: date-grouped program view with filter pills, today indicator, auto-scroll
- Parent detail: shows schedule below description
- Child detail: shows parent breadcrumb + sibling events

## Key Conventions
- Tailwind tokens defined in `tailwind.config.ts` — neutrals, brand, category, legacy aliases
- CSS custom properties in `globals.css` for all color tokens
- `container-page` utility for consistent max-width + padding
- Legacy color aliases exist (`coral`, `charcoal`, `sand`, etc.) but prefer new tokens (`blue`, `ink`, `mist`)
- Selection/active states use `blue` (not coral)
- Heart icon uses `rose` color
- Modal/overlay backdrops use `bg-ink/50`
