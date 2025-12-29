import type { Config } from 'tailwindcss';

/**
 * HAPPENLIST TAILWIND CONFIGURATION
 * =================================
 * Design system tokens based on warm, editorial aesthetic.
 * Retro-modern: serif headlines + clean contemporary UI.
 */

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ==========================================
      // COLORS - Warm & Editorial Palette
      // ==========================================
      colors: {
        // Primary colors
        cream: '#FDF8F3',           // Page backgrounds
        'warm-white': '#FFFEFA',    // Card backgrounds, modals
        sand: '#E8E0D5',            // Borders, dividers, secondary bg
        stone: '#9C9487',           // Secondary text, icons, muted
        charcoal: '#2D2A26',        // Primary text, headlines

        // Accent colors
        coral: {
          DEFAULT: '#E07A5F',       // Primary CTA, hearts, links
          light: '#F4D1C7',         // Hover states, accent badges
          dark: '#C45D43',          // Pressed states
        },
        sage: {
          DEFAULT: '#87A878',       // Success, "Free" badges
          light: '#D4E4CD',         // Success backgrounds
        },
      },

      // ==========================================
      // TYPOGRAPHY
      // ==========================================
      fontFamily: {
        // Fraunces for headlines (variable optical size)
        display: ['Fraunces', 'Georgia', 'serif'],
        // Inter for body text and UI
        body: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        // Display sizes (for Fraunces)
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '500' }],
        'h1': ['2.5rem', { lineHeight: '1.2', fontWeight: '500' }],
        'h2': ['1.75rem', { lineHeight: '1.3', fontWeight: '500' }],
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        'h4': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        // Body sizes (for Inter)
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
      },

      // ==========================================
      // SPACING - 4px base unit
      // ==========================================
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
      },

      // ==========================================
      // BORDER RADIUS
      // ==========================================
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '20px',
        'xl': '28px',
        'full': '9999px',
      },

      // ==========================================
      // BOX SHADOWS - Soft & Warm
      // ==========================================
      boxShadow: {
        'sm': '0 1px 2px rgba(45, 42, 38, 0.04)',
        'card': '0 2px 8px rgba(45, 42, 38, 0.06)',
        'card-hover': '0 8px 24px rgba(45, 42, 38, 0.1)',
        'dropdown': '0 4px 16px rgba(45, 42, 38, 0.12)',
        'modal': '0 16px 48px rgba(45, 42, 38, 0.16)',
      },

      // ==========================================
      // TRANSITIONS
      // ==========================================
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },

      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ==========================================
      // Z-INDEX SCALE
      // ==========================================
      zIndex: {
        'dropdown': '10',
        'sticky': '20',
        'overlay': '30',
        'modal': '40',
        'toast': '50',
      },

      // ==========================================
      // KEYFRAMES & ANIMATIONS
      // ==========================================
      keyframes: {
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'heart-beat': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
      },

      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'heart-beat': 'heart-beat 0.3s ease-out',
      },

      // ==========================================
      // CONTAINER
      // ==========================================
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          md: '1.5rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
        },
      },
    },
  },
  plugins: [],
};

export default config;
