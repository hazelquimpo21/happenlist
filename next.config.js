/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================================================
  // 📦 HAPPENLIST - Next.js Configuration
  // ============================================================================
  // This file configures Next.js behavior for the Happenlist application.
  // Learn more: https://nextjs.org/docs/app/api-reference/next-config-js
  // ============================================================================

  // Allow images from Supabase storage and other trusted sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Strict mode helps catch bugs early
  reactStrictMode: true,

  // Log build info for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

module.exports = nextConfig
