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
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { Header, Footer } from '@/components/layout';
import { SITE_CONFIG } from '@/lib/constants';
import './globals.css';

// ============================================================================
// FONTS
// ============================================================================

// Load Inter font for body text
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
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
    <html lang="en" className={inter.variable}>
      <head>
        {/* Google Fonts - Fraunces for display text */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Auth Provider - Wraps entire app for auth state */}
        <AuthProvider>
          {/* Site Header */}
          <Header />

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Site Footer */}
          <Footer />

          {/* Toast Notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              className: 'font-body',
              style: {
                background: 'white',
                border: '1px solid hsl(var(--sand))',
                borderRadius: '12px',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
