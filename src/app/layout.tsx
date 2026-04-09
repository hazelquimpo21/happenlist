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
        {/* Skip to content — visible only on keyboard focus */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-blue focus:text-pure focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>

        {/* Auth Provider - Wraps entire app for auth state */}
        <AuthProvider>
          {/* Site Header */}
          <Header />

          {/* Main Content */}
          <main id="main-content" className="flex-1">{children}</main>

          {/* Site Footer */}
          <Footer />

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
