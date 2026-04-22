# Handoff: Happenlist Filtering System — Direction B1

## Overview

This is the selected design direction (**B1 · Segmented Picker + Tabbed Discovery**) for redesigning Happenlist's event filtering system. It replaces the existing five-row stacked filter layout with a single horizontal segmented picker at the top of the home page, and introduces a tabbed "Popular / New / This weekend" discovery panel to the right of the hero featured event.

The design ships two primary surfaces:
1. **Home** (the landing/discovery page) — hero with segmented picker as the primary filter entry point
2. **Events archive** (the filtered results view) — same segmented picker, inline, as a slim refine bar

This folder contains the final B1 direction. Other explored directions (A · Smart Summary Bar, C · Smart Search + Drawer, and B variants B2/B3) are present in the source HTML for reference but are **not** the selected direction.

## About the Design Files

The files in this bundle are **design references created in HTML** — interactive React prototypes (Babel-compiled JSX, no build step) showing intended look and behavior. **They are not production code to copy directly.**

Your task is to **recreate these HTML designs in the target codebase's existing environment** (likely a Next.js / Rails / Laravel app with its own component library) using its established patterns, routing, styling approach, and state management. If no environment exists yet, pick the most appropriate framework for the project and implement there.

In particular:
- Do not copy the inline `style={{ ... }}` objects verbatim — translate them into the codebase's styling system (CSS modules, Tailwind, styled-components, etc.).
- Do not copy the React 18 UMD + Babel-standalone script tags — those are for the prototype only.
- Do treat the colors, typography, spacing, component shapes, and interactions as the spec to match.

## Fidelity

**High-fidelity.** Exact colors, typography, sizing, spacing, and component shapes are specified below and reflected in the prototype. Match them pixel-to-pixel in the target codebase using its existing libraries.

Interactions (popover open/close, selection state, mood tile selection, tab switching) are implemented in the prototype but use local `useState`. You'll need to wire these up to real URL state / data fetching in the target app.

---

## Screens / Views

### 1. Home — Desktop (`VarB_Home_v2` in `variation-b-refined.jsx`)

**Purpose:** Primary landing page. User arrives, sees time-aware greeting, and uses the segmented picker to declare what they're in the mood for tonight/this weekend.

**Layout:**
- Full-width page, background `#f5f4f0` (HL.white — a warm paper tone, NOT pure white)
- Site header (existing, see `shared.jsx → SiteHeader`)
- Hero section — full-width band, background `#e0f0f5` (HL.ice), padding `48px 32px 40px`, centered content max-width `1100px`
  - Eyebrow: "HAPPENING IN MILWAUKEE" — 13px / 600 weight / letter-spacing 0.08em / uppercase / color `#008e91` (HL.teal)
  - H1: "What are you in the mood for?" — 56px / 800 weight / letter-spacing -0.03em / color `#020203` (HL.ink) / line-height 1
  - Subtitle: "557 events on right now. Pick a mood — we'll do the rest." — 16px / `#71717A` (HL.zinc) / max-width 520px centered
  - **Segmented picker** (see component spec below) — centered, `margin-top: 30px`
- Main content — max-width `1280px`, centered, padding `40px 32px`
  - Row 1 (flex, gap 20px): `HeroFeaturedCard` (flex 1, min-height 360px) + `TabbedDiscovery` (flex 0 0 360px)
  - Section heading "Browse by category" — 24px / 800 / ink / margin `36px 0 16px`
  - `CategoryStrip` (existing component from `home-views.jsx`)

### 2. Events Archive — Desktop

**Purpose:** Filtered results view. Same segmented picker shape, but inline in a slim refine bar at the top of the page (no hero). Reuse the existing `VarB_Desktop` from `variation-b.jsx` — it already implements this pattern.

**Layout:**
- Site header
- Slim filter bar — `background: #FFFFFF`, `border-bottom: 1px solid #E4E4E7`, padding `20px 32px`
  - Search input (pill, `#F4F4F5` background, 240px fixed width)
  - Segmented picker pill (flex 1, see spec below)
  - "More" button (pill, white, bordered)
  - Popover opens below on segment click
- Results grid — max-width 1100px, 3-column card grid

### 3. Mobile — Home and Archive

Not drawn yet for B1 specifically — use `VarB_Home_Mobile` (home-views.jsx) and `VarB_Mobile` (variation-b.jsx) as references. The segmented picker collapses to a 2×2 grid of tiles on mobile; each tile opens a bottom sheet popover.

---

## Components

### Segmented Picker (the core component)

A rounded pill containing 4 segments separated by thin dividers, plus a CTA button.

**Container:**
- `display: inline-flex` (desktop hero) or full-width flex (archive)
- `background: #FFFFFF`
- `border: 1px solid #E4E4E7`
- `border-radius: 999px`
- `padding: 6px`
- `box-shadow: 0 10px 40px rgba(2,2,3,0.10)` (hero use only; archive omits the shadow)

**Segment (button):**
- `padding: 10px 22px`
- `background: transparent` (or `#F4F4F5` when the popover for this segment is open)
- `border: 0`, `border-radius: 999px`
- Two lines stacked:
  - Label line: 11px / 700 weight / letter-spacing 0.06em / uppercase / color `#71717A` (zinc), with a leading 14px icon (colored if the segment has a value using an accent color, else zinc)
  - Value line: 14px, 700 weight + ink color if a value is selected, OR 500 weight + zinc color if showing the placeholder ("Any category", "Anytime", etc.). Leading 8px color dot if segment has an accent color (e.g. category color for Category, `#008bd2` HL.blue for "Tonight", `#009768` HL.emerald for "Free")

**Dividers between segments:**
- `width: 1px`
- `background: #E4E4E7`
- `margin: 10px 0` (inset top/bottom so they don't touch the container edges)

**CTA button (rightmost, inside the pill):**
- `padding: 0 24px`
- `background: #008bd2` (HL.blue)
- `color: #FFFFFF`
- `border-radius: 999px`
- `font-size: 14px`, `font-weight: 700`
- Content: magnifying-glass icon + "Find events" label (or "Show N" with a count on the archive)

**Segments in order:**
1. **Category** — icon: tag. Value: comma-separated list of selected categories, or "Any category". Accent color = the first selected category's color.
2. **When** — icon: clock. Value: "Tonight" / "This weekend" / date range / "Anytime". Accent: `#008bd2` (HL.blue) when set to "Tonight".
3. **Good for** — icon: sparkles. Value: comma-separated list of audiences ("Date night", "With kids"), or "Anything". No accent.
4. **Budget** — icon: wallet. Value: "Free" / "Under $10" / "Under $25" / "$25+" / "Any price". Accent: `#009768` (HL.emerald) when "Free".

### Popovers (per-segment pickers)

Each segment opens a popover below the picker on click. Shape: rounded card, `border-radius: 24px`, `padding: 24px`, `background: #FFFFFF`, `border: 1px solid #E4E4E7`, `box-shadow: 0 20px 50px rgba(2,2,3,0.14), 0 2px 8px rgba(2,2,3,0.06)`. Content differs per segment:

- **Category popover** — multi-select chip list of all 15 categories. Chip: pill with a leading color dot + category name + count. On state: fills with the category's own color, white text, white dot.
- **When popover** — 2-column grid: left "Quick picks" (Today, Tomorrow, This weekend, Next 7 days, Next 30 days, Pick dates) as 2×3 rectangle buttons; right "Time of day" chips (Morning, Afternoon, Evening, Late night) + a small info card showing the current interpreted date range (e.g. "Sat Apr 25 – Sun Apr 26").
- **Good for popover** — single row of pills for the 10 audiences. Single- or multi-select (multi in prototype).
- **Budget popover** — 4 large square tiles for Free / Under $10 / Under $25 / $25+. Selected: inverted to ink (or emerald for Free).

See `variation-b.jsx → Popover` for the exact shapes and selection logic.

### Hero Featured Card (`HeroFeaturedCard`, `big` variant)

- `flex: 1`, `min-height: 360px` (big) / `280px` (regular)
- `border-radius: 20px`, `padding: 24px`
- Background: placeholder — in real use this is a full-bleed event hero image with a bottom-to-top dark gradient overlay (`linear-gradient(180deg, transparent 40%, rgba(2,2,3,0.88) 100%)`)
- Content stacks bottom-aligned in white text:
  - Category badge (pill, top-left, 4px/12px padding, category color bg, 10.5px/700 uppercase)
  - Eyebrow "TONIGHT · 8PM" (12.5px/600 uppercase/0.05em)
  - Title (40px big / 28px regular, 800 weight, -0.02em)
  - Meta line (14px, 85% opacity): "Pabst Theater · Free · 340 going"

### Tabbed Discovery Panel (`TabbedDiscovery` — replaces the old dotted list)

- `flex: 0 0 360px`, `background: #FFFFFF`, `border: 1px solid #E4E4E7`, `border-radius: 20px`, `padding: 20px`
- **Tab bar:** pill-shaped segmented control, `background: #F4F4F5`, `padding: 4px`, `border-radius: 999px`, 3 equal segments: "Popular" / "New" / "This weekend"
  - Tab: 12.5px / 700, `padding: 7px 8px`, `border-radius: 999px`
  - Active tab: `background: #FFFFFF`, `color: #020203`, `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`
  - Inactive tab: transparent background, `color: #71717A`
- **Item list:** 4 items per tab
  - Row: `padding: 8px 4px`, `border-bottom: 1px solid #E4E4E7` on all but the last
  - 56×56 rounded thumbnail on the left (`border-radius: 10px`, placeholder: a 45° striped pattern in the category color — use a real image when available)
  - Text column:
    - Category label: 10px / 700 / 0.06em / uppercase, colored with the category's color
    - Title: 14px / 700 / ink, single-line truncate
    - Meta: 11.5px / zinc — "Sat · 5pm · Free" or "Tonight · 8pm · 340 going" or "Added today"
- Footer link: "See all →" — 13px / 600 / HL.blue

**Tab content semantics:**
- **Popular** — trending events, ranked by "going"/"interested" counts
- **New** — recently added events, ranked by creation timestamp (show "Added 2h ago" / "Added today")
- **This weekend** — events occurring Saturday and Sunday of the current week

### Category Strip (`CategoryStrip`)

Existing component — horizontal strip of category tiles. Reuse as-is from `home-views.jsx`.

### Site Header (`SiteHeader`)

Existing component — reuse as-is. Navigation items: Events, Classes & Series, Today, This Weekend, Performers, Venues.

---

## Interactions & Behavior

- **Clicking a segment** opens its popover directly below the picker pill. Only one popover open at a time. Click the same segment again, or click outside (not implemented in prototype but should be in production), to close.
- **Selecting values** updates the segment's value line live. Multi-select segments (Category, Good for) accumulate selections. Single-select segments (When, Budget) replace.
- **CTA button** — "Find events" on home routes to `/events` with selected filters encoded in the URL query string. "Show N" on archive triggers re-query; N is the live count of matching events.
- **Tabbed panel** — tab switch is instant (no animation in prototype; a 150ms crossfade would be appropriate). Each tab's list should be fetched server-side on page load or lazily on first tab activation.
- **Segmented picker on mobile** — collapses to a 2×2 grid. Tapping a tile opens a full-height bottom sheet with the same popover content.

## State Management

Filter state shape (reuse across home and archive):
```
{
  category: string[],            // e.g. ['Music', 'Food & Drink']
  when: string | DateRange,      // e.g. 'This weekend' or { from, to }
  goodFor: string[],             // e.g. ['Date night']
  budget: string | null,         // e.g. 'Free'
  timeOfDay: string[] | null,    // e.g. ['Evening'] — inside When popover
  search: string,
}
```
Persist to URL query params so filters are shareable/bookmarkable. On archive, changes re-fetch the results grid; the result count on the CTA updates live.

---

## Design Tokens

### Colors (from `DESIGN-GUIDE.md`, codified in `shared.jsx → HL`)

**Brand / accent:**
- `blue`: `#008bd2` — primary CTA, "Tonight" accent
- `blueLight`: `#33a2db`
- `teal`: `#008e91` — eyebrow/section accents
- `emerald`: `#009768` — "Free" accent

**Category colors (used in chips, thumbnails, tabbed-panel labels):**
- Music: `#008bd2`
- Arts & Culture: `#008e91`
- Family: `#e7b746`
- Food & Drink: `#d95927`
- Sports & Fitness: `#E85D45`
- Nightlife: `#7B2D8E`
- Community: `#D94B7A`
- Classes & Workshops: `#009768`
- Festivals: `#d48700`
- Theater & Film: `#5B4FC4`
- Markets & Shopping: `#ace671`
- Talks & Lectures: `#008bd2`
- Outdoors & Nature: `#6BAD5A`
- Charity & Fundraising: `#D94B7A`
- Holiday & Seasonal: `#e7b746`

**Neutrals:**
- `ink`: `#020203` — primary text
- `night`: `#141416`
- `slate`: `#2A2A2E`
- `zinc`: `#71717A` — secondary text, labels
- `silver`: `#D1D1D6`
- `mist`: `#E4E4E7` — borders
- `cloud`: `#F4F4F5` — quiet backgrounds (tab bar, search pill)
- `ice`: `#e0f0f5` — hero background
- `white`: `#f5f4f0` — page background (warm paper, NOT pure white)
- `pure`: `#FFFFFF` — cards

### Typography

- Family: **Plus Jakarta Sans** (Google Fonts) — weights 400, 500, 600, 700, 800
- Hero H1: 56px / 800 / -0.03em / line-height 1
- Page H1 (archive): 40px / 800 / -0.02em
- Section H2: 24–26px / 800
- Body: 14–16px / 400–500 / zinc or ink
- Label/eyebrow: 10.5–13px / 700 / uppercase / letter-spacing 0.06–0.08em
- Picker value: 14px / 700 (when set) or 500 (placeholder)

### Spacing

- Hero padding: `48px 32px 40px`
- Page content padding: `40px 32px`
- Picker segment padding: `10px 22px`
- Picker container padding: `6px` (inner gutter around segments)
- Card padding: `20–24px`
- Gap between hero card and tabbed panel: `20px`

### Radii

- Pill / picker / tab control: `999px`
- Cards / popovers / hero card: `20–24px`
- Thumbnails / small tiles: `10–16px`
- Buttons inside popovers: `12–16px`

### Shadows

- Picker hero: `0 10px 40px rgba(2,2,3,0.10)`
- Popover: `0 20px 50px rgba(2,2,3,0.14), 0 2px 8px rgba(2,2,3,0.06)`
- Active tab in tabbed panel: `0 1px 3px rgba(0,0,0,0.08)`

---

## Assets

No raster assets in the prototype — all imagery is represented by 45° striped gradients colored by category. Real event hero images should replace:
- `HeroFeaturedCard` background
- `TabbedDiscovery` row thumbnails
- Category tile images in `CategoryStrip`

Icons are inline SVG defined in `shared.jsx` (line style, 1.8px stroke, Lucide-ish). Reuse the codebase's icon library if one exists — match stroke weight and sizing.

---

## Files in this bundle

- `Happenlist Filters.html` — entry point. Loads all JSX via Babel-standalone. Open in a browser to see all 3 directions on the design canvas. **B1 is the first artboard in the "B · Refined" section.**
- `variation-b-refined.jsx` — **the B1 direction.** Contains `VarB_Home_v2` (the Home view) and `TabbedDiscovery` (the Popular/New/This weekend panel).
- `variation-b.jsx` — the archive view (`VarB_Desktop`), the segmented picker implementation, and all popovers (`Popover`). Reuse these verbatim as spec.
- `home-views.jsx` — `HeroFeaturedCard`, `CategoryStrip`, and other shared home primitives.
- `shared.jsx` — design tokens (`HL`), `CATEGORIES` / `GOOD_FOR` / `TIMES` / `BUDGETS` data, all icons, and `SiteHeader`. **Port these tokens first.**
- `design-canvas.jsx` — the design-canvas harness used to present the options side-by-side in the prototype. Not needed in production.
- `variation-a.jsx`, `variation-c.jsx` — alternate directions explored but not selected. Reference only.

---

## Implementation order (suggested)

1. Port the `HL` color tokens, `CATEGORIES` data, and typography settings into the codebase's design system.
2. Build the segmented picker as a standalone component with 4 segment slots and a CTA — no popovers yet. Wire it to URL state.
3. Build one popover (Category) — verify the multi-select chip pattern against existing components.
4. Build the remaining 3 popovers (When, Good for, Budget).
5. Build `TabbedDiscovery` as a standalone panel fed by 3 server queries.
6. Compose the Home page: hero band + picker + (HeroFeaturedCard + TabbedDiscovery) row + CategoryStrip.
7. Compose the Archive page: slim picker bar + results grid.
8. Mobile: collapse the picker to a 2×2 grid + bottom sheets.
