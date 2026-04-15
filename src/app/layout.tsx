/**
 * ROOT LAYOUT
 * ===========
 * Main application layout with header, footer, fonts, and auth.
 *
 * This layout wraps the entire app with:
 * - AuthProvider for authentication state
 * - Toaster for toast notifications
 * - Header and Footer components
 */

import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { PeekProvider } from '@/contexts/peek-context';
import { PeekHost } from '@/components/events';
import { Header, Footer } from '@/components/layout';
import { SITE_CONFIG } from '@/lib/constants';
import './globals.css';

// ============================================================================
// FONTS
// ============================================================================

// Plus Jakarta Sans — single font family for entire app
// Rounded terminals = friendly, geometric structure = modern
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

// ============================================================================
// METADATA
// ============================================================================

/**
 * Root metadata for the application.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    template: '%s | Happenlist',
    default: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
  },
  description: SITE_CONFIG.description,
  keywords: [
    'events',
    'local events',
    'things to do',
    'concerts',
    'festivals',
    'Milwaukee events',
  ],
  authors: [{ name: 'Happenlist' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.defaultImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  // Log app startup for debugging (only runs on server)
  if (typeof window === 'undefined') {
    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🎉 HAPPENLIST - Discover Local Events                   ║
  ║                                                           ║
  ║   Environment: ${process.env.NODE_ENV?.padEnd(20) || 'unknown'}             ║
  ║   URL: ${SITE_CONFIG.url.padEnd(40)}     ║
  ║                                                           ║
  ║   🔐 Auth: Magic Link (Supabase)                          ║
  ║   📦 Database: Supabase PostgreSQL                        ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
    `);
  }

  return (
    <html lang="en" className={jakarta.variable}>
      <head />
      <body className="min-h-screen flex flex-col">
        {/* Skip to content — off-screen until keyboard-focused */}
        <a
          href="#main-content"
          className="absolute -top-full left-4 z-[100] bg-blue text-pure px-4 py-2 rounded-lg font-semibold shadow-lg focus:top-4 transition-[top]"
        >
          Skip to main content
        </a>

        {/* Auth Provider - Wraps entire app for auth state */}
        <AuthProvider>
          {/* Peek Provider — controls the event peek sheet. Any child
              can call usePeek() to open/close. See peek-context.tsx. */}
          <PeekProvider>
            {/* Site Header */}
            <Header />

            {/* Main Content */}
            <main id="main-content" className="flex-1">{children}</main>

            {/* Event Peek modal host — mounted at root so any EventCard
                click can open a peek sheet overlay. URL is pushStated to
                /event/[slug] while the peek is open so back button closes. */}
            <PeekHost />

            {/* Site Footer */}
            <Footer />
          </PeekProvider>

          {/* Toast Notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              className: 'font-body',
              style: {
                background: '#FFFFFF',
                border: '1px solid #E4E4E7',
                borderRadius: '12px',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
