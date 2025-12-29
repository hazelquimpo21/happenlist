/**
 * ROOT LAYOUT
 * ===========
 * Main application layout with header, footer, and fonts.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header, Footer } from '@/components/layout';
import { SITE_CONFIG } from '@/lib/constants';
import './globals.css';

// Load Inter font for body text
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

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

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  // Log app startup for debugging
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🎉 HAPPENLIST - Discover Local Events                   ║
  ║                                                           ║
  ║   Environment: ${process.env.NODE_ENV}                               ║
  ║   URL: ${SITE_CONFIG.url}                    ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);

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
        {/* Site Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Site Footer */}
        <Footer />
      </body>
    </html>
  );
}
