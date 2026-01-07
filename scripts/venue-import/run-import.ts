#!/usr/bin/env npx tsx
/**
 * VENUE IMPORT RUNNER
 * ===================
 * Main entry point for the venue CSV import.
 *
 * Usage:
 *   npx tsx scripts/venue-import/run-import.ts [options]
 *
 * Options:
 *   --dry-run    Test run without writing to database
 *   --limit=N    Only import first N venues (for testing)
 *   --help       Show help
 *
 * Required Environment Variables:
 *   SUPABASE_URL             or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (for write access)
 *
 * Example:
 *   # Test with first 10 venues
 *   npx tsx scripts/venue-import/run-import.ts --dry-run --limit=10
 *
 *   # Full import
 *   npx tsx scripts/venue-import/run-import.ts
 *
 * @module scripts/venue-import/run-import
 */

import * as path from 'path';
import { parseCsvFile } from './csv-parser';
import { SlugGenerator } from './slug-generator';
import { VenueTransformer } from './transformer';
import { VenueImporter, createImportClient } from './importer';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Path to the CSV file (relative to project root) */
const CSV_PATH = path.resolve(__dirname, '../../supabase/Milwaukee Venues Happenlist.csv');

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

interface CliOptions {
  dryRun: boolean;
  limit?: number;
  help: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  const options: CliOptions = {
    dryRun: false,
    limit: undefined,
    help: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         VENUE IMPORT SCRIPT                                    ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  Imports venues from a CSV file into the Supabase database.                   ║
║                                                                                ║
║  USAGE:                                                                        ║
║    npx tsx scripts/venue-import/run-import.ts [options]                       ║
║                                                                                ║
║  OPTIONS:                                                                      ║
║    --dry-run, -d    Test run without writing to database                      ║
║    --limit=N        Only import first N venues (for testing)                  ║
║    --help, -h       Show this help message                                    ║
║                                                                                ║
║  ENVIRONMENT VARIABLES (required):                                            ║
║    SUPABASE_URL             Your Supabase project URL                         ║
║    SUPABASE_SERVICE_ROLE_KEY  Service role key (for write access)             ║
║                                                                                ║
║  EXAMPLES:                                                                     ║
║    # Test with first 10 venues (no database writes)                           ║
║    npx tsx scripts/venue-import/run-import.ts --dry-run --limit=10            ║
║                                                                                ║
║    # Full import to database                                                  ║
║    npx tsx scripts/venue-import/run-import.ts                                 ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

async function runImport(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                     🏛️  VENUE IMPORT SCRIPT  🏛️                              ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Mode:     ${options.dryRun ? '🧪 DRY RUN (no database writes)' : '💾 LIVE IMPORT'}                              ║`);
  console.log(`║  Limit:    ${options.limit ? `First ${options.limit} venues` : 'All venues'}                                          ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  // Generate unique batch ID
  const batchId = `import_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  console.log(`\n📋 Batch ID: ${batchId}`);

  try {
    // =========================================================================
    // STEP 1: Parse CSV
    // =========================================================================
    console.log('\n');
    console.log('┌───────────────────────────────────────────────────────────────────────────────┐');
    console.log('│  STEP 1: Parse CSV File                                                       │');
    console.log('└───────────────────────────────────────────────────────────────────────────────┘');

    const { validRows, invalidRows } = await parseCsvFile(CSV_PATH);

    // Show sample invalid rows
    if (invalidRows.length > 0) {
      console.log('\n⚠️  Sample invalid rows:');
      invalidRows.slice(0, 3).forEach(({ index, errors }) => {
        console.log(`   Row ${index}: ${errors.join(', ')}`);
      });
    }

    // Apply limit if specified
    let rowsToImport = validRows;
    if (options.limit) {
      rowsToImport = validRows.slice(0, options.limit);
      console.log(`\n🔢 Limiting to first ${options.limit} venues`);
    }

    // =========================================================================
    // STEP 2: Connect to Supabase
    // =========================================================================
    console.log('\n');
    console.log('┌───────────────────────────────────────────────────────────────────────────────┐');
    console.log('│  STEP 2: Connect to Supabase                                                  │');
    console.log('└───────────────────────────────────────────────────────────────────────────────┘');

    const supabase = createImportClient();
    const importer = new VenueImporter(supabase, options.dryRun);

    // Fetch existing data for deduplication
    await importer.fetchExistingPlaceIds();
    const existingSlugs = await importer.fetchExistingSlugs();

    // =========================================================================
    // STEP 3: Transform Data
    // =========================================================================
    console.log('\n');
    console.log('┌───────────────────────────────────────────────────────────────────────────────┐');
    console.log('│  STEP 3: Transform CSV Rows to Venue Records                                  │');
    console.log('└───────────────────────────────────────────────────────────────────────────────┘');

    const slugGenerator = new SlugGenerator(existingSlugs);
    const transformer = new VenueTransformer(slugGenerator, batchId);
    const venueRecords = transformer.transformMany(rowsToImport);

    // Show sample records
    console.log('\n📝 Sample transformed records:');
    venueRecords.slice(0, 3).forEach((record, i) => {
      console.log(`   ${i + 1}. ${record.name}`);
      console.log(`      Slug: ${record.slug}`);
      console.log(`      Address: ${record.address_line}, ${record.city}`);
      console.log(`      Coords: ${record.latitude}, ${record.longitude}`);
    });

    // =========================================================================
    // STEP 4: Import to Database
    // =========================================================================
    console.log('\n');
    console.log('┌───────────────────────────────────────────────────────────────────────────────┐');
    console.log('│  STEP 4: Import to Database                                                   │');
    console.log('└───────────────────────────────────────────────────────────────────────────────┘');

    const summary = await importer.importVenues(venueRecords, batchId);

    // =========================================================================
    // FINAL SUMMARY
    // =========================================================================
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                           📊 IMPORT SUMMARY                                   ║');
    console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Batch ID:     ${batchId.padEnd(55)}║`);
    console.log(`║  Total Rows:   ${String(summary.totalRows).padEnd(55)}║`);
    console.log(`║  Inserted:     ${String(summary.inserted).padEnd(55)}║`);
    console.log(`║  Skipped:      ${String(summary.skipped).padEnd(55)}║`);
    console.log(`║  Errors:       ${String(summary.errors).padEnd(55)}║`);
    console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');

    if (options.dryRun) {
      console.log('║  ⚠️  DRY RUN - No data was written to the database                           ║');
      console.log('║  Run without --dry-run to perform the actual import                         ║');
    } else {
      console.log('║  ✅ Import complete! Venues are now in your database.                       ║');
    }

    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    // Exit with error code if there were errors
    if (summary.errors > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n');
    console.error('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.error('║  ❌ IMPORT FAILED                                                             ║');
    console.error('╠═══════════════════════════════════════════════════════════════════════════════╣');
    console.error(`║  Error: ${String(error).slice(0, 63).padEnd(63)}║`);
    console.error('╚═══════════════════════════════════════════════════════════════════════════════╝');
    console.error('\n');

    if (error instanceof Error) {
      console.error('Full error:', error.message);
      console.error('Stack:', error.stack);
    }

    process.exit(1);
  }
}

// ============================================================================
// RUN
// ============================================================================

runImport();
