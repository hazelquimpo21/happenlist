# Happenlist: Design System

## Brand Personality

Happenlist feels like a beautifully designed local magazine—warm, inviting, and effortlessly stylish. It's retro-modern: combining editorial serif typography with clean, contemporary UI patterns.

---

## Color Palette

### Primary Colors

| Token | Name | Hex | RGB | Usage |
|-------|------|-----|-----|-------|
| `--color-cream` | Cream | `#FDF8F3` | 253, 248, 243 | Page backgrounds |
| `--color-warm-white` | Warm White | `#FFFEFA` | 255, 254, 250 | Card backgrounds, modals |
| `--color-sand` | Sand | `#E8E0D5` | 232, 224, 213 | Borders, dividers, secondary bg |
| `--color-stone` | Stone | `#9C9487` | 156, 148, 135 | Secondary text, icons, muted |
| `--color-charcoal` | Charcoal | `#2D2A26` | 45, 42, 38 | Primary text, headlines |

### Accent Colors

| Token | Name | Hex | RGB | Usage |
|-------|------|-----|-----|-------|
| `--color-coral` | Coral | `#E07A5F` | 224, 122, 95 | Primary CTA, hearts, links |
| `--color-coral-light` | Coral Light | `#F4D1C7` | 244, 209, 199 | Hover states, accent badges |
| `--color-coral-dark` | Coral Dark | `#C45D43` | 196, 93, 67 | Pressed states |
| `--color-sage` | Sage | `#87A878` | 135, 168, 120 | Success, "Free" badges |
| `--color-sage-light` | Sage Light | `#D4E4CD` | 212, 228, 205 | Success backgrounds |

### Semantic Colors

| Token | Usage |
|-------|-------|
| `--color-text-primary` | `var(--color-charcoal)` |
| `--color-text-secondary` | `var(--color-stone)` |
| `--color-text-inverse` | `var(--color-warm-white)` |
| `--color-bg-primary` | `var(--color-cream)` |
| `--color-bg-card` | `var(--color-warm-white)` |
| `--color-bg-muted` | `var(--color-sand)` |
| `--color-border` | `var(--color-sand)` |
| `--color-accent` | `var(--color-coral)` |
| `--color-success` | `var(--color-sage)` |

### Tailwind Config Extension

```javascript
// tailwind.config.js colors
colors: {
  cream: '#FDF8F3',
  'warm-white': '#FFFEFA',
  sand: '#E8E0D5',
  stone: '#9C9487',
  charcoal: '#2D2A26',
  coral: {
    DEFAULT: '#E07A5F',
    light: '#F4D1C7',
    dark: '#C45D43',
  },
  sage: {
    DEFAULT: '#87A878',
    light: '#D4E4CD',
  },
}
```

---

## Typography

### Font Families

| Token | Font | Fallback | Usage |
|-------|------|----------|-------|
| `--font-display` | Fraunces | Georgia, serif | Headlines, titles, brand |
| `--font-body` | Inter | system-ui, sans-serif | Body text, UI elements |

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type Scale

| Token | Size | Line Height | Weight | Font | Usage |
|-------|------|-------------|--------|------|-------|
| `--text-display` | 48px / 3rem | 1.1 | 500 | Display | Hero headlines |
| `--text-h1` | 40px / 2.5rem | 1.2 | 500 | Display | Page titles |
| `--text-h2` | 28px / 1.75rem | 1.3 | 500 | Display | Section headings |
| `--text-h3` | 20px / 1.25rem | 1.4 | 500 | Display | Card titles, subsections |
| `--text-h4` | 18px / 1.125rem | 1.4 | 500 | Display | Small headings |
| `--text-body` | 16px / 1rem | 1.6 | 400 | Body | Paragraphs, descriptions |
| `--text-body-sm` | 14px / 0.875rem | 1.5 | 400 | Body | Secondary text, metadata |
| `--text-caption` | 12px / 0.75rem | 1.4 | 500 | Body | Badges, labels, micro text |

### Tailwind Font Config

```javascript
// tailwind.config.js
fontFamily: {
  display: ['Fraunces', 'Georgia', 'serif'],
  body: ['Inter', 'system-ui', 'sans-serif'],
},
fontSize: {
  'display': ['3rem', { lineHeight: '1.1', fontWeight: '500' }],
  'h1': ['2.5rem', { lineHeight: '1.2', fontWeight: '500' }],
  'h2': ['1.75rem', { lineHeight: '1.3', fontWeight: '500' }],
  'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
  'h4': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
  'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
  'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
  'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
}
```

---

## Spacing

Use a consistent 4px base unit.

| Token | Value | Pixels |
|-------|-------|--------|
| `--space-0` | 0 | 0px |
| `--space-1` | 0.25rem | 4px |
| `--space-2` | 0.5rem | 8px |
| `--space-3` | 0.75rem | 12px |
| `--space-4` | 1rem | 16px |
| `--space-5` | 1.25rem | 20px |
| `--space-6` | 1.5rem | 24px |
| `--space-8` | 2rem | 32px |
| `--space-10` | 2.5rem | 40px |
| `--space-12` | 3rem | 48px |
| `--space-16` | 4rem | 64px |
| `--space-20` | 5rem | 80px |
| `--space-24` | 6rem | 96px |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Small elements, inputs |
| `--radius-md` | 12px | Buttons, small cards |
| `--radius-lg` | 20px | Cards, modals |
| `--radius-xl` | 28px | Large featured cards |
| `--radius-full` | 9999px | Pills, avatars, circular buttons |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(45, 42, 38, 0.04)` | Subtle elevation |
| `--shadow-card` | `0 2px 8px rgba(45, 42, 38, 0.06)` | Cards at rest |
| `--shadow-card-hover` | `0 8px 24px rgba(45, 42, 38, 0.1)` | Cards on hover |
| `--shadow-dropdown` | `0 4px 16px rgba(45, 42, 38, 0.12)` | Dropdowns, popovers |
| `--shadow-modal` | `0 16px 48px rgba(45, 42, 38, 0.16)` | Modals, dialogs |

---

## Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `150ms ease` | Micro-interactions (color, opacity) |
| `--transition-base` | `200ms ease` | Standard transitions |
| `--transition-slow` | `300ms ease` | Larger movements, modals |
| `--transition-bounce` | `400ms cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful interactions (hearts) |

---

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | 0 | Default |
| `--z-dropdown` | 10 | Dropdowns |
| `--z-sticky` | 20 | Sticky headers |
| `--z-overlay` | 30 | Overlay backgrounds |
| `--z-modal` | 40 | Modals |
| `--z-toast` | 50 | Toast notifications |

---

## Breakpoints

| Token | Value | Description |
|-------|-------|-------------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

---

## Container

```css
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

@media (min-width: 768px) {
  .container {
    padding-left: var(--space-6);
    padding-right: var(--space-6);
  }
}
```

---

## Grid System

Use CSS Grid with these standard configurations:

```css
/* 12-column grid for complex layouts */
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
}

/* Event card grids */
.grid-events {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 640px) {
  .grid-events { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .grid-events { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1280px) {
  .grid-events { grid-template-columns: repeat(4, 1fr); }
}
```

---

## Iconography

Use **Lucide React** icons throughout the app.

### Standard Icon Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| `sm` | 16px | Inline with small text |
| `md` | 20px | Default, buttons, navigation |
| `lg` | 24px | Standalone, headers |
| `xl` | 32px | Feature icons, empty states |

### Common Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Heart (empty) | `Heart` | Save/unsave |
| Heart (filled) | `Heart` with fill | Saved state |
| Calendar | `Calendar` | Date/time |
| MapPin | `MapPin` | Location |
| Clock | `Clock` | Time |
| Ticket | `Ticket` | Pricing/tickets |
| Search | `Search` | Search |
| Filter | `SlidersHorizontal` | Filters |
| ChevronRight | `ChevronRight` | Navigation, links |
| ArrowLeft | `ArrowLeft` | Back navigation |
| ExternalLink | `ExternalLink` | External links |
| Share | `Share2` | Share functionality |
| User | `User` | User/account |
| Menu | `Menu` | Mobile menu |
| X | `X` | Close |
