# 📝 Scraper Update: New Event Description Fields

> **Purpose**: Guide for updating the Chrome extension scraper to populate new event description fields
> **Created**: 2026-01-04
> **Status**: Ready for Implementation

---

## Overview

We've added new fields to the `events` table to support richer, multi-perspective event descriptions. The scraper should now extract and populate these additional fields when available.

---

## New Database Fields

### 1. `happenlist_summary` (TEXT, nullable)

**Purpose**: An editorial summary written from Happenlist's perspective as a third party, highlighting key details and what makes the event interesting.

**Characteristics**:
- Written in third person ("This event features..." not "We present...")
- Highlights the most interesting/unique aspects
- Concise but informative (2-4 sentences ideal)
- Can mention who the event is best suited for
- Should feel editorial/curated, not promotional

**When to populate**:
- AI-generated summary based on scraped content
- Could be generated during scraping or as a post-processing step
- Leave null if not generating summaries

**Example**:
```
A rare chance to experience live jazz in an intimate lakefront setting. 
The Milwaukee Jazz Collective brings together award-winning local musicians 
for an evening under the stars. Perfect for date night or a relaxed evening 
with friends. Expect smooth standards and original compositions.
```

---

### 2. `organizer_description` (TEXT, nullable)

**Purpose**: The verbatim description from the event organizer/source, preserved exactly as written.

**Characteristics**:
- Exact copy from the source (no editing)
- May include the organizer's voice/branding
- Can be longer and more detailed
- Preserves original formatting where possible

**When to populate**:
- Always try to capture this from the source
- Look for the main event description on the page
- This is typically the "About" or main description section

**Where to find it**:
- Eventbrite: Main description under event title
- Facebook Events: "Details" or "About" section
- Venue websites: Event description area
- Instagram: Caption text (if detailed enough)

**Example** (from organizer):
```
Join us for our annual Summer Jazz Series! 🎷

The Milwaukee Jazz Collective is proud to present an evening of 
smooth jazz at the beautiful Lakefront Pavilion. 

Featuring:
- Sarah Johnson on vocals
- Mike Williams on saxophone  
- The house band

Doors open at 6:30 PM. Show starts at 7:00 PM.

Food and drinks available for purchase. 21+ event.
Bring a blanket or lawn chair!

#MilwaukeeJazz #LiveMusic #SummerVibes
```

---

### 3. `short_description` (TEXT, nullable) - EXISTING FIELD

**Purpose**: A one-line summary for event cards and previews.

**Characteristics**:
- Maximum ~160 characters
- Single sentence or phrase
- Should work standalone as a teaser
- No hashtags or emojis

**Example**:
```
Live jazz under the stars at Lakefront Pavilion with the Milwaukee Jazz Collective.
```

---

### 4. `description` (TEXT, nullable) - EXISTING FIELD

**Purpose**: General event description (can be edited/cleaned version).

**Current Usage**: This may contain a cleaned or combined version of event info.

**Going forward**: You can use this for:
- A cleaned/edited version of organizer content
- Combined information from multiple sources
- Fallback when other fields aren't available

---

### 5. `price_details` (TEXT, nullable) - EXISTING FIELD

**Purpose**: Detailed pricing information, especially for complex pricing.

**When to populate**:
- Multiple ticket tiers
- Early bird vs door pricing
- Group discounts
- Age-based pricing
- Any caveats or conditions

**Examples**:
```
Early bird $15 (ends Feb 1), General $20, Door $25
```

```
Adults $25, Seniors/Students $18, Children under 12 free. 
VIP tables available for $150 (seats 4, includes bottle service).
```

```
Sliding scale $10-$25, pay what you can. No one turned away for lack of funds.
```

---

### 6. `flyer_url` (TEXT, nullable) - EXISTING FIELD

**Purpose**: URL to the event flyer/poster image (separate from hero image).

**Characteristics**:
- Should be the promotional flyer/poster if available
- Different from `image_url` (which is the main hero/banner image)
- Typically portrait orientation (like a poster)
- Often contains event details embedded in the image

**Where to find**:
- Instagram: The main post image often IS the flyer
- Facebook: Check for attached poster images
- Eventbrite: Sometimes has separate flyer uploads
- Venue sites: Look for downloadable/printable flyers

**Priority**: 
- If you find a clear flyer/poster → `flyer_url`
- If you find a hero/banner image → `image_url`
- Same image for both is OK if that's all that's available

---

## Field Mapping by Source

### From Eventbrite

| Source Location | Maps To |
|-----------------|---------|
| Main event description | `organizer_description` |
| First 1-2 sentences of description | `short_description` (truncate to 160 chars) |
| Ticket price breakdown | `price_details` |
| Hero image | `image_url` |
| Any poster/flyer attachment | `flyer_url` |

### From Facebook Events

| Source Location | Maps To |
|-----------------|---------|
| "Details" / "About" section | `organizer_description` |
| First sentence or event tagline | `short_description` |
| Ticket info text | `price_details` |
| Cover photo | `image_url` |
| Posted flyer image (if different) | `flyer_url` |

### From Instagram

| Source Location | Maps To |
|-----------------|---------|
| Caption text | `organizer_description` |
| First line of caption | `short_description` |
| Price info in caption | `price_details` |
| Post image (if it's a flyer/poster) | `flyer_url` |
| Post image (if it's a photo) | `image_url` |

### From Venue Websites

| Source Location | Maps To |
|-----------------|---------|
| Event description | `organizer_description` |
| Tagline or subtitle | `short_description` |
| Ticket/pricing section | `price_details` |
| Banner/hero image | `image_url` |
| Downloadable flyer | `flyer_url` |

---

## Scraper Logic Updates

### Extraction Priority

```javascript
// Pseudocode for field extraction

// 1. Always try to get organizer's verbatim description
const organizerDescription = extractMainDescription(page);

// 2. Generate short description from organizer description
const shortDescription = organizerDescription 
  ? truncateToSentence(organizerDescription, 160)
  : null;

// 3. Extract detailed pricing if complex
const priceDetails = extractPriceDetails(page);
// Only populate if there's MORE info than just a single price
// e.g., "Free" doesn't need price_details, but "$15-$25, early bird $12" does

// 4. Separate flyer from hero image
const { heroImage, flyerImage } = categorizeImages(extractedImages);
// If image is portrait and looks like a poster → flyer
// If image is landscape/square and looks like a photo → hero

// 5. happenlist_summary - generate if you have AI capability
const happenlistSummary = generateEditorialSummary({
  title,
  organizerDescription,
  venue,
  category,
  price
});
```

### Image Categorization Heuristics

```javascript
function categorizeImages(images) {
  let heroImage = null;
  let flyerImage = null;
  
  for (const img of images) {
    const aspectRatio = img.width / img.height;
    
    // Portrait images (aspect ratio < 0.9) are likely flyers
    if (aspectRatio < 0.9) {
      flyerImage = flyerImage || img.url;
    }
    // Landscape/square images are likely hero images
    else {
      heroImage = heroImage || img.url;
    }
  }
  
  // Fallback: if only one image, use for both
  if (!heroImage && flyerImage) heroImage = flyerImage;
  if (!flyerImage && heroImage) flyerImage = null; // Don't duplicate landscape as flyer
  
  return { heroImage, flyerImage };
}
```

---

## Image Upload Flow (IMPORTANT)

**All images must be uploaded to Supabase Storage - do NOT link to external URLs.**

### Flyer Upload Process

```javascript
async function uploadFlyerToSupabase(flyerImageUrl, eventSlug) {
  // 1. Download the image from source
  const imageBuffer = await downloadImage(flyerImageUrl);
  
  // 2. Generate storage path
  const storagePath = `events/flyers/${eventSlug}-flyer.jpg`;
  
  // 3. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('events')  // or your bucket name
    .upload(storagePath, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });
  
  if (error) throw error;
  
  // 4. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('events')
    .getPublicUrl(storagePath);
  
  return {
    flyer_url: publicUrl,           // Supabase CDN URL
    flyer_hosted: true,             // Mark as hosted
    flyer_storage_path: storagePath // Store path for future reference
  };
}
```

### Database Fields for Images

| Image Type | URL Field | Hosted Flag | Storage Path |
|------------|-----------|-------------|--------------|
| Hero image | `image_url` | `image_hosted` | `image_storage_path` |
| Flyer/poster | `flyer_url` | `flyer_hosted` | `flyer_storage_path` |
| Thumbnail | `thumbnail_url` | `thumbnail_hosted` | `thumbnail_storage_path` |

**All three should be uploaded to Supabase, not linked externally!**

---

## Updated Event Insert Object

```javascript
const eventData = {
  // Required fields
  title: extractedTitle,
  slug: generateSlug(extractedTitle),
  start_datetime: parsedStartTime,
  instance_date: parsedDate,
  
  // Description fields (NEW PRIORITY)
  organizer_description: rawDescriptionFromSource,    // Verbatim from source
  short_description: truncatedOneLiner,               // Max 160 chars
  description: cleanedDescription,                    // Cleaned/edited version
  happenlist_summary: null,                           // AI-generated (optional)
  
  // Pricing
  price_type: determinedPriceType,
  price_low: extractedPriceLow,
  price_high: extractedPriceHigh,
  price_details: complexPricingText,                  // Only if complex
  is_free: isFreeEvent,
  
  // Images - ALL UPLOADED TO SUPABASE
  image_url: uploadedHeroUrl,                         // Supabase CDN URL
  image_hosted: true,
  image_storage_path: heroStoragePath,
  
  flyer_url: uploadedFlyerUrl,                        // Supabase CDN URL  
  flyer_hosted: true,
  flyer_storage_path: flyerStoragePath,
  
  // ... other existing fields
};
```

---

## Validation Rules

### `short_description`
- Max 160 characters
- No trailing hashtags
- No emojis
- Should be a complete thought/sentence

### `organizer_description`
- Preserve original formatting (newlines, lists)
- OK to include emojis (it's verbatim)
- Remove obvious spam/SEO stuffing if present
- No max length (within reason)

### `price_details`
- Only populate if pricing is complex
- Don't duplicate simple pricing already in `price_low`/`price_high`
- Include conditions, tiers, discounts

### `flyer_url` / `flyer_hosted` / `flyer_storage_path`
- **IMPORTANT**: Flyers must be uploaded to Supabase Storage, not linked externally
- Follow the same upload pattern as `image_url`
- After upload:
  - `flyer_url` = Supabase CDN URL (e.g., `https://xxx.supabase.co/storage/v1/object/public/events/flyers/...`)
  - `flyer_hosted` = `true`
  - `flyer_storage_path` = Storage path (e.g., `events/flyers/{event-slug}-flyer.jpg`)
- Prefer portrait-oriented images (posters/flyers)

---

## Testing Checklist

After updating the scraper, verify:

**Description Fields:**
- [ ] `organizer_description` captures the full original text
- [ ] `short_description` is ≤160 characters and readable
- [ ] `price_details` only appears when there's complex pricing

**Image Hosting (CRITICAL):**
- [ ] `flyer_url` points to Supabase CDN (not external URL)
- [ ] `flyer_hosted` is `true` when flyer is uploaded
- [ ] `flyer_storage_path` contains the storage path
- [ ] `image_url` also points to Supabase CDN (not external)
- [ ] Images are actually accessible at the Supabase URLs

**Image Detection:**
- [ ] Portrait images are correctly identified as flyers
- [ ] `flyer_url` is different from `image_url` when both are available
- [ ] Landscape/square images go to `image_url`

---

## Questions?

If you need clarification on any of these fields or how they should be populated, please ask! The goal is to provide users with:

1. **Quick scan**: `short_description` (one-liner)
2. **Our take**: `happenlist_summary` (editorial highlights)
3. **Full details**: `organizer_description` (verbatim from source)
4. **General info**: `description` (cleaned/combined)
5. **Price clarity**: `price_details` (when pricing is complex)
6. **Visual appeal**: `flyer_url` + `image_url` (poster + hero)

---

**Happy scraping! 🕷️**

