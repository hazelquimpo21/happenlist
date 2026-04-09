# Happenlist — Redesign Guide v3

> This replaces the previous design system. Everything here is a decision, not a suggestion.

---

## The One-Liner

Happenlist should feel like **the coolest person you know just texted you what's happening tonight.** Not a database. Not a search engine. Not a calendar. A friend with taste who always knows what's going on.

---

## What We're Killing

| Old Element | Why It Dies |
|---|---|
| Fraunces serif font | Reads "bookshop" not "city guide." Serif at display sizes feels precious, not bold |
| Cream backgrounds (#FDF8F3) | Yellowy and tired. Reads grandma's kitchen, not city energy |
| Coral as primary (#E07A5F) | Muted and safe. Doesn't command attention |
| Topographic circle texture | Decorative without meaning. Adds visual noise, not personality |
| Centered hero layout | Static, passive. Says "here's a search box" instead of "look at this" |
| Uniform card grid | Every card looks the same. No visual surprise, no hierarchy |
| Section → section → section linear flow | Predictable scroll. Magazine layouts break the pattern |
| Lucide generic icons | Stock-feeling. Replaced with custom bold geometric SVGs |

---

## Design Pillars (Reverse-Engineered from Inspo)

### 1. Contrast Creates Energy
**Seen in:** AIHub (dark bg + yellow/teal/pink blocks), Blue Grid (saturated blue + lime), Evenfonic (dark header + white body)

The inspo images all use **high contrast between sections** — dark slams into light, saturated color blocks sit next to neutral space. This creates visual rhythm and makes you FEEL the scroll.

**Rule:** Alternate between light and dark section backgrounds. Never stack two same-tone sections. Dark sections get bold color accents. Light sections stay clean.

### 2. The Grid Lies (In a Good Way)
**Seen in:** AIHub (5 different card types in one grid), Blue Grid (photo + stat + calendar + chat + text in a mosaic), Green App (list + calendar + map on same screen)

Every inspo image puts **different content types** in the same visual system. A stat card sits next to an image card sits next to a list.

**Rule:** The homepage bento grid should contain at least 3 different cell types (event card, stat block, quick-link list, category shortcut, editorial callout). Cards should NOT all be identical EventCards with different data.

### 3. Color Blocks > Color Accents  
**Seen in:** AIHub (full yellow card, full teal card, full pink card), Blue Grid (entire layout flooded with blue), Purple App (category badges + purple CTA fills)

The inspo uses color **as the card**, not as a 3px border on a white card. Color should be structural, not decorative.

**Rule:** Category colors are used at 15-20% opacity as card/section backgrounds, and at full strength for badges and interactive elements. At least one card in every grid should have a full-color background.

### 4. Typography IS the Design
**Seen in:** Blue Grid ("Ideas connect people" as a full card), AIHub (giant "Introducing Whisper"), Green App (personalized "Hello, Adom!")

The most striking moments in every inspo image are **words used architecturally** — not illustrating content, but BEING the design.

**Rule:** At least one cell in the homepage grid should be a text-only card with a stat or editorial headline at display size. Section headers should be bold enough to function as visual landmarks, not just labels.

### 5. Time-Awareness = Life
**Seen in:** Green App ("Hello, Adom" greeting), Evenfonic (time overlaid on event images), Purple App (Schedule tab with live timeline)

Every event app in the inspo makes you feel the **now**.

**Rule:** The homepage should acknowledge what time/day it is. Hero messaging changes based on time of day and day of week. "Tonight" and "This Weekend" get visual priority over generic "Featured."

### 6. Social Proof Through Faces
**Seen in:** Purple App (avatar rows below events, attendee counts), Green App (avatar stack + "2k+ Joined"), Evenfonic (avatar overlap clusters)

3 of 5 inspo images show **real people's faces** associated with events.

**Rule:** Where organizer images exist, show them on cards. Consider attendee-count or "interested" indicators. Faces > icons.

### 7. Search is Navigation, Not the Main Event
**Seen in:** All 5 images — search is present but secondary.

**Rule:** Search lives in the header/nav, always accessible. The hero sells a specific event or moment, not a search function.

---

## Color System v3

### Structural Neutrals

| Token | Hex | Role |
|---|---|---|
| `ink` | `#020203` | Dark section backgrounds, primary text on light |
| `night` | `#141416` | Dark card surfaces, footer |
| `slate` | `#2A2A2E` | Dark card hover, elevated dark surfaces |
| `zinc` | `#71717A` | Secondary text, metadata, muted elements |
| `silver` | `#D1D1D6` | Borders on dark backgrounds |
| `mist` | `#E4E4E7` | Borders on light backgrounds, dividers |
| `cloud` | `#F4F4F5` | Alternate light section background |
| `ice` | `#e0f0f5` | Cool-tinted surface — unique section bg, search bars |
| `white` | `#f5f4f0` | Page background (warm off-white) |
| `pure` | `#FFFFFF` | Card backgrounds, text on dark |

### Primary Brand Colors

| Token | Hex | Swatch | Role |
|---|---|---|---|
| `blue` | `#008bd2` | Bright blue | Primary interactive — buttons, links, active states, logo |
| `blue-light` | `#33a2db` | | Hover states, lighter UI on dark bg |
| `blue-muted` | `rgba(0,139,210,0.12)` | | Tinted backgrounds, selected states |
| `orange` | `#d95927` | Burnt orange | Secondary CTA, "hot" / urgent moments, Food |
| `orange-light` | `rgba(217,89,39,0.12)` | | Warm tinted backgrounds |

### Supporting Accents

| Token | Hex | Role |
|---|---|---|
| `golden` | `#e7b746` | Featured badges, highlights, "editor's pick" |
| `amber` | `#d48700` | Rich warm emphasis, premium moments |
| `teal` | `#008e91` | Arts, culture, depth |
| `lime` | `#ace671` | Playful pops, success-adjacent, the "surprise" color |
| `emerald` | `#009768` | Free badges, success, positive states |
| `plum` | `#7B2D8E` | Nightlife, after-dark, premium |
| `magenta` | `#D94B7A` | Community, warmth, human connection |
| `indigo` | `#5B4FC4` | Workshops, creative, intellectual |
| `vermillion` | `#E85D45` | Sports, competition, energy |
| `fern` | `#6BAD5A` | Outdoor events, nature |
| `rose` | `#F43F5E` | Hearts/saves, alerts, destructive actions |

### Why This Palette

This palette reads like a **city festival poster** — bold, multi-chromatic, but grounded. The colors all sit at similar saturation and energy levels so they feel like they came from the same box of paints. The warm off-white (`#f5f4f0`) and near-black (`#020203`) anchor everything.

- **Blue as primary:** Confident, civic, trustworthy — like good city wayfinding signage
- **Burnt orange as secondary:** Energy and warmth — the "go do something" color
- **Ice (#e0f0f5) as surface:** A unique move — cool-tinted sections instead of the generic gray. Gives the light sections character without competing with content
- **No single "accent" — many accents:** Milwaukee is colorful. The palette reflects that. Category colors aren't an afterthought — they're the personality.

### Category Identity Colors

Every category gets its own unique color. These are used for:
- Full-color category tile backgrounds
- Badge pill backgrounds on event cards
- Category dot indicators in list views
- Tinted card backgrounds at 12-15% opacity

| Category | Token | Hex | Icon | Why It Fits |
|---|---|---|---|---|
| Music | `blue` | `#008bd2` | `IconMusic` (equalizer bars) | Concert lights, rhythm, cool |
| Arts & Culture | `teal` | `#008e91` | `IconArts` (palette dots) | Gallery walls, sophistication |
| Food & Drink | `orange` | `#d95927` | `IconFood` (fork + knife) | Appetite, warmth, spice |
| Family | `golden` | `#e7b746` | `IconFamily` (figures) | Sunshine, Saturday morning |
| Sports & Fitness | `vermillion` | `#E85D45` | `IconSports` (lightning bolt) | Competition, adrenaline |
| Community | `magenta` | `#D94B7A` | `IconCommunity` (overlapping circles) | Human connection, togetherness |
| Nightlife | `plum` | `#7B2D8E` | `IconNightlife` (moon + stars) | After-dark, velvet rope |
| Classes | `emerald` | `#009768` | `IconClasses` (open book) | Growth, learning, fresh start |
| Festivals | `amber` | `#d48700` | `IconFestivals` (firework burst) | Golden hour, celebration |
| Workshops | `indigo` | `#5B4FC4` | `IconWorkshops` (wrench) | Craft, focus, creative depth |
| Markets & Shopping | `lime` | `#ace671` | `IconMarkets` (tote bag) | Fresh finds, browsing |
| Talks & Lectures | `blue` | `#008bd2` | `IconTalks` (microphone) | Authority, ideas |
| Outdoors & Nature | `fern` | `#6BAD5A` | `IconOutdoors` (mountain peaks) | Nature, fresh air |
| Charity & Fundraising | `magenta` | `#D94B7A` | `IconCharity` (heart in hand) | Warmth, giving |
| Holiday & Seasonal | `golden` | `#e7b746` | `IconHoliday` (star) | Celebration, sparkle |
| Default | `blue` | `#008bd2` | `IconMusic` | Falls back to brand primary |

---

## Icons

### Custom SVG Category Icons
**File:** `src/components/icons/category-icons.tsx`

All 15 category icons are custom SVGs — bold, geometric, poster-style. They use `currentColor` so they inherit text/icon color from their parent. Designed to work at 24px minimum, best at 32px+ on color backgrounds.

| Icon | Component | Visual Description |
|---|---|---|
| Music | `IconMusic` | Three equalizer bars at different heights (filled rectangles with rounded ends) |
| Arts | `IconArts` | Circle with scattered dots inside (painter's palette abstraction) |
| Food | `IconFood` | Fork + knife, simplified geometric |
| Family | `IconFamily` | Three figures — two large flanking one small |
| Sports | `IconSports` | Lightning bolt, filled (pure energy) |
| Community | `IconCommunity` | Three overlapping circles (Venn diagram of connection) |
| Nightlife | `IconNightlife` | Crescent moon + stars, filled |
| Classes | `IconClasses` | Open book, two page spreads |
| Festivals | `IconFestivals` | Starburst / firework with radiating lines |
| Workshops | `IconWorkshops` | Wrench (hands-on making) |
| Markets | `IconMarkets` | Shopping tote bag |
| Talks | `IconTalks` | Microphone on stand |
| Outdoors | `IconOutdoors` | Mountain peaks with ground line |
| Charity | `IconCharity` | Heart above cupped hands |
| Holiday | `IconHoliday` | Five-pointed star, filled |

### Usage
```tsx
import { getCategoryIcon } from '@/components/icons/category-icons';

const Icon = getCategoryIcon(category.icon); // returns component
<Icon className="w-8 h-8 text-pure" />       // renders white 32px icon
```

### Other Assets Needed (Not SVGs)

These are assets that can't be generated in code and need to be sourced/created:

| Asset | Format | Where It's Used | Notes |
|---|---|---|---|
| **Happenlist logo** | SVG | Header, footer, OG image | Needs redesign — drop the serif. Clean sans-serif wordmark with the "H" in brand `blue`. Consider a simple geometric logomark (letter H in a rounded square?) |
| **OG share image** | PNG 1200x630 | Social sharing meta tags | Dark (`ink`) bg, logo, tagline. Needs to look good as a tiny thumbnail |
| **Favicon set** | ICO + PNG 32/180/512 | Browser tab, PWA | Simple "H" mark in `blue` on transparent or `ink` bg |
| **Empty state illustrations** | SVG | Search no-results, category empty, error pages | Simple, on-brand. Could be geometric shapes in category colors. NOT stock illustrations |
| **Hero placeholder** | JPG/WebP 1920x1080 | Hero section fallback when no featured event has an image | A beautiful Milwaukee city photo — lakefront, Third Ward, a crowd at Summerfest. Tinted or with gradient overlay |
| **Category hero images** (optional) | JPG/WebP 1200x600 | Category landing pages | One photo per category used as page hero. Music = concert crowd, Food = table spread, etc. |

---

## Typography v3

### Font Stack

**One family. One voice.**

**Plus Jakarta Sans** — everywhere. Headlines, body, captions, stats.
- Rounded terminals = friendly, approachable
- Geometric structure = modern, confident
- Weight range 200-800 = hierarchy through weight alone
- Good tabular figures = stats and numbers look clean

```
font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif
```

Alternatives if needed: **DM Sans** (Google Fonts) or **General Sans** (Fontshare).

### Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `hero` | `4.5rem` (72px) | 800 | 1.0 | `-0.03em` | Homepage hero stat/headline only |
| `display` | `3rem` (48px) | 700 | 1.1 | `-0.02em` | Section heroes, large feature titles |
| `h1` | `2.25rem` (36px) | 700 | 1.2 | `-0.01em` | Page titles |
| `h2` | `1.75rem` (28px) | 700 | 1.3 | `-0.01em` | Section headers |
| `h3` | `1.25rem` (20px) | 600 | 1.4 | `0` | Card titles, subsection headers |
| `h4` | `1.125rem` (18px) | 600 | 1.4 | `0` | Sub-headers, large labels |
| `body` | `1rem` (16px) | 400 | 1.6 | `0` | Default paragraph text |
| `body-sm` | `0.875rem` (14px) | 400 | 1.5 | `0` | Secondary info, metadata |
| `caption` | `0.75rem` (12px) | 500 | 1.4 | `0.02em` | Labels, badges, timestamps |
| `stat` | `4rem` (64px) | 800 | 1.0 | `-0.03em` | Big numbers (event count, stats) |

### Type Rules

1. **Headlines go BIG or go home.** Hero at 4.5rem+. Section headers 1.75rem minimum. If it doesn't feel slightly uncomfortable, it's too small.
2. **Weight creates hierarchy, not font changes.** 800 display, 700 headers, 600 card titles, 400 body.
3. **Letter spacing tightens as size increases.** Hero/stat: `-0.03em`. Display: `-0.02em`. Body: `0`. Caption: `+0.02em`.
4. **All caps for labels and badges ONLY.** Category badges, status pills, "FEATURED" flags. Never headlines. Always `letter-spacing: 0.05em` when uppercase.

---

## Layout System

### Page Rhythm (Light/Dark Alternation)

```
1. HERO              → ink bg        — greeting + featured event + quick-glance sidebar + filter pills
2. FEATURED BENTO    → white bg      — mixed content grid (events + stat + list)
3. TONIGHT/WEEKEND   → ink bg        — horizontal scroll, bold section title
4. CATEGORIES        → ice bg        — full-color category tiles grid
5. JUST ADDED        → white bg      — numbered list rows (AIHub style)
6. CTA               → blue bg       — full-color brand block
```

### Hero Section (Dark, Immersive)

The hero is NOT a headline + search box. It's a **magazine cover** — the best event right now, front and center. The content IS the hero.

```
Desktop (1280px+):
┌─────────────────────────────────────────────────────────────┐
│ (ink background, full-width, ~60vh)                         │
│                                                             │
│   Good evening, Milwaukee                                   │
│                                                             │
│   ┌──────────────────────────┐  ┌───────────────────────┐  │
│   │                          │  │  THIS WEEKEND          │  │
│   │   [Music]                │  │                        │  │
│   │                          │  │  Sat · Summerfest...   │  │
│   │   (featured event image  │  │  Sat · Gallery Walk..  │  │
│   │    fills this card)      │  │  Sun · Taco Fest...    │  │
│   │                          │  │  Sun · Open Mic...     │  │
│   │   ─── gradient ───────── │  │                        │  │
│   │   Tonight · 8pm          │  │  42 events →           │  │
│   │   Jazz at the Pabst      │  │                        │  │
│   │   Pabst Theater · Free   │  └───────────────────────┘  │
│   └──────────────────────────┘                              │
│                                                             │
│   ○ Today  ○ This Weekend  ○ Free  ○ Music  ○ Food  ○ ...  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Mobile (<768px):
┌──────────────────────────┐
│ (ink bg)                 │
│                          │
│ Good evening, Milwaukee  │
│                          │
│ ┌──────────────────────┐ │
│ │  [Music]             │ │
│ │                      │ │
│ │  (featured event)    │ │
│ │                      │ │
│ │  ── gradient ─────── │ │
│ │  Tonight · 8pm       │ │
│ │  Jazz at the Pabst   │ │
│ └──────────────────────┘ │
│                          │
│ ○ Today ○ Weekend ○ ... │
│                          │
└──────────────────────────┘
```

**Hero Elements:**

| Element | Details |
|---|---|
| **Time-aware greeting** | Client component. "Good morning, Milwaukee" / "Happy Saturday, Milwaukee" / "What's on tonight?" — changes by time of day and day of week. `h2` size, `pure` text, 600 weight. Feels personal, not promotional. |
| **Featured event card** | The editor's pick. Full-bleed image with bottom gradient overlay (`rgba(2,2,3,0.85)` → `transparent`). Category badge top-left. Title at `h1` size in white. Date + venue below. Takes ~60% width on desktop, full-width on mobile. Links to event detail. |
| **Quick-glance sidebar** | Right column on desktop, hidden on mobile. `night` bg card with rounded corners. Header: "THIS WEEKEND" (caption, uppercase, `blue-light`). 4-5 compact event rows: category dot + title + day/time. Bottom: total count + arrow link. Gives a sense of density without a stat number. |
| **Filter pills** | Horizontal scroll row at bottom of hero. Pills: `slate` bg, `pure` text, rounded-full. Active/hover: `blue` bg. Categories: Today, This Weekend, Free, then top category names. Quick navigation into filtered views. |

**What's NOT in the hero:**
- No "Discover what's happening" headline (the content discovers for you)
- No giant event count stat (moved to bento grid as a StatCard)
- No search bar (lives in the header/nav, always accessible)
- No generic subtitle text

### The Bento Grid (Below Hero)

The featured section uses a **5-6 cell asymmetric grid** where each cell has a different purpose:

```
Desktop (1280px+):
┌──────────────┬─────────┬─────────┐
│              │  STAT   │  EVENT  │
│  EVENT CARD  │  CARD   │  CARD   │
│  (2col×2row) ├─────────┼─────────┤
│              │  EVENT  │  LIST   │
│              │  CARD   │  CARD   │
└──────────────┴─────────┴─────────┘

Tablet (768-1279px):
┌──────────────┬─────────┐
│  EVENT CARD  │  STAT   │
│              │  CARD   │
├──────────────┼─────────┤
│  EVENT CARD  │  LIST   │
│              │  CARD   │
└──────────────┴─────────┘

Mobile (<768px):
┌──────────────┐
│  STAT CARD   │
├──────────────┤
│  EVENT CARD  │
├──────────────┤
│  EVENT CARD  │
├──────────────┤
│  EVENT CARD  │
└──────────────┘
```

**Cell Types:**

| Cell | Visual Treatment |
|---|---|
| Stat Card | Full `blue` or `amber` bg. Giant number (`stat` size), short label. Typography IS the design. "42 free events this week" or "12 events today" |
| Event Card (large) | Image top half, content bottom. Category badge on image. 2col x 2row on desktop. The second-best pick after the hero. |
| Event Card (standard) | Same treatment, 1x1 cell. Third and fourth picks. |
| List Card | No images. "Trending" or "New this week" header. Numbered list of 3-4 events with category dots and times. Compact, scannable |

### Card Design Patterns

#### Standard Event Card
```
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │     [Music]    ♡    │ │  ← Category badge top-left, heart top-right
│ │                     │ │     Image (aspect-ratio: 3/2)
│ └─────────────────────┘ │
│                         │
│ Tonight · 8pm           │  ← Time-aware date (caption, zinc)
│ Jazz at the Pabst       │  ← Title (h3, ink, 2-line clamp)
│ Pabst Theater           │  ← Venue (body-sm, zinc)
│                         │
│ Free · ○○○ 2 going      │  ← Price + optional social proof
└─────────────────────────┘
```

- `border-radius: 16px`
- Shadow: `card` at rest, `card-hover` + `translateY(-4px)` on hover
- No colored top-border — category comes from badge
- Category badge: pill with full category color bg, white text, uppercase caption

#### Hero Event Card (Bento)
```
┌─────────────────────────────────────────┐
│   [Music]                               │
│                                         │
│             (full-bleed image)           │
│                                         │
│   ─── gradient ──────────────────────── │
│   Tonight · 8pm                         │
│   Milwaukee Jazz Festival               │  ← h1 size, white, bold
│   Pabst Theater · Free                  │
└─────────────────────────────────────────┘
```

- Gradient: `linear-gradient(to top, rgba(2,2,3,0.85) 0%, transparent 60%)`
- Category badge absolute top-left

#### Stat Card (Color Block)
```
┌─────────────────────────┐
│                         │
│        127              │  ← stat size (4rem), 800 weight, pure white
│   events this week      │  ← body-sm, pure/80%
│                         │
│       [Browse →]        │  ← Small text link, underline on hover
└─────────────────────────┘
```

- Full bg: `blue`, `amber`, `golden`, or `orange`
- All text white
- Optional subtle dot-grid texture at 5% opacity

#### Numbered List Rows
```
  01  ● Jazz at the Pabst         Tonight · 8pm   Free
  02  ● Taco Fest MKE             Sat · 12pm      $15
  03  ● Open Mic Night            Tomorrow · 7pm   Free
```

- Number: `caption`, zinc, tabular-nums
- Dot: filled circle in category color (8px)
- Title: `body`, ink, semibold
- Date: `body-sm`, zinc
- Price: `emerald` for free, zinc for paid
- Row border: 1px `mist`
- Hover: `cloud` bg fill

### Bold Category Tiles

```
┌────────────────────────┐
│                        │
│  ≡≡≡                   │  ← Custom SVG icon, 32px, white
│                        │
│  Music                 │  ← h3 size, bold, white
│  24 events             │  ← caption, white/70%
│                        │
└────────────────────────┘
```

- Full category color background (saturated, not tinted)
- White text and icon
- `border-radius: 20px`
- Grid: 2 cols mobile, 3 tablet, 5 desktop
- Hover: `scale(1.02)` + shadow lift
- Icon from `src/components/icons/category-icons.tsx`

### Dark Section (Tonight / This Weekend)

```
┌─────────────────────────────────────────────────────────────┐
│ (ink background)                                            │
│                                                             │
│  Tonight in Milwaukee                    See all →          │
│                                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │ card │  │ card │  │ card │  │ card │  │ card │  → scroll│
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Full-width `ink` bg
- Title in `pure`, "See all" in `blue-light`
- Cards use `night` bg, `silver` borders
- Horizontal scroll on mobile with scrollbar-hide, grid on desktop
- Fade edges (gradient mask) on scroll overflow

---

## Motion & Interaction

### Hover States
- **Cards:** `translateY(-4px)` + `card-hover` shadow. 200ms ease-out
- **Buttons:** Bg color shift. Primary: `blue` → `blue-light`. 150ms
- **Links:** Color shift + underline appears. No movement
- **Category tiles:** `scale(1.02)` + shadow. 200ms ease-out
- **List rows:** `cloud` bg fill. 150ms

### Scroll Animations
- Sections fade-in + slide-up (10px) on viewport entry. `IntersectionObserver`, `threshold: 0.1`
- Card stagger: 50ms delay between siblings
- Duration: 400ms. Easing: `ease-out`. **No spring/bounce.**
- Only trigger once (not on every scroll)

### Loading
- Skeleton shimmer: `cloud` → `mist` → `cloud`
- Image placeholder: solid `cloud` + shimmer, matching border-radius
- All images use explicit `aspect-ratio` to prevent layout shift

---

## Component Inventory

### New Components (Shipped)

| Component | Purpose |
|---|---|
| `HeroSlideshow` | Full-bleed image carousel with crossfade, dots, swipe, auto-advance |
| `TimeAwareGreeting` | Client component: "Good evening, Milwaukee" / "Happy Saturday" |
| `FilterPills` | Horizontal scrolling category/time pills below hero |
| `JustAddedRows` | Numbered list rows (01, 02...) with category dots |
| `ListCard` | Numbered compact event list (no images) |
| `CategoryTiles` | Full-color category cards with custom SVG icons |
| `CategoryIcon` | Custom SVG icon renderer (`getCategoryIcon()`) |
| `HomepageEventCard` | Inline card with date block + category badge (page.tsx) |
| `CompactEventCard` | Narrow horizontal-scroll card with time overlay (page.tsx) |

### Modified Components

| Component | Changes |
|---|---|
| `EventCard` | Remove top border stripe. Category badge on image. New shadow/radius. Sans-serif. Optional social proof |
| `Header` | Brand `blue` accents. Search in nav. Sans-serif logo. `ink` text |
| `Footer` | `night` bg instead of midnight. Update link colors |
| `Button` | Primary = `blue`. Secondary = `ink` outline. Remove coral |
| `SectionHeader` | Bolder, larger. "See all" link in `blue` |
| `EventGrid` | Bento variant supports mixed cell types |
| `CategoryGrid` | Completely replaced by `CategoryTile` grid |

### Removed

| What | Replaced By |
|---|---|
| `.bg-topo` / `.bg-topo-light` | Clean bg or subtle dot grid |
| Fraunces font import | Plus Jakarta Sans |
| All coral tokens | `orange` / `rose` |
| cream / warm-white tokens | `white` (#f5f4f0) / `pure` (#fff) |
| sand / stone tokens | `mist` / `zinc` |
| Lucide category icons | Custom SVGs in `category-icons.tsx` |
| `ICON_MAP` in CategoryGrid | `getCategoryIcon()` from icons module |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `sm` | `8px` | Badges, pills, small inputs |
| `md` | `12px` | Buttons, form elements |
| `lg` | `16px` | Cards, images, modals |
| `xl` | `24px` | Large feature cards, hero images |
| `2xl` | `32px` | Category tiles, promo cards |
| `full` | `9999px` | Avatars, round buttons |

### Shadows

| Token | Value | Usage |
|---|---|---|
| `sm` | `0 1px 3px rgba(0,0,0,0.06)` | Subtle elevation |
| `card` | `0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)` | Card rest |
| `card-hover` | `0 12px 24px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.04)` | Card hover |
| `elevated` | `0 8px 32px rgba(0,0,0,0.12)` | Dropdowns |
| `modal` | `0 24px 48px rgba(0,0,0,0.16)` | Modals |

---

## Spacing & Grid

- **Base unit:** 4px
- **Container max-width:** 1280px
- **Grid gap:** 16px mobile, 20px tablet, 24px desktop
- **Section padding:** 48px mobile, 64px tablet, 80px desktop (vertical)
- **Card padding:** 16px mobile, 20px desktop

---

## Implementation Status

All phases are **complete**. The v3 redesign is fully implemented.

**Phase 1: Foundation** — DONE
- [x] Swapped font: Plus Jakarta Sans (removed Fraunces)
- [x] Replaced entire color system in Tailwind config (15 categories, 10 neutrals, brand colors)
- [x] Updated globals.css (removed topo, new base styles, skeleton shimmer, scroll-snap)
- [x] Updated CSS custom properties
- [x] Updated category-colors.ts with 15-color map
- [x] Wired up 15 custom SVG icons in `category-icons.tsx`

**Phase 2: Homepage** — DONE
- [x] Hero slideshow with crossfade, time-aware greeting, swipe support
- [x] Editor's Picks — 3 featured event cards (grid desktop, horizontal scroll mobile)
- [x] Events by Category — top 3 categories with real event cards
- [x] Dark "This Weekend" horizontal scroll section
- [x] "Just Added" numbered list rows with category dots
- [x] Brand blue CTA section
- [x] ISR caching (revalidate: 60s) for performance

**Phase 3: Propagate** — DONE
- [x] Updated EventCard (no top border, shadow-card, category badge on image)
- [x] Updated Header/Footer (blue brand, Plus Jakarta Sans, ink/zinc text)
- [x] Updated Button/Input/Badge/Card components
- [x] Updated all page layouts (about, contact, search, events, submit, my/)
- [x] Replaced coral/charcoal/sand tokens with blue/ink/mist across 60+ files
- [x] Heart button uses rose color
- [x] Selection states use blue (forms, pills, toggles)
- [x] Modal overlays use bg-ink/50

**Phase 4: Polish** — DONE
- [x] Custom 404 page
- [x] Global error boundary (error.tsx)
- [x] Scroll-snap on horizontal card carousels
- [x] Focus-visible rings on card links
- [x] FlyerLightbox renders only when event has flyer_url

**Still needed (assets):**
- [ ] Logo redesign / favicon
- [ ] OG share image
- [ ] Hero fallback Milwaukee photo
- [ ] Empty state illustrations

---

## Reference: Inspo Pattern Index

| Pattern | Source Image | Our Adaptation |
|---|---|---|
| Asymmetric bento grid | AIHub (Image 1) | HeroBento with 5 cell types |
| Color-block stat cards | AIHub stat card (teal "95.5+") | StatCard with blue/amber bg |
| Numbered list rows | AIHub bottom list (01-05) | "Just Added" section |
| Bold single-color tiles | Blue Grid keyword cards | Category tiles with full bg + custom icons |
| Time-aware greeting | Green App "Hello, Adom!" | TimeAwareGreeting component |
| Time badge on images | Green App event cards | Event time overlay on hero/cards |
| Dark/light alternation | Evenfonic dark header, AIHub body | Homepage section rhythm |
| Category badge on image | Purple App, Evenfonic | Badge positioned over card image |
| Horizontal scroll cards | Purple App "Discover Events" | Dark "Tonight" section |
| Social proof (avatars) | Purple App, Green App | Optional row on EventCard |
| Search in nav | All 5 images | Search moves to header |
| Full-bleed hero + gradient | Evenfonic detail, Purple App | Hero bento cell |
| Giant display numbers | AIHub "95.5+", Blue Grid "88%" | Stat cards, hero event count |
| Custom geometric icons | Blue Grid keyword icons | 15 category SVGs in poster style |
