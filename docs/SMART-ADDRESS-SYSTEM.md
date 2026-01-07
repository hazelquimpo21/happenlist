# 🗺️ Smart Address System

> Complete guide to the venue search, address autocomplete, and mapping features.

---

## Overview

The Smart Address System powers venue selection in Happenlist with:
- **3500+ pre-loaded venues** from Milwaukee area
- **Fuzzy search** with typo tolerance
- **Address autocomplete** via Mapbox for new venues
- **Interactive maps** for venue display
- **Coordinates** for directions and future features

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SMART ADDRESS SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 4: LOCATION (Event Submission Form)                            │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  Existing   │  │    New      │  │   Online    │  │    TBD      │  │   │
│  │  │   Venue     │  │   Venue     │  │   Event     │  │  Location   │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └─────────────┘  └─────────────┘  │   │
│  │         │                │                                            │   │
│  │         ▼                ▼                                            │   │
│  │  ┌─────────────┐  ┌─────────────┐                                    │   │
│  │  │ Venue       │  │  Address    │                                    │   │
│  │  │ Search      │  │ Autocomplete│                                    │   │
│  │  └──────┬──────┘  └──────┬──────┘                                    │   │
│  │         │                │                                            │   │
│  └─────────┼────────────────┼────────────────────────────────────────────┘   │
│            │                │                                                │
│            ▼                ▼                                                │
│  ┌─────────────────┐  ┌─────────────────┐                                   │
│  │   Supabase      │  │   Mapbox        │                                   │
│  │  (3500+ venues) │  │ (Geocoding API) │                                   │
│  └─────────────────┘  └─────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Run the SQL Migration

```bash
# In Supabase Dashboard > SQL Editor
# Paste and run: supabase/migrations/20260107_venue_import_system.sql
```

### 2. Set Environment Variables

Add to `.env.local`:
```env
# Mapbox (get token from https://account.mapbox.com)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoixxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 3. Install Mapbox

```bash
npm install mapbox-gl
```

### 4. Import Venues (Optional but Recommended)

```bash
# Set service role key for bulk inserts
export SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."

# Test with a few venues
npx tsx scripts/venue-import/run-import.ts --dry-run --limit=10

# Full import
npx tsx scripts/venue-import/run-import.ts
```

---

## Components

### VenueMap

Interactive map showing a single venue location.

```tsx
import { VenueMap } from '@/components/maps';

<VenueMap
  latitude={43.0389}
  longitude={-87.9065}
  venueName="The Pabst Theater"
  venueType="entertainment"
  showDirections={true}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `latitude` | `number` | required | Venue latitude |
| `longitude` | `number` | required | Venue longitude |
| `venueName` | `string` | required | Venue name for popup |
| `address` | `string` | - | Address for directions |
| `venueType` | `string` | `'venue'` | For marker color |
| `height` | `string` | `'300px'` | Map height |
| `showDirections` | `boolean` | `true` | Show directions button |
| `zoom` | `number` | `15` | Initial zoom level |

### AddressSearch

Mapbox-powered address autocomplete.

```tsx
import { AddressSearch } from '@/components/maps';

<AddressSearch
  onSelect={(result) => {
    console.log(result.street);      // "123 Main St"
    console.log(result.city);        // "Milwaukee"
    console.log(result.coordinates); // { lat, lng }
  }}
  placeholder="Search for an address..."
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSelect` | `(result: AddressResult) => void` | required | Selection callback |
| `initialValue` | `string` | `''` | Initial input value |
| `placeholder` | `string` | `'Search...'` | Input placeholder |
| `disabled` | `boolean` | `false` | Disable input |

**AddressResult:**
```typescript
interface AddressResult {
  fullAddress: string;    // "123 Main St, Milwaukee, WI 53202"
  street: string;         // "123 Main St"
  city: string;           // "Milwaukee"
  state: string;          // "WI"
  postalCode: string;     // "53202"
  country: string;        // "US"
  coordinates: {
    latitude: number;
    longitude: number;
  };
  placeName?: string;     // For POIs
}
```

### Step4Location (Enhanced)

The location step in the event submission form with smart features.

**Features:**
- Search 3500+ venues with fuzzy matching
- Popular venues quick-select
- Venue ratings and review counts
- Address autocomplete for new venues
- Coordinates captured automatically

---

## Database Schema

### New Columns (locations table)

| Column | Type | Description |
|--------|------|-------------|
| `google_place_id` | `TEXT` | Unique ID for deduplication |
| `external_image_url` | `TEXT` | External image (Google) |
| `rating` | `DECIMAL(2,1)` | Google rating (1.0-5.0) |
| `review_count` | `INTEGER` | Number of reviews |
| `working_hours` | `JSONB` | Business hours |
| `category` | `TEXT` | Google category |
| `source` | `TEXT` | Origin (csv_import, user, etc.) |
| `import_batch_id` | `TEXT` | For grouping imports |

### Indexes Added

```sql
idx_locations_google_place_id   -- Deduplication
idx_locations_rating            -- Sort by rating
idx_locations_category          -- Filter by category
idx_locations_source            -- Filter by source
idx_locations_name_search       -- Full-text search
idx_locations_name_trgm         -- Fuzzy matching
```

### search_venues() Function

```sql
SELECT * FROM search_venues('pabst theater', 20);
```

Returns venues with similarity scoring for fuzzy search.

---

## Venue Import System

### Files

```
scripts/venue-import/
├── README.md           # Import documentation
├── types.ts            # TypeScript types
├── csv-parser.ts       # CSV parsing
├── slug-generator.ts   # Unique slug generation
├── transformer.ts      # Data transformation
├── importer.ts         # Database operations
└── run-import.ts       # CLI entry point
```

### Slug Format

Slugs include city and neighborhood for SEO:
```
{venue-name}-{neighborhood}-{city}

Examples:
- the-pabst-theater-milwaukee
- coffee-shop-third-ward-milwaukee
- dog-park-west-allis
```

### Running the Import

```bash
# Test first
npx tsx scripts/venue-import/run-import.ts --dry-run --limit=10

# Full import
npx tsx scripts/venue-import/run-import.ts
```

---

## Mapbox Configuration

### Config File

```
src/lib/mapbox/config.ts
```

### Settings

| Setting | Value | Description |
|---------|-------|-------------|
| Default Center | Milwaukee | `[-87.9065, 43.0389]` |
| Map Style | Light | Clean style for cards |
| Geocoding | US only | Biased toward Milwaukee |

### Marker Colors

| Venue Type | Color |
|------------|-------|
| entertainment | Coral (#E86C5D) |
| arts | Purple (#9B59B6) |
| sports | Blue (#3498DB) |
| outdoor | Sage (#7B9E87) |
| restaurant | Orange (#F39C12) |
| community | Red (#E74C3C) |
| education | Teal (#1ABC9C) |
| venue (default) | Stone (#7A7670) |

---

## Images

### Current Approach

For now, images are handled with:
1. `external_image_url` - Google photo URLs (stored but not displayed)
2. Letter placeholder - First letter of venue name
3. Future: Download to Supabase Storage

### Why Not Use External URLs?

Google photo URLs:
- May change or expire
- Require loading from external domain
- Could have CORS issues

### Future: Image Download Script

Coming soon - a script to:
1. Download images from `external_image_url`
2. Upload to Supabase Storage
3. Update `image_url` field

---

## Cost Summary

| Service | Free Tier | Our Usage |
|---------|-----------|-----------|
| Supabase | 500MB DB | ~10MB for 3500 venues |
| Mapbox Geocoding | 100k req/mo | ~100-500/mo |
| Mapbox Maps | 50k loads/mo | ~1k-5k/mo |

**Estimated monthly cost: $0** (within free tiers)

---

## Troubleshooting

### "Address search not configured"

Set the Mapbox token:
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxx
```

### Map not loading

1. Check Mapbox token is valid
2. Check browser console for errors
3. Ensure `mapbox-gl` is installed

### Venue search returns no results

1. Check if venues were imported
2. Check Supabase for `locations` table data
3. Verify `search_venues` function exists

### Import fails with permission errors

Use the **service role key**, not anon key:
```bash
export SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
```

---

## Related Documentation

| Doc | Description |
|-----|-------------|
| [EVENTS.md](./EVENTS.md) | Event submission flow |
| [scripts/venue-import/README.md](../scripts/venue-import/README.md) | Import script details |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Overall system architecture |

---

## Commands Reference

```bash
# Install Mapbox
npm install mapbox-gl

# Run venue import (test)
npx tsx scripts/venue-import/run-import.ts --dry-run --limit=10

# Run venue import (full)
npx tsx scripts/venue-import/run-import.ts

# Check venue count
# In Supabase SQL Editor:
SELECT COUNT(*) FROM locations WHERE source = 'csv_import';
```

---

*Last updated: January 2026*
