# Happenlist — Design System Reference (Visual Overhaul v2)

> Append this to the project's claude.md or ARCHITECTURE.md after running the visual overhaul prompts.
> This documents the design decisions and conventions introduced by the redesign.

## Design Philosophy

Happenlist is a curated local events directory for Milwaukee. The design should feel like a **vibrant city magazine** — editorial, warm, with personality. Not a database. Not a generic Tailwind template. Every visual choice should make Milwaukee feel alive with cool stuff happening.

Core principles:
- **Category colors create identity** — each event type is visually distinct
- **Day + time over calendar date** — people plan around their schedule
- **Variable visual hierarchy** — bento grids, mixed card sizes, big numbers
- **Texture over flatness** — topographic patterns, layered shadows, depth
- **Fraunces goes BIG** — the display font only works at large sizes

## Color System

### Base Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `midnight` | #1a1a2e | Dark footer, dark accents |
| `charcoal` | #2D2A26 | Primary text, headlines |
| `cream` | #FAF7F2 | Page backgrounds |
| `warm-white` | #FFFDF9 | Card backgrounds |
| `sand` | #E8E0D5 | Borders, dividers |
| `stone` | #9C9487 | Secondary text |
| `coral` | #E07A5F | Primary accent, CTAs, hearts |
| `sage` | #87A878 | "Free" badges, success states |

### Category Identity Colors
| Category | Slug | Color | Usage |
|----------|------|-------|-------|
| Music | `music` | #7C3AED (purple) | Card top border, badge bg |
| Arts & Culture | `arts` | #0D9488 (teal) | Card top border, badge bg |
| Food & Drink | `food` | #EA580C (orange) | Card top border, badge bg |
| Family | `family` | #F59E0B (amber) | Card top border, badge bg |
| Sports & Fitness | `sports` | #3B82F6 (blue) | Card top border, badge bg |
| Community | `community` | #E07A5F (coral) | Card top border, badge bg |
| Nightlife | `nightlife` | #6366F1 (indigo) | Card top border, badge bg |
| Classes | `classes` | #059669 (emerald) | Card top border, badge bg |
| Festivals | `festivals` | #BE185D (pink) | Card top border, badge bg |
| Workshops | `workshops` | #8B5CF6 (violet) | Card top border, badge bg |
| Default | — | #E07A5F (coral) | Fallback for unknown categories |

The color map lives at `src/lib/constants/category-colors.ts`. Use `getCategoryColor(slug)` to get the full color object `{ bg, text, accent, light }`.

## Typography
- **Display/Headlines:** Fraunces (variable, serif). Use BOLD and BIG — hero at 4-5rem, section headers at 2-2.5rem. The font's personality only emerges at large sizes.
- **Body:** Inter (sans-serif). Clean, readable, stays out of the way.
- **Stats/Numbers:** Fraunces with `font-variant-numeric: tabular-nums` at `text-stat` (3.5rem) for big display numbers.

## Card Design

### EventCard
- 3px top border in category accent color
- Category badge: opaque pill in category bg color, white text, top-left of image
- Date format: "Sat · 7pm" (day-of-week + time). Today/Tomorrow for near events. Month + day for distant events.
- Layered shadow: `shadow-card` default, `shadow-card-lifted` on hover with `-translate-y-1.5`
- "Free" price: sage-colored pill badge

### SeriesCard
- Type badge in bold color (Camp = amber, Class = emerald, etc.)
- Schedule info: "Wednesdays · 4-5pm"
- Age range displayed prominently: "Ages 6-12"
- Attendance mode pill: "Drop-in" vs "Registration Required"

## Layout Patterns

### Bento Grid (Homepage Featured)
CSS Grid with first item spanning 2 columns and 2 rows. Creates visual hierarchy — one "hero pick" card + standard supporting cards. Use `variant="bento"` on EventGrid.

### Color-Blocked Category Cards
Each category card has full background in the category's light tint, bold left border in accent color, larger icon in accent color. Not the old tiny-circles-in-a-grid pattern.

## Signature Visual Element
**Topographic contour line pattern** — applied via `.bg-topo` CSS class. Subtle organic texture on section backgrounds (hero, CTA). Happenlist's visual fingerprint.

## Behavioral Design Notes
The primary user ("Jamie") is in browse mode — low effort, high openness. They want to be SURPRISED by something cool. Design decisions support this:
- **Category colors** reduce cognitive load through pattern matching (purple = music)
- **Bento layout** triggers gallery browsing mode (exploratory) vs. grid processing (systematic)
- **Big stat number** on homepage creates credibility ("127 events this week" = vibrant city)
- **Day + time format** serves the planning brain without mental math
- **Variable visual hierarchy** creates the dopamine of variable reward — each scroll reveals something visually different
