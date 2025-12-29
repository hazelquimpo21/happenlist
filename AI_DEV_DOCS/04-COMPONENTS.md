# Happenlist: Components Specification

## Overview

This document defines all reusable components, their props, variants, and behavior. Components are organized by category and designed to be composed together.

---

## Base UI Components

### Button

**File:** `src/components/ui/button.tsx`

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  href?: string;              // Renders as <a> if provided
  external?: boolean;         // Opens in new tab
}
```

**Variants:**

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| `primary` | coral | warm-white | none |
| `secondary` | transparent | coral | coral |
| `ghost` | transparent | stone | none |
| `danger` | red-500 | white | none |

**Sizes:**

| Size | Padding | Font Size | Height |
|------|---------|-----------|--------|
| `sm` | 12px 16px | 14px | 36px |
| `md` | 14px 24px | 16px | 44px |
| `lg` | 16px 32px | 18px | 52px |

**States:**
- Hover: Darken background 10%
- Focus: Ring with coral-light
- Disabled: 50% opacity, no pointer events
- Loading: Show spinner, disable click

---

### Badge

**File:** `src/components/ui/badge.tsx`

```typescript
interface BadgeProps {
  variant?: 'default' | 'category' | 'free' | 'date' | 'status';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  icon?: React.ReactNode;
}
```

**Variants:**

| Variant | Background | Text |
|---------|------------|------|
| `default` | sand | charcoal |
| `category` | sand | charcoal |
| `free` | sage-light | charcoal |
| `date` | coral-light | coral-dark |
| `status` | varies | varies |

---

### Card

**File:** `src/components/ui/card.tsx`

```typescript
interface CardProps {
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;            // Enable hover lift effect
  children: React.ReactNode;
  className?: string;
}
```

**Specifications:**
- Background: warm-white
- Border radius: radius-lg (20px)
- Shadow: shadow-card (default), shadow-card-hover (on hover if enabled)
- Transition: transition-base for hover effects

---

### Input

**File:** `src/components/ui/input.tsx`

```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'search' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
```

**Specifications:**
- Background: warm-white
- Border: 1px sand
- Border radius: radius-sm (8px)
- Focus: border-coral, ring coral-light
- Error: border-red-500, error message below

---

### Skeleton

**File:** `src/components/ui/skeleton.tsx`

```typescript
interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}
```

**Specifications:**
- Background: animated gradient sand to sand-light
- Border radius: matches variant
- Animation: shimmer effect, 1.5s duration

---

## Layout Components

### Header

**File:** `src/components/layout/header.tsx`

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]     [Search]     [Browse ▾]   [♡]   [Sign In]   │
└─────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface HeaderProps {
  transparent?: boolean;      // For hero overlays
}
```

**Behavior:**
- Sticky on scroll
- Shadow appears on scroll
- Mobile: Logo + hamburger menu
- Desktop: Full nav with search

**Sub-components:**
- `header-nav.tsx` - Navigation links
- `header-search.tsx` - Collapsible search bar
- `mobile-menu.tsx` - Mobile slide-out menu

---

### Footer

**File:** `src/components/layout/footer.tsx`

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]                                                 │
│                                                         │
│  Discover        About          For Organizers          │
│  - Events        - About Us     - Submit Event          │
│  - Venues        - Contact      - Dashboard             │
│  - Organizers    - Terms        - Help                  │
│                  - Privacy                              │
│                                                         │
│  © 2025 Happenlist                                      │
└─────────────────────────────────────────────────────────┘
```

---

### Container

**File:** `src/components/layout/container.tsx`

```typescript
interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  className?: string;
}
```

**Sizes:**

| Size | Max Width |
|------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px (default) |
| `full` | 100% |

---

### Breadcrumbs

**File:** `src/components/layout/breadcrumbs.tsx`

```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;              // If not provided, renders as text
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}
```

**Example:**
```
Events > Music > Jazz at the Lake
```

---

## Event Components

### EventCard

**File:** `src/components/events/event-card.tsx`

The primary event display component for grids and lists.

```typescript
interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'featured';
  showHeart?: boolean;
  showCategory?: boolean;
}
```

**Structure (default variant):**
```
┌────────────────────────────────────┐
│ ┌────────────────────────────────┐ │
│ │                            ♡   │ │  ← Heart button (absolute)
│ │         IMAGE                  │ │  ← 16:9 aspect ratio
│ │                                │ │
│ │  ┌──────┐                      │ │  ← Category badge (absolute)
│ │  │Music │                      │ │
│ │  └──────┘                      │ │
│ └────────────────────────────────┘ │
│                                    │
│  Feb 14 · 7:00 PM                  │  ← Date (body-sm, stone)
│  Jazz at the Lake                  │  ← Title (h3, display font)
│  The Lakefront Pavilion            │  ← Venue (body-sm, stone)
│                                    │
│  $15–$25                           │  ← Price (body-sm, coral/sage)
│                                    │
└────────────────────────────────────┘
```

**Variants:**

| Variant | Image Ratio | Title Size | Shows |
|---------|-------------|------------|-------|
| `default` | 16:9 | h3 | All info |
| `compact` | 4:3 | body | Date, title, venue only |
| `featured` | 3:2 | h2 | All info + description excerpt |

---

### EventGrid

**File:** `src/components/events/event-grid.tsx`

```typescript
interface EventGridProps {
  events: Event[];
  columns?: 2 | 3 | 4;
  loading?: boolean;
  emptyMessage?: string;
}
```

**Responsive columns:**
- Mobile: 1 column
- sm (640px): 2 columns
- lg (1024px): 3 columns
- xl (1280px): 4 columns (if columns prop = 4)

---

### EventHero

**File:** `src/components/events/event-hero.tsx`

Hero section for event detail page.

```typescript
interface EventHeroProps {
  event: Event;
}
```

**Structure:**
```
┌─────────────────────────────────────┬──────────────┐
│                                     │              │
│         HERO IMAGE                  │   FLYER      │
│         (main event photo)          │   (optional) │
│                                     │              │
└─────────────────────────────────────┴──────────────┘
```

**Specifications:**
- Main image: 16:9 or flexible height with max
- Flyer: Show only if different from main image
- Flyer is clickable to view full size
- Border radius: radius-lg

---

### EventDetails

**File:** `src/components/events/event-details.tsx`

Main info section on event detail page.

```typescript
interface EventDetailsProps {
  event: EventWithDetails;
}
```

**Displays:**
- Category badge
- Title (h1, display font)
- Date and time (with calendar icon)
- Location with link (with map pin icon)
- Price information (with ticket icon)
- CTA button (Get Tickets / More Info)
- Description (prose formatting)

---

### EventPrice

**File:** `src/components/events/event-price.tsx`

```typescript
interface EventPriceProps {
  event: Pick<Event, 'price_type' | 'price_low' | 'price_high' | 'price_details' | 'is_free'>;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}
```

**Display logic:**
```
is_free = true              → "Free" (sage color)
price_type = 'fixed'        → "$25"
price_type = 'range'        → "$15–$45"
price_type = 'varies'       → "Prices vary"
price_type = 'donation'     → "Pay what you can"
```

If `showDetails` and `price_details` exists, show below price.

---

### EventDate

**File:** `src/components/events/event-date.tsx`

```typescript
interface EventDateProps {
  startDate: string;
  endDate?: string;
  isAllDay?: boolean;
  format?: 'short' | 'long' | 'relative';
}
```

**Formats:**

| Format | Example |
|--------|---------|
| `short` | Feb 14 · 7:00 PM |
| `long` | Friday, February 14, 2025 at 7:00 PM |
| `relative` | Tomorrow at 7:00 PM |

---

### FeaturedEvents

**File:** `src/components/events/featured-events.tsx`

Horizontal scrollable or large grid of featured events.

```typescript
interface FeaturedEventsProps {
  events: Event[];
  title?: string;
  viewAllHref?: string;
}
```

**Layout:**
- Desktop: 3 large cards in a row
- Mobile: Horizontal scroll
- Each card uses `EventCard` with `variant="featured"`

---

### RelatedEvents

**File:** `src/components/events/related-events.tsx`

```typescript
interface RelatedEventsProps {
  eventId: string;            // Current event (to exclude)
  categoryId?: string;
  venueId?: string;
  organizerId?: string;
  limit?: number;
}
```

Fetches and displays related events based on category, venue, or organizer.

---

## Venue Components

### VenueCard

**File:** `src/components/venues/venue-card.tsx`

```typescript
interface VenueCardProps {
  venue: Venue;
  eventCount?: number;
}
```

**Structure:**
```
┌────────────────────────────────────┐
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ │         IMAGE                  │ │
│ │                                │ │
│ └────────────────────────────────┘ │
│                                    │
│  The Lakefront Pavilion            │  ← Name (h3)
│  Milwaukee                         │  ← City (body-sm, stone)
│  12 upcoming events                │  ← Event count (body-sm)
│                                    │
└────────────────────────────────────┘
```

---

### VenueHeader

**File:** `src/components/venues/venue-header.tsx`

Header for venue detail page.

```typescript
interface VenueHeaderProps {
  venue: Venue;
}
```

**Displays:**
- Name (h1)
- Full address
- Venue type badge
- Website link
- Map preview (optional)

---

## Filter Components

### FilterSidebar

**File:** `src/components/filters/filter-sidebar.tsx`

Container for all filters on events index page.

```typescript
interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories: Category[];
}

interface FilterState {
  categoryIds?: string[];
  dateRange?: { start: string; end: string };
  priceRange?: { min?: number; max?: number };
  isFree?: boolean;
  venueTypes?: string[];
}
```

**Structure:**
```
┌──────────────────────┐
│  Filters     [Clear] │
├──────────────────────┤
│  Date                │
│  [Date picker]       │
├──────────────────────┤
│  Category            │
│  ☐ Music             │
│  ☐ Arts              │
│  ☐ Family            │
│  ...                 │
├──────────────────────┤
│  Price               │
│  ☐ Free              │
│  ☐ Under $20         │
│  ☐ $20-$50           │
│  ☐ $50+              │
├──────────────────────┤
│  Venue Type          │
│  ☐ Indoor            │
│  ☐ Outdoor           │
│  ☐ Online            │
└──────────────────────┘
```

---

### FilterPills

**File:** `src/components/filters/filter-pills.tsx`

Active filter display with remove buttons.

```typescript
interface FilterPillsProps {
  filters: FilterState;
  onRemove: (filterKey: string, value?: string) => void;
  onClearAll: () => void;
}
```

**Display:**
```
[Music ✕] [This Weekend ✕] [Free ✕] [Clear all]
```

---

### SortDropdown

**File:** `src/components/filters/sort-dropdown.tsx`

```typescript
interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'popular';
```

**Options:**
- Date (Soonest)
- Date (Latest)
- Name (A-Z)
- Most Popular

---

## Search Components

### SearchBar

**File:** `src/components/search/search-bar.tsx`

```typescript
interface SearchBarProps {
  variant?: 'default' | 'hero' | 'header';
  placeholder?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
}
```

**Variants:**

| Variant | Size | Background | Features |
|---------|------|------------|----------|
| `default` | md | warm-white | Basic |
| `hero` | lg | warm-white | Large, prominent |
| `header` | sm | transparent | Collapsible, icon trigger |

---

### SearchResults

**File:** `src/components/search/search-results.tsx`

```typescript
interface SearchResultsProps {
  query: string;
  results: {
    events: Event[];
    venues: Venue[];
    organizers: Organizer[];
  };
  loading?: boolean;
}
```

**Structure:**
- Grouped by type (Events, Venues, Organizers)
- Show count for each group
- Link to full results per type

---

## Heart Components

### HeartButton

**File:** `src/components/hearts/heart-button.tsx`

```typescript
interface HeartButtonProps {
  eventId: string;
  initialHearted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'overlay';  // overlay for on top of images
}
```

**Behavior:**
- Client component (uses state)
- Optimistic update
- Requires authentication (redirect if not logged in)
- Animation on toggle (scale bounce)

**States:**
- Empty: Stone outline heart
- Filled: Coral filled heart
- Hover: Scale up slightly
- Loading: Pulse animation

---

## SEO Components

### EventJsonLd

**File:** `src/components/seo/event-json-ld.tsx`

Generates Schema.org Event structured data.

```typescript
interface EventJsonLdProps {
  event: EventWithDetails;
}
```

**Output:** JSON-LD script tag with Event schema including:
- name, description, startDate, endDate
- location (Place with address)
- offers (pricing)
- organizer
- image
- eventStatus, eventAttendanceMode

---

### VenueJsonLd

**File:** `src/components/seo/venue-json-ld.tsx`

```typescript
interface VenueJsonLdProps {
  venue: Venue;
}
```

**Output:** LocalBusiness or Place schema.

---

## Utility Components

### SectionHeader

**File:** `src/components/home/section-header.tsx`

```typescript
interface SectionHeaderProps {
  title: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}
```

**Structure:**
```
This Weekend                    [See all →]
```
