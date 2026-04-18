import type { Config } from 'tailwindcss';

/**
 * HAPPENLIST TAILWIND CONFIGURATION — v3 Redesign
 * ================================================
 * Bold, human, multi-chromatic city event guide.
 * Single font (Plus Jakarta Sans), dark/light section rhythm.
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
      // COLORS — City Festival Poster palette
      // ==========================================
      colors: {
        // Structural neutrals
        ink: '#020203',
        night: '#141416',
        slate: '#2A2A2E',
        zinc: '#71717A',
        silver: '#D1D1D6',
        mist: '#E4E4E7',
        cloud: '#F4F4F5',
        ice: '#e0f0f5',
        white: '#f5f4f0',
        pure: '#FFFFFF',

        // Primary brand
        blue: {
          DEFAULT: '#008bd2',
          light: '#33a2db',
          muted: 'rgba(0,139,210,0.12)',
          dark: '#006da6',
        },
        orange: {
          DEFAULT: '#d95927',
          light: 'rgba(217,89,39,0.12)',
          dark: '#b74820',
        },

        // Supporting accents
        golden: {
          DEFAULT: '#e7b746',
          light: 'rgba(231,183,70,0.12)',
        },
        amber: {
          DEFAULT: '#d48700',
          light: 'rgba(212,135,0,0.12)',
        },
        teal: {
          DEFAULT: '#008e91',
          light: 'rgba(0,142,145,0.12)',
        },
        lime: {
          DEFAULT: '#ace671',
          light: 'rgba(172,230,113,0.12)',
        },
        emerald: {
          DEFAULT: '#009768',
          light: 'rgba(0,151,104,0.12)',
        },
        plum: {
          DEFAULT: '#7B2D8E',
          light: 'rgba(123,45,142,0.12)',
        },
        magenta: {
          DEFAULT: '#D94B7A',
          light: 'rgba(217,75,122,0.12)',
        },
        indigo: {
          DEFAULT: '#5B4FC4',
          light: 'rgba(91,79,196,0.12)',
        },
        vermillion: {
          DEFAULT: '#E85D45',
          light: 'rgba(232,93,69,0.12)',
        },
        fern: {
          DEFAULT: '#6BAD5A',
          light: 'rgba(107,173,90,0.12)',
        },
        rose: {
          DEFAULT: '#F43F5E',
          light: 'rgba(244,63,94,0.12)',
        },

        // Legacy aliases (for gradual migration)
        charcoal: '#020203',
        midnight: '#141416',
        coral: {
          DEFAULT: '#d95927',
          light: 'rgba(217,89,39,0.12)',
          dark: '#b74820',
        },
        cream: '#f5f4f0',
        'warm-white': '#FFFFFF',
        sand: '#E4E4E7',
        stone: '#71717A',
        sage: {
          DEFAULT: '#009768',
          light: 'rgba(0,151,104,0.12)',
        },

        // Category identity
        category: {
          music: '#008bd2',
          arts: '#008e91',
          food: '#d95927',
          family: '#e7b746',
          sports: '#E85D45',
          community: '#D94B7A',
          nightlife: '#7B2D8E',
          classes: '#009768',
          festivals: '#d48700',
          workshops: '#5B4FC4',
          markets: '#ace671',
          talks: '#008bd2',
          outdoors: '#6BAD5A',
          charity: '#D94B7A',
          holiday: '#e7b746',
        },
      },

      // ==========================================
      // TYPOGRAPHY — Plus Jakarta Sans only
      // ==========================================
      fontFamily: {
        display: ['var(--font-body)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        'hero': ['4.5rem', { lineHeight: '1', fontWeight: '800', letterSpacing: '-0.03em' }],
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'h2': ['1.75rem', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.01em' }],
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.02em' }],
        'stat': ['4rem', { lineHeight: '1', fontWeight: '800', letterSpacing: '-0.03em' }],
      },

      // ==========================================
      // SPACING
      // ==========================================
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },

      // ==========================================
      // BORDER RADIUS — generous, friendly
      // ==========================================
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        'full': '9999px',
      },

      // ==========================================
      // BOX SHADOWS — neutral, not warm
      // ==========================================
      boxShadow: {
        'sm': '0 1px 3px rgba(0,0,0,0.06)',
        'card': '0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)',
        'card-hover': '0 12px 24px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.04)',
        'card-lifted': '0 12px 24px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.04)',
        'elevated': '0 8px 32px rgba(0,0,0,0.12)',
        'dropdown': '0 8px 32px rgba(0,0,0,0.12)',
        'modal': '0 24px 48px rgba(0,0,0,0.16)',
        // Hard-offset drop shadow — ticket-stub aesthetic signature.
        // Added 2026-04-18 for event detail redesign.
        'stub': '6px 6px 0 #020203',
        'stub-sm': '3px 3px 0 #020203',
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
        'crossfade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'crossfade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },

      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'heart-beat': 'heart-beat 0.3s ease-out',
        'crossfade-in': 'crossfade-in 0.6s ease-in-out',
        'crossfade-out': 'crossfade-out 0.6s ease-in-out',
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
