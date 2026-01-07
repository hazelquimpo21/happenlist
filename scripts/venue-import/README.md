# 🏛️ Venue Import System

> Bulk import venues from Google Maps CSV exports into Happenlist.

---

## Quick Start

```bash
# 1. Set environment variables
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."

# 2. Run the SQL migration first (in Supabase Dashboard)
# File: supabase/migrations/20260107_venue_import_system.sql

# 3. Test with a few venues (dry run)
npx tsx scripts/venue-import/run-import.ts --dry-run --limit=10

# 4. Run the full import
npx tsx scripts/venue-import/run-import.ts
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VENUE IMPORT FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CSV File                                                                   │
│   (Milwaukee Venues Happenlist.csv)                                         │
│        │                                                                     │
│        ▼                                                                     │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │ CSV Parser  │ ──► │ Transformer │ ──► │  Importer   │ ──► Database     │
│   └─────────────┘     └─────────────┘     └─────────────┘                   │
│        │                     │                   │                          │
│        │                     │                   │                          │
│   Validates rows        Generates slugs     Batch inserts                   │
│   Handles quotes        Cleans data         Deduplicates                    │
│   Reports errors        Maps fields         Tracks progress                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
scripts/venue-import/
├── README.md           # This file
├── types.ts            # TypeScript type definitions
├── csv-parser.ts       # Parses CSV file into typed rows
├── slug-generator.ts   # Generates unique URL slugs
├── transformer.ts      # Transforms CSV rows to database records
├── importer.ts         # Handles database operations
└── run-import.ts       # Main entry point (CLI)
```

---

## Module Responsibilities

### `types.ts`
Defines TypeScript types for the import pipeline:
- `CsvRow` - Raw row from CSV file
- `VenueRecord` - Cleaned record for database
- `ImportResult` - Result of import operation
- `ImportSummary` - Summary of entire batch

### `csv-parser.ts`
Parses the CSV file:
- Handles quoted fields with commas
- Validates required fields (name, city)
- Reports invalid rows

### `slug-generator.ts`
Generates unique, SEO-friendly slugs:
- Format: `venue-name-neighborhood-city`
- Handles duplicates with numeric suffixes
- Tracks used slugs across batch

### `transformer.ts`
Transforms CSV data to database format:
- Maps CSV columns to database columns
- Cleans and normalizes data
- Infers venue type from Google category
- Parses JSON fields (working hours)

### `importer.ts`
Handles database operations:
- Batch inserts for performance
- Duplicate detection via `google_place_id`
- Progress reporting
- Error handling with retry

### `run-import.ts`
CLI entry point:
- Parses command-line arguments
- Orchestrates the import pipeline
- Displays progress and summary

---

## Data Mapping

| CSV Column | Database Column | Notes |
|------------|-----------------|-------|
| `name` | `name` | Required |
| `street` | `address_line` | Street address |
| `city` | `city` | Required |
| `state`/`us_state` | `state` | Normalized to abbreviation |
| `postal_code` | `postal_code` | |
| `country_code` | `country` | Defaults to "US" |
| `latitude` | `latitude` | Decimal coordinates |
| `longitude` | `longitude` | |
| `category` | `category` | Google category |
| `category`/`type` | `venue_type` | Mapped to our types |
| `site` | `website_url` | Cleaned URL |
| `phone` | `phone` | |
| `photo` | `external_image_url` | Google photo URL |
| `place_id` | `google_place_id` | For deduplication |
| `rating` | `rating` | 1.0-5.0 |
| `reviews` | `review_count` | Integer |
| `working_hours` | `working_hours` | JSON object |

---

## Slug Format

Slugs are generated in this format:
```
{venue-name}-{neighborhood}-{city}
```

Examples:
- `the-pabst-theater-milwaukee`
- `coffee-shop-third-ward-milwaukee`
- `dog-park-west-allis`

If a slug already exists, a numeric suffix is added:
- `coffee-shop-milwaukee-2`
- `coffee-shop-milwaukee-3`

---

## CLI Options

```bash
npx tsx scripts/venue-import/run-import.ts [options]

Options:
  --dry-run, -d    Test run without writing to database
  --limit=N        Only import first N venues
  --help, -h       Show help message
```

### Examples

```bash
# Preview what would be imported (first 10)
npx tsx scripts/venue-import/run-import.ts --dry-run --limit=10

# Import first 100 venues
npx tsx scripts/venue-import/run-import.ts --limit=100

# Full import (all 3500+ venues)
npx tsx scripts/venue-import/run-import.ts
```

---

## Environment Variables

Required for database connection:

```bash
# Option 1: Use Supabase service role key (recommended for imports)
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIs..."

# Option 2: Use existing Next.js env vars
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIs..."
```

> ⚠️ **Note**: Service role key is required for bulk inserts to bypass RLS.

---

## Deduplication

The importer prevents duplicates using `google_place_id`:

1. Before import, fetches all existing `google_place_id` values
2. Skips any venue with a matching ID
3. Tracks IDs within the batch to prevent internal duplicates

---

## Error Handling

The importer handles errors gracefully:

1. **Batch failures**: If a batch insert fails, retries individual rows
2. **Invalid data**: Skips rows with missing required fields
3. **Connection errors**: Reports clearly with error messages

Errors are logged with details:
```
❌ ERRORS:
   Row 42: Coffee Shop - duplicate key value violates unique constraint
   Row 156: Bar Name - invalid latitude value
```

---

## Rollback

If you need to undo an import, use the `import_batch_id`:

```sql
-- See what was imported
SELECT COUNT(*), import_batch_id
FROM locations
WHERE source = 'csv_import'
GROUP BY import_batch_id;

-- Delete a specific import batch
DELETE FROM locations
WHERE import_batch_id = 'import_2026-01-07T10-30-00-000Z';
```

---

## Troubleshooting

### "Missing Supabase credentials"
Set the environment variables:
```bash
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### "CSV file not found"
Make sure the CSV is at:
```
supabase/Milwaukee Venues Happenlist.csv
```

### "Permission denied" errors
Make sure you're using the **service role key**, not the anon key.

### Many duplicates skipped
This means venues were already imported. Check with:
```sql
SELECT COUNT(*) FROM locations WHERE source = 'csv_import';
```

---

## Performance

- **Batch size**: 100 records per insert
- **Progress reporting**: Every 500 records
- **Expected time**: ~30 seconds for 3500 venues

---

## Next Steps After Import

1. **Verify in Supabase**: Check the `locations` table
2. **Test search**: Try the venue search in the submit form
3. **Download images**: Run the image download script (coming soon)
