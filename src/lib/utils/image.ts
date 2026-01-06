/**
 * IMAGE URL UTILITIES
 * ====================
 * Utilities for validating and handling image URLs.
 * Helps prevent errors when scraped URLs are page URLs instead of actual images.
 */

/**
 * Known image file extensions
 */
const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.bmp', '.ico',
];

/**
 * Known image CDN/hosting patterns that serve images even without extensions
 */
const IMAGE_CDN_PATTERNS = [
  // Instagram/Facebook CDN
  /scontent.*\.cdninstagram\.com/i,
  /scontent.*\.fbcdn\.net/i,
  /.*\.fbcdn\.net.*\.(jpg|jpeg|png|gif|webp)/i,
  
  // Eventbrite
  /img\.evbuc\.com/i,
  /cdn\.evbuc\.com.*\/images\//i,
  
  // Cloudinary
  /res\.cloudinary\.com/i,
  
  // Imgix
  /.*\.imgix\.net/i,
  
  // Unsplash
  /images\.unsplash\.com/i,
  
  // AWS S3 image buckets (common pattern)
  /s3\..*\.amazonaws\.com.*\.(jpg|jpeg|png|gif|webp)/i,
  
  // Supabase Storage
  /supabase\.co\/storage\/v1\/object/i,
  /supabase\.in\/storage\/v1\/object/i,
  
  // Generic image path patterns
  /\/images?\//i,
  /\/photos?\//i,
  /\/media\//i,
  /\/uploads?\//i,
  /\/assets?\/.*\.(jpg|jpeg|png|gif|webp)/i,
  
  // Ticketmaster
  /.*\.ticketmaster\.com.*\/dam\//i,
  /s1\.ticketm\.net/i,
  
  // Dice.fm
  /dice\.fm.*\/images\//i,
  
  // Resident Advisor
  /ra\.co.*\/images\//i,
  
  // Meetup
  /secure\.meetupstatic\.com/i,
];

/**
 * Known page URL patterns that should NOT be used as images
 */
const PAGE_URL_PATTERNS = [
  // Social media post/profile pages (NOT image CDNs)
  /^https?:\/\/(www\.)?instagram\.com\/p\//i,       // Instagram posts
  /^https?:\/\/(www\.)?instagram\.com\/[^\/]+\/?$/i, // Instagram profiles
  /^https?:\/\/(www\.)?facebook\.com\/events\//i,    // Facebook events
  /^https?:\/\/(www\.)?facebook\.com\/[^\/]+\/posts/i, // Facebook posts
  
  // Event platform pages (NOT image URLs)
  /^https?:\/\/(www\.)?eventbrite\.com\/e\//i,      // Eventbrite event pages
  /^https?:\/\/(www\.)?meetup\.com\/[^\/]+\/events/i, // Meetup event pages
  /^https?:\/\/(www\.)?dice\.fm\/event\//i,         // Dice.fm event pages
  /^https?:\/\/(www\.)?ra\.co\/events\//i,          // Resident Advisor events
  
  // Ticket platforms
  /^https?:\/\/(www\.)?ticketmaster\.com\/[^\/]+-tickets/i,
  /^https?:\/\/(www\.)?axs\.com\/events\//i,
  /^https?:\/\/(www\.)?seetickets\.com\/event\//i,
];

/**
 * Checks if a URL is likely a valid image URL (not a page URL)
 * 
 * @param url - The URL to validate
 * @returns true if the URL appears to be an image, false otherwise
 * 
 * @example
 * isValidImageUrl('https://img.evbuc.com/image.jpg') // true
 * isValidImageUrl('https://www.eventbrite.com/e/event-123') // false
 * isValidImageUrl('https://www.instagram.com/p/ABC123/') // false
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    const lowercaseUrl = url.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    
    // First, check if it matches known PAGE patterns (reject these)
    for (const pattern of PAGE_URL_PATTERNS) {
      if (pattern.test(url)) {
        return false;
      }
    }
    
    // Check if URL ends with known image extension
    for (const ext of IMAGE_EXTENSIONS) {
      if (pathname.endsWith(ext)) {
        return true;
      }
    }
    
    // Check against known image CDN patterns
    for (const pattern of IMAGE_CDN_PATTERNS) {
      if (pattern.test(url)) {
        return true;
      }
    }
    
    // Check if URL has image-related query params (common for CDNs)
    const hasImageParams = 
      parsed.searchParams.has('w') || 
      parsed.searchParams.has('h') ||
      parsed.searchParams.has('width') ||
      parsed.searchParams.has('height') ||
      parsed.searchParams.has('format') ||
      parsed.searchParams.has('fit') ||
      parsed.searchParams.has('crop');
    
    if (hasImageParams) {
      return true;
    }
    
    // Default: be conservative - if we're not sure, don't use it
    return false;
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Gets a safe image URL that won't cause Next.js Image errors
 * Returns null if the URL is not a valid image URL
 * 
 * @param url - The URL to validate
 * @returns The URL if valid, null otherwise
 * 
 * @example
 * getSafeImageUrl('https://img.evbuc.com/image.jpg') // 'https://img.evbuc.com/image.jpg'
 * getSafeImageUrl('https://www.eventbrite.com/e/123') // null
 */
export function getSafeImageUrl(url: string | null | undefined): string | null {
  if (isValidImageUrl(url)) {
    return url!;
  }
  return null;
}

/**
 * Gets the best available image URL from multiple sources
 * Validates each URL and returns the first valid one
 * 
 * @param urls - Array of potential image URLs in order of preference
 * @returns The first valid image URL, or null if none are valid
 * 
 * @example
 * getBestImageUrl([event.thumbnail_url, event.image_url, event.flyer_url])
 */
export function getBestImageUrl(...urls: (string | null | undefined)[]): string | null {
  for (const url of urls) {
    const safeUrl = getSafeImageUrl(url);
    if (safeUrl) {
      return safeUrl;
    }
  }
  return null;
}

/**
 * Extracts the likely image URL from Open Graph or meta tags in raw HTML/data
 * Useful for processing scraped content
 * 
 * @param data - Object containing potential image fields from scraping
 * @returns The best image URL found, or null
 */
export function extractImageFromScrapedData(data: {
  og_image?: string;
  meta_image?: string;
  twitter_image?: string;
  image_url?: string;
  thumbnail_url?: string;
  [key: string]: unknown;
}): string | null {
  // Priority order for scraped image sources
  const candidates = [
    data.og_image,        // Open Graph image (usually the best)
    data.twitter_image,   // Twitter card image
    data.meta_image,      // Generic meta image
    data.image_url,       // Direct image URL
    data.thumbnail_url,   // Thumbnail
  ];
  
  return getBestImageUrl(...candidates);
}

/**
 * Categorizes why an image URL is invalid (for debugging)
 * 
 * @param url - The URL to analyze
 * @returns A reason string explaining why the URL is invalid
 */
export function getImageUrlIssue(url: string | null | undefined): string | null {
  if (!url) return 'No URL provided';
  
  try {
    new URL(url);
  } catch {
    return 'Invalid URL format';
  }
  
  for (const pattern of PAGE_URL_PATTERNS) {
    if (pattern.test(url)) {
      if (url.includes('instagram.com/p/')) return 'Instagram post page (not image)';
      if (url.includes('instagram.com')) return 'Instagram profile page (not image)';
      if (url.includes('eventbrite.com/e/')) return 'Eventbrite event page (not image)';
      if (url.includes('facebook.com/events')) return 'Facebook event page (not image)';
      if (url.includes('meetup.com')) return 'Meetup event page (not image)';
      return 'Page URL (not image)';
    }
  }
  
  if (isValidImageUrl(url)) {
    return null; // No issue
  }
  
  return 'Unknown URL pattern - cannot verify if image';
}




