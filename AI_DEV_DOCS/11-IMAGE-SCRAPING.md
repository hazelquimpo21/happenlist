# Happenlist: Image Scraping Guide

## Overview

This document explains how to properly extract image URLs when scraping events from external sources. Incorrect image URL extraction is a common source of errors.

---

## The Problem

The **main issue**: Scrapers often store **page URLs** instead of **actual image URLs**:

| ❌ Wrong (Page URL) | ✅ Correct (Image URL) |
|---------------------|------------------------|
| `https://www.instagram.com/p/DS3baVOjgCp/` | `https://scontent.cdninstagram.com/v/...jpg` |
| `https://www.eventbrite.com/e/event-123` | `https://img.evbuc.com/https%3A%2F%2F...` |
| `https://www.facebook.com/events/123` | `https://scontent.xx.fbcdn.net/v/...jpg` |

Page URLs return HTML, which causes Next.js Image optimization to fail with 400 errors.

---

## How to Extract Correct Image URLs

### 1. Instagram Posts

Instagram doesn't allow direct image access. Use these approaches:

```javascript
// Option A: Look for og:image meta tag (works on public posts)
const getInstagramImage = (html) => {
  const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (ogMatch) return ogMatch[1];
  
  // Option B: Look in the page's JSON data
  const jsonMatch = html.match(/"display_url":"([^"]+)"/);
  if (jsonMatch) return jsonMatch[1].replace(/\\u0026/g, '&');
  
  return null;
};

// The resulting URL should look like:
// https://scontent.cdninstagram.com/v/t51.2885-15/...jpg
```

**Important**: Instagram CDN URLs expire! Consider downloading and re-hosting images.

### 2. Eventbrite

```javascript
const getEventbriteImage = (html) => {
  // Look for og:image
  const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (ogMatch) return ogMatch[1];
  
  // Look for event-card-image
  const imgMatch = html.match(/img\.evbuc\.com[^"'\s]+/);
  if (imgMatch) return 'https://' + imgMatch[0];
  
  // Look in structured data
  const jsonLd = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  if (jsonLd) {
    try {
      const data = JSON.parse(jsonLd[1]);
      if (data.image) return Array.isArray(data.image) ? data.image[0] : data.image;
    } catch {}
  }
  
  return null;
};

// Valid Eventbrite image URLs look like:
// https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F...
```

### 3. Facebook Events

```javascript
const getFacebookImage = (html) => {
  // og:image is usually the best source
  const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (ogMatch) return ogMatch[1];
  
  // Look for CDN patterns
  const cdnMatch = html.match(/https:\/\/scontent[^"'\s]+\.(?:jpg|jpeg|png|webp)/i);
  if (cdnMatch) return cdnMatch[0];
  
  return null;
};

// Valid Facebook image URLs look like:
// https://scontent.xx.fbcdn.net/v/t39.30808-6/...jpg
```

### 4. Generic Approach (Works for Most Sites)

```javascript
const extractBestImage = (html, pageUrl) => {
  // Priority order:
  // 1. og:image (Open Graph - used for social sharing, usually best quality)
  // 2. twitter:image
  // 3. Schema.org image in JSON-LD
  // 4. First large image in content
  
  // 1. Open Graph
  const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (ogMatch && isValidImageUrl(ogMatch[1])) return ogMatch[1];
  
  // 2. Twitter Card
  const twitterMatch = html.match(/<meta name="twitter:image" content="([^"]+)"/);
  if (twitterMatch && isValidImageUrl(twitterMatch[1])) return twitterMatch[1];
  
  // 3. JSON-LD Schema
  const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const image = data.image || data.thumbnailUrl;
      if (image) {
        const url = Array.isArray(image) ? image[0] : (typeof image === 'string' ? image : image.url);
        if (isValidImageUrl(url)) return url;
      }
    } catch {}
  }
  
  // 4. Large image in content (fallback)
  const imgMatches = html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi);
  for (const match of imgMatches) {
    const src = match[1];
    // Skip small images, icons, logos
    if (src.includes('logo') || src.includes('icon') || src.includes('avatar')) continue;
    if (isValidImageUrl(src)) return resolveUrl(src, pageUrl);
  }
  
  return null;
};

// Helper: Check if URL looks like an image
const isValidImageUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  
  // Must not be a page URL
  if (lower.includes('/p/') && lower.includes('instagram.com')) return false;
  if (lower.includes('/e/') && lower.includes('eventbrite.com')) return false;
  if (lower.includes('/events/') && lower.includes('facebook.com')) return false;
  
  // Should have image extension or be from known CDN
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
  const imageCdns = ['img.evbuc.com', 'scontent', 'fbcdn.net', 'cdninstagram.com', 'cloudinary.com'];
  
  return imageExtensions.some(ext => lower.includes(ext)) ||
         imageCdns.some(cdn => lower.includes(cdn));
};

// Helper: Resolve relative URLs
const resolveUrl = (src, baseUrl) => {
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return src;
  }
};
```

---

## Chrome Extension Integration

### When Scraping, Store Both Raw and Validated URLs

```javascript
// In your Chrome extension scraper:
const scrapedData = {
  title: extractTitle(document),
  // ...other fields...
  
  // Store the raw URL for reference
  raw_image_url: document.querySelector('meta[property="og:image"]')?.content,
  
  // Validate before setting image_url
  image_url: validateAndGetImageUrl(document),
};

const validateAndGetImageUrl = (doc) => {
  const candidates = [
    doc.querySelector('meta[property="og:image"]')?.content,
    doc.querySelector('meta[name="twitter:image"]')?.content,
    extractFromJsonLd(doc),
    findLargeContentImage(doc),
  ];
  
  for (const url of candidates) {
    if (url && isValidImageUrl(url)) {
      return url;
    }
  }
  
  return null; // No valid image found
};
```

### Send to Happenlist API

```javascript
// When posting to the Happenlist API:
const eventPayload = {
  title: scrapedData.title,
  start_datetime: scrapedData.start_datetime,
  // ...
  
  // Only set image_url if it's a valid image URL
  image_url: scrapedData.image_url,
  
  // Always store the raw URL for debugging
  raw_image_url: scrapedData.raw_image_url,
  
  // Store full scraped data for reference
  scraped_data: JSON.stringify(scrapedData),
};
```

---

## Image URL Validation Patterns

### ✅ Valid Image URL Patterns

These URLs are likely to be actual images:

```
# Direct image files
https://example.com/images/event.jpg
https://cdn.example.com/uploads/photo.png

# Known image CDNs
https://img.evbuc.com/...
https://scontent.cdninstagram.com/...
https://scontent.xx.fbcdn.net/...
https://res.cloudinary.com/...
https://images.unsplash.com/...
https://i.imgur.com/...

# Image with resize params
https://example.com/image?w=800&h=600
https://cdn.example.com/photo?format=webp
```

### ❌ Invalid (Page) URL Patterns

These URLs return HTML, not images:

```
# Social media post pages
https://www.instagram.com/p/ABC123/
https://www.instagram.com/username/
https://www.facebook.com/events/123456789/

# Event platform pages
https://www.eventbrite.com/e/event-name-tickets-123456789
https://www.meetup.com/group-name/events/123456789/
https://dice.fm/event/abcdef-event-name

# Ticket pages
https://www.ticketmaster.com/event-name-tickets/123456
```

---

## Best Practices

### 1. Always Validate Before Storing

```javascript
// Don't do this:
event.image_url = pageUrl; // ❌

// Do this:
const imageUrl = extractImageFromPage(pageHtml);
if (isValidImageUrl(imageUrl)) {
  event.image_url = imageUrl; // ✅
} else {
  event.image_url = null;
  event.raw_image_url = imageUrl; // Store for debugging
}
```

### 2. Handle Expiring CDN URLs

Instagram and Facebook CDN URLs expire. Consider:

1. **Download and re-host** to Supabase Storage
2. **Set a refresh schedule** to update expired images
3. **Have a fallback** placeholder for expired images

### 3. Log Validation Failures

```javascript
if (!isValidImageUrl(url)) {
  console.warn(`Invalid image URL scraped: ${url}`);
  // Store in image_validation_notes for admin review
}
```

### 4. Test Your Scraper

```javascript
// Test that scraped image URLs actually return images
const testImageUrl = async (url) => {
  const response = await fetch(url, { method: 'HEAD' });
  const contentType = response.headers.get('content-type');
  return contentType?.startsWith('image/');
};
```

---

## Happenlist Image Utilities

The app includes utilities in `src/lib/utils/image.ts`:

```typescript
import { 
  isValidImageUrl, 
  getSafeImageUrl, 
  getBestImageUrl,
  getImageUrlIssue 
} from '@/lib/utils';

// Check if URL is a valid image
isValidImageUrl('https://img.evbuc.com/...'); // true
isValidImageUrl('https://www.eventbrite.com/e/...'); // false

// Get safe URL (returns null if invalid)
getSafeImageUrl('https://www.instagram.com/p/ABC/'); // null

// Get best image from multiple candidates
getBestImageUrl(thumbnail_url, image_url, flyer_url);

// Debug why a URL is invalid
getImageUrlIssue('https://www.instagram.com/p/ABC/'); 
// "Instagram post page (not image)"
```

---

## Database Schema

Events have these image-related fields:

| Field | Purpose |
|-------|---------|
| `image_url` | Validated image URL (use for display) |
| `thumbnail_url` | Validated thumbnail URL |
| `flyer_url` | Event flyer/poster URL |
| `raw_image_url` | Original scraped URL (for debugging) |
| `raw_thumbnail_url` | Original scraped thumbnail |
| `image_validated` | Whether URL has been verified |
| `image_validation_notes` | Debug notes |

The scraper should:
1. Store raw URLs in `raw_image_url` and `raw_thumbnail_url`
2. Only set `image_url` if it passes validation
3. The admin can manually fix invalid URLs in the review process

