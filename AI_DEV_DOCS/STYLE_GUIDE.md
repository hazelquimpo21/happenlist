# Style Guide

## Design Philosophy

Happenlist should feel **warm, inviting, and trustworthy**—like a local recommendation from a friend, not a corporate aggregator. The design borrows from the cream/beige warmth of Travelly while maintaining clarity and modern usability.

---

## Color Palette

### CSS Custom Properties

```css
/* styles/tokens.css */

:root {
  /* Brand Colors */
  --color-primary: 142 71% 45%;        /* Green - hsl(142, 71%, 45%) → #22c55e */
  --color-primary-light: 142 71% 95%;  /* Light green background */
  --color-primary-dark: 142 71% 35%;   /* Darker green for hover */
  
  --color-secondary: 24 100% 50%;      /* Orange accent - #ff6b00 */
  --color-secondary-light: 24 100% 95%;
  
  /* Neutral - Warm tones */
  --color-background: 40 33% 96%;      /* Warm off-white - #f9f6f1 */
  --color-surface: 0 0% 100%;          /* Pure white for cards */
  --color-surface-elevated: 40 20% 98%; /* Slightly warm white */
  
  /* Text */
  --color-text-primary: 20 14% 15%;    /* Near black, warm - #282420 */
  --color-text-secondary: 20 10% 40%;  /* Muted text */
  --color-text-tertiary: 20 8% 60%;    /* Even more muted */
  --color-text-inverse: 0 0% 100%;     /* White text on dark bg */
  
  /* Borders */
  --color-border: 20 10% 88%;          /* Subtle warm border */
  --color-border-strong: 20 10% 75%;   /* Stronger border */
  
  /* Status Colors */
  --color-success: 142 71% 45%;        /* Same as primary */
  --color-warning: 38 92% 50%;         /* Amber */
  --color-error: 0 84% 60%;            /* Red */
  --color-info: 199 89% 48%;           /* Blue */
  
  /* Category Colors (for badges) */
  --color-cat-music: 271 91% 65%;      /* Purple */
  --color-cat-arts: 328 85% 60%;       /* Pink */
  --color-cat-food: 38 92% 50%;        /* Amber */
  --color-cat-fitness: 142 71% 45%;    /* Green */
  --color-cat-kids: 217 91% 60%;       /* Blue */
  --color-cat-nightlife: 262 83% 58%;  /* Indigo */
  --color-cat-community: 173 80% 40%;  /* Teal */
  --color-cat-sports: 142 76% 36%;     /* Dark green */
  --color-cat-comedy: 48 96% 53%;      /* Yellow */
  --color-cat-film: 0 72% 51%;         /* Red */
  --color-cat-markets: 25 95% 53%;     /* Orange */
  --color-cat-classes: 199 89% 48%;    /* Sky */
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* Radius */
  --radius-sm: 0.375rem;   /* 6px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  --radius-full: 9999px;   /* Pill */
  
  /* Spacing (matches Tailwind) */
  --space-1: 0.25rem;      /* 4px */
  --space-2: 0.5rem;       /* 8px */
  --space-3: 0.75rem;      /* 12px */
  --space-4: 1rem;         /* 16px */
  --space-5: 1.25rem;      /* 20px */
  --space-6: 1.5rem;       /* 24px */
  --space-8: 2rem;         /* 32px */
  --space-10: 2.5rem;      /* 40px */
  --space-12: 3rem;        /* 48px */
  --space-16: 4rem;        /* 64px */
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}
```

---

### Tailwind Configuration

```typescript
// tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Map to CSS variables
        primary: {
          DEFAULT: 'hsl(var(--color-primary))',
          light: 'hsl(var(--color-primary-light))',
          dark: 'hsl(var(--color-primary-dark))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--color-secondary))',
          light: 'hsl(var(--color-secondary-light))',
        },
        background: 'hsl(var(--color-background))',
        surface: {
          DEFAULT: 'hsl(var(--color-surface))',
          elevated: 'hsl(var(--color-surface-elevated))',
        },
        text: {
          primary: 'hsl(var(--color-text-primary))',
          secondary: 'hsl(var(--color-text-secondary))',
          tertiary: 'hsl(var(--color-text-tertiary))',
          inverse: 'hsl(var(--color-text-inverse))',
        },
        border: {
          DEFAULT: 'hsl(var(--color-border))',
          strong: 'hsl(var(--color-border-strong))',
        },
        success: 'hsl(var(--color-success))',
        warning: 'hsl(var(--color-warning))',
        error: 'hsl(var(--color-error))',
        info: 'hsl(var(--color-info))',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

---

## Typography

### Font Stack

```css
:root {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Plus Jakarta Sans', var(--font-sans);
}
```

**Recommendations**:
- **Body**: Inter (clean, readable, excellent at small sizes)
- **Display/Headings**: Plus Jakarta Sans (slightly more personality, geometric)

### Type Scale

| Name | Size | Weight | Line Height | Use |
|------|------|--------|-------------|-----|
| `display-lg` | 48px / 3rem | 700 | 1.1 | Hero headlines |
| `display-md` | 36px / 2.25rem | 700 | 1.2 | Page titles |
| `display-sm` | 30px / 1.875rem | 600 | 1.2 | Section headers |
| `heading-lg` | 24px / 1.5rem | 600 | 1.3 | Card titles, H2 |
| `heading-md` | 20px / 1.25rem | 600 | 1.4 | H3, component headers |
| `heading-sm` | 18px / 1.125rem | 600 | 1.4 | H4, list headers |
| `body-lg` | 18px / 1.125rem | 400 | 1.6 | Lead paragraphs |
| `body-md` | 16px / 1rem | 400 | 1.6 | Default body |
| `body-sm` | 14px / 0.875rem | 400 | 1.5 | Secondary text |
| `caption` | 12px / 0.75rem | 500 | 1.4 | Labels, metadata |

### Tailwind Classes

```typescript
// Add to tailwind.config.ts theme.extend

fontSize: {
  'display-lg': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
  'display-md': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
  'display-sm': ['1.875rem', { lineHeight: '1.2', fontWeight: '600' }],
  'heading-lg': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
  'heading-md': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
  'heading-sm': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
  'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
  'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
  'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
  'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
},
```

---

## Spacing System

Use Tailwind's default spacing scale. Key values:

| Token | Value | Use |
|-------|-------|-----|
| `1` | 4px | Tight spacing (icon gaps) |
| `2` | 8px | Compact spacing |
| `3` | 12px | Default small gap |
| `4` | 16px | Standard spacing |
| `6` | 24px | Section padding |
| `8` | 32px | Large gaps |
| `12` | 48px | Section margins |
| `16` | 64px | Page sections |

### Layout Constants

```css
:root {
  --max-width-content: 1280px;
  --max-width-prose: 720px;
  --header-height: 64px;
  --sidebar-width: 280px;
  --admin-sidebar-width: 240px;
}
```

---

## Components

### Buttons

```css
/* Base button */
.btn {
  @apply inline-flex items-center justify-center gap-2;
  @apply font-medium rounded-lg;
  @apply transition-colors duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Sizes */
.btn-sm { @apply px-3 py-1.5 text-sm; }
.btn-md { @apply px-4 py-2 text-sm; }
.btn-lg { @apply px-6 py-3 text-base; }

/* Variants */
.btn-primary {
  @apply bg-primary text-white;
  @apply hover:bg-primary-dark;
  @apply focus:ring-primary;
}

.btn-secondary {
  @apply bg-surface border border-border text-text-primary;
  @apply hover:bg-background;
  @apply focus:ring-primary;
}

.btn-ghost {
  @apply bg-transparent text-text-secondary;
  @apply hover:bg-background hover:text-text-primary;
}

.btn-danger {
  @apply bg-error text-white;
  @apply hover:bg-error/90;
  @apply focus:ring-error;
}
```

### Cards

```css
.card {
  @apply bg-surface rounded-xl shadow-sm;
  @apply border border-border;
  @apply overflow-hidden;
  @apply transition-shadow duration-200;
}

.card-hover {
  @apply hover:shadow-md hover:-translate-y-0.5;
  @apply transition-all duration-200;
}

.card-padding {
  @apply p-4 md:p-6;
}
```

### Form Inputs

```css
.input {
  @apply w-full px-4 py-2;
  @apply bg-surface border border-border rounded-lg;
  @apply text-text-primary placeholder:text-text-tertiary;
  @apply focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary;
  @apply disabled:bg-background disabled:text-text-tertiary;
  @apply transition-colors duration-200;
}

.input-error {
  @apply border-error focus:ring-error/20 focus:border-error;
}

.label {
  @apply block text-body-sm font-medium text-text-primary mb-1.5;
}

.helper-text {
  @apply text-caption text-text-tertiary mt-1;
}

.error-text {
  @apply text-caption text-error mt-1;
}
```

### Badges

```css
.badge {
  @apply inline-flex items-center gap-1;
  @apply px-2.5 py-0.5 rounded-full;
  @apply text-caption font-medium;
}

.badge-primary {
  @apply bg-primary-light text-primary-dark;
}

.badge-secondary {
  @apply bg-background text-text-secondary;
}

/* Category badges - use category color */
.badge-category {
  /* Background: category color at 10% opacity */
  /* Text: category color at full */
}
```

---

## Icons

Use **Lucide React** for consistent, clean icons.

```bash
npm install lucide-react
```

### Common Icons

| Use | Icon Name |
|-----|-----------|
| Calendar/Date | `Calendar` |
| Time | `Clock` |
| Location | `MapPin` |
| Price/Ticket | `Ticket` |
| Free | `Gift` |
| Search | `Search` |
| Filter | `Filter` |
| Share | `Share2` |
| External Link | `ExternalLink` |
| Heart/Favorite | `Heart` |
| User/Organizer | `User` |
| Building/Venue | `Building2` |
| Close | `X` |
| Menu | `Menu` |
| Arrow | `ChevronRight`, `ChevronLeft`, `ArrowRight` |
| Add | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Check | `Check` |

### Icon Sizes

| Size | Use |
|------|-----|
| 16px (`w-4 h-4`) | Inline with text, buttons |
| 20px (`w-5 h-5`) | Cards, list items |
| 24px (`w-6 h-6`) | Standalone, navigation |
| 32px (`w-8 h-8`) | Empty states, features |

---

## Animation

### Transitions

```css
.transition-base {
  @apply transition-all duration-200 ease-out;
}

.transition-fast {
  @apply transition-all duration-150 ease-out;
}

.transition-slow {
  @apply transition-all duration-300 ease-out;
}
```

### Hover Effects

```css
/* Lift effect for cards */
.hover-lift {
  @apply transition-transform duration-200;
  @apply hover:-translate-y-1;
}

/* Scale effect for buttons/icons */
.hover-scale {
  @apply transition-transform duration-200;
  @apply hover:scale-105;
}
```

### Loading Skeleton

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  @apply bg-gradient-to-r from-background via-surface to-background;
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## Layout Patterns

### Page Container

```tsx
<main className="min-h-screen bg-background">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Content */}
  </div>
</main>
```

### Grid Layouts

```tsx
// Event cards grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

// Two-column with sidebar
<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
  <aside>{/* Filters */}</aside>
  <main>{/* Results */}</main>
</div>
```

### Section Spacing

```tsx
<section className="py-12 md:py-16">
  <h2 className="text-display-sm mb-8">Section Title</h2>
  {/* Content */}
</section>
```

---

## Dark Mode (Future)

The color system is designed to support dark mode via CSS variables. When implementing:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: 220 15% 10%;
    --color-surface: 220 15% 15%;
    --color-text-primary: 0 0% 95%;
    --color-text-secondary: 0 0% 70%;
    --color-border: 220 15% 25%;
    /* ... */
  }
}
```

**Phase 1**: Light mode only
**Future**: Add dark mode toggle with `prefers-color-scheme` default
