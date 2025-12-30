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
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
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
