# Happenlist: Image Scraping & Hosting Guide

## Overview

This document explains how to properly handle images when scraping events:
1. **Extract** the correct image URL (not the page URL)
2. **Upload** the image to Supabase Storage (re-host it)
3. **Store** the hosted URL in the database

**Why re-host images?**
- External CDN URLs (Instagram, Facebook) expire after hours/days
- Original source can delete the image
- More reliable display with permanent URLs
- Better performance with Next.js Image optimization

---

## Quick Start: Chrome Extension Integration

```javascript
// After scraping an event, upload the image to Happenlist's storage:
const uploadImage = async (eventId, imageUrl) => {
  const response = await fetch('https://your-happenlist.com/api/images/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_SCRAPER_API_SECRET',
    },
    body: JSON.stringify({
      eventId,
      sourceUrl: imageUrl, // The actual image URL (not page URL!)
      type: 'hero',
    }),
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Use this URL in the event data
    return result.url; // https://your-supabase.../storage/.../image.jpg
  }
  
  return null;
};

// Usage in your scraper:
const event = {
  title: '...',
  // ... other fields
};

// 1. Extract the OG image (actual image URL)
const ogImage = document.querySelector('meta[property="og:image"]')?.content;

// 2. Upload to Supabase Storage
const hostedImageUrl = await uploadImage(event.id, ogImage);

// 3. Use the hosted URL
event.image_url = hostedImageUrl;
event.image_hosted = true;
```

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
| **Hero Image** | |
| `image_url` | Validated/hosted image URL (use for display) |
| `image_hosted` | Whether image is in our Supabase Storage |
| `image_storage_path` | Path in storage bucket (for deletion) |
| `raw_image_url` | Original scraped URL (for debugging) |
| `image_validated` | Whether URL has been verified |
| **Flyer/Poster** | |
| `flyer_url` | Event flyer/poster URL (**must be Supabase hosted**) |
| `flyer_hosted` | Whether flyer is in our Supabase Storage |
| `flyer_storage_path` | Path in storage bucket |
| **Thumbnail** | |
| `thumbnail_url` | Validated thumbnail URL |
| `thumbnail_hosted` | Whether thumbnail is hosted |
| `thumbnail_storage_path` | Path in storage bucket |
| `raw_thumbnail_url` | Original scraped thumbnail |

### ⚠️ Important: All Images Must Be Hosted

**Do NOT store external URLs** for any image type. All images must be:
1. Downloaded from source
2. Uploaded to Supabase Storage
3. Stored with Supabase CDN URL

This ensures images don't expire or break when external sources change.

---

## Image Upload API

### Endpoint

```
POST /api/images/upload
```

### Authentication

```
Authorization: Bearer YOUR_SCRAPER_API_SECRET
```

Set `SCRAPER_API_SECRET` in your environment variables.

### Request Body

**Option 1: Re-host from URL**

```json
{
  "eventId": "abc-123-def",
  "sourceUrl": "https://img.evbuc.com/actual-image.jpg",
  "type": "hero"
}
```

**Option 2: Upload Base64 directly**

```json
{
  "eventId": "abc-123-def",
  "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "type": "thumbnail"
}
```

### Response

```json
{
  "success": true,
  "url": "https://your-project.supabase.co/storage/v1/object/public/event-images/events/abc-123/hero_123456_abcdef.jpg",
  "path": "events/abc-123/hero_123456_abcdef.jpg"
}
```

### Type Options

| Type | Description |
|------|-------------|
| `hero` | Main event image (default) |
| `thumbnail` | Small card thumbnail |
| `flyer` | Event flyer/poster |

---

## Complete Chrome Extension Example

```javascript
// config.js
const HAPPENLIST_API = 'https://your-happenlist.com/api';
const API_SECRET = 'your-secret-key';

// imageUploader.js
class ImageUploader {
  async upload(eventId, imageUrl, type = 'hero') {
    // Skip if already hosted
    if (imageUrl?.includes('supabase.co/storage')) {
      return { success: true, url: imageUrl, alreadyHosted: true };
    }
    
    // Validate URL first
    if (!this.isValidImageUrl(imageUrl)) {
      console.warn('Invalid image URL:', imageUrl);
      return { success: false, error: 'Invalid image URL' };
    }
    
    try {
      const response = await fetch(`${HAPPENLIST_API}/images/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_SECRET}`,
        },
        body: JSON.stringify({ eventId, sourceUrl: imageUrl, type }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Upload failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  isValidImageUrl(url) {
    if (!url) return false;
    
    // Reject page URLs
    const pagePatterns = [
      /instagram\.com\/p\//,
      /eventbrite\.com\/e\//,
      /facebook\.com\/events\//,
    ];
    
    if (pagePatterns.some(p => p.test(url))) return false;
    
    // Accept known image patterns
    const imagePatterns = [
      /\.(jpg|jpeg|png|gif|webp)/i,
      /img\.evbuc\.com/,
      /scontent.*\.(cdn)?instagram\.com/,
      /fbcdn\.net/,
    ];
    
    return imagePatterns.some(p => p.test(url));
  }
}

// scraper.js
async function scrapeAndUploadEvent(document) {
  const uploader = new ImageUploader();
  
  // Extract event data
  const event = {
    title: document.querySelector('h1')?.textContent,
    // ... other fields
  };
  
  // Save the event first to get an ID
  const savedEvent = await saveEventToDB(event);
  
  // Extract and upload images
  const ogImage = document.querySelector('meta[property="og:image"]')?.content;
  
  if (ogImage) {
    const result = await uploader.upload(savedEvent.id, ogImage, 'hero');
    
    if (result.success) {
      // Update event with hosted image URL
      await updateEvent(savedEvent.id, {
        image_url: result.url,
        image_hosted: true,
        raw_image_url: ogImage, // Keep original for reference
      });
    }
  }
  
  return savedEvent;
}
```

---

## Setup Checklist

### 1. Create Supabase Storage Bucket

In Supabase Dashboard:
1. Go to **Storage** > **New Bucket**
2. Name: `event-images`
3. Check **Public bucket**
4. Click Create

### 2. Run SQL Migration

```bash
# In SQL Editor, run:
# supabase/migrations/00004_storage_bucket.sql
```

### 3. Set Environment Variable

```bash
# .env.local
SCRAPER_API_SECRET=your-secure-random-string-here

# Generate a secure secret:
openssl rand -base64 32
```

### 4. Update Chrome Extension

Configure your extension to:
1. Extract og:image (not page URL)
2. Call `/api/images/upload` with the image URL
3. Use the returned hosted URL

---

## Troubleshooting

### "Invalid source URL - does not appear to be an image URL"

You're passing a page URL instead of an image URL:
- ❌ `https://www.instagram.com/p/ABC123/`
- ✅ `https://scontent.cdninstagram.com/v/t51.2885-15/...jpg`

Extract the `og:image` meta tag instead of the page URL.

### "Failed to download image from source"

The image URL might be:
- Expired (Instagram/Facebook CDN URLs expire)
- Blocked by CORS
- Requiring authentication

Solution: Capture the image as base64 in your extension and upload directly.

### Images not displaying

Check if `image_hosted = true` in the database. If false, the image may still be an external URL that has expired.

