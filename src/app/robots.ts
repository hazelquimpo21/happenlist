/**
 * ROBOTS.TXT GENERATOR
 * ====================
 * Controls search engine crawling behavior.
 */

import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/constants';

/**
 * Generate robots.txt rules.
 */
export default function robots(): MetadataRoute.Robots {
  console.log('🤖 [Robots] Generating robots.txt');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/my/',
          '/dashboard/',
          '/admin/',
          '/_next/',
          '/static/',
        ],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}
