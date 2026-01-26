import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Set Turbopack root to this project directory to avoid lockfile conflicts
  turbopack: {
    root: process.cwd(),
  },

  // Configure image domains for external images
  images: {
    remotePatterns: [
      // Supabase storage
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
      // Social media and common image hosts (for scraped events)
      {
        protocol: 'https',
        hostname: 'www.instagram.com',
      },
      {
        protocol: 'https',
        hostname: 'instagram.com',
      },
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'scontent.**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '**.facebook.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.imgix.net',
      },
      // Event platforms
      {
        protocol: 'https',
        hostname: '**.eventbrite.com',
      },
      {
        protocol: 'https',
        hostname: 'img.evbuc.com',
      },
      {
        protocol: 'https',
        hostname: '**.ticketmaster.com',
      },
      // Squarespace (for scraped events)
      {
        protocol: 'https',
        hostname: '**.squarespace.com',
      },
      {
        protocol: 'http',
        hostname: '**.squarespace.com',
      },
      // General - allow any HTTPS image (useful for scraped content)
      // Note: For production, you may want to be more restrictive
      {
        protocol: 'https',
        hostname: '**',
      },
      // Allow HTTP images as fallback (some external sources don't use HTTPS)
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  // Logging configuration for better debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
