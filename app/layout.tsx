// ============================================================================
// 🏠 HAPPENLIST - Root Layout
// ============================================================================
// This is the root layout that wraps all pages in the application.
// It sets up fonts, metadata, and global providers.
// ============================================================================

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// ============================================================================
// 🔤 Font Configuration
// ============================================================================
// Using Inter font for clean, modern typography.
// The font is loaded from Google Fonts and optimized by Next.js.
// ============================================================================

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

// ============================================================================
// 📋 Metadata Configuration
// ============================================================================
// Default metadata for the site. Individual pages can override these values.
// This helps with SEO and social sharing.
// ============================================================================

export const metadata: Metadata = {
  title: {
    default: 'Happenlist - Discover Milwaukee Events',
    template: '%s | Happenlist',
  },
  description:
    "Milwaukee's go-to events directory. Discover concerts, festivals, family activities, and more happening in your city.",
  keywords: [
    'Milwaukee events',
    'things to do Milwaukee',
    'Milwaukee concerts',
    'Milwaukee festivals',
    'Milwaukee activities',
  ],
  authors: [{ name: 'Happenlist' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Happenlist',
    title: 'Happenlist - Discover Milwaukee Events',
    description:
      "Milwaukee's go-to events directory. Discover concerts, festivals, family activities, and more.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Happenlist - Discover Milwaukee Events',
    description:
      "Milwaukee's go-to events directory. Discover concerts, festivals, family activities, and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

// ============================================================================
// 🎨 Root Layout Component
// ============================================================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
