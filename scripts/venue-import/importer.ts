/**
 * VENUE IMPORTER
 * ==============
 * Handles the actual database import of venue records.
 *
 * Features:
 *   • Batch inserts for performance
 *   • Duplicate detection via google_place_id
 *   • Error handling with detailed logging
 *   • Dry-run mode for testing
 *   • Progress reporting
 *
 * Usage:
 *   const importer = new VenueImporter(supabaseClient);
 *   const summary = await importer.importVenues(records, options);
 *
 * @module scripts/venue-import/importer
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VenueRecord, VenueImportResult, ImportSummary, ImportOptions } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Number of records to insert per batch */
const BATCH_SIZE = 100;

/** Progress reporting interval */
const PROGRESS_INTERVAL = 500;

// ============================================================================
// IMPORTER CLASS
// ============================================================================

/**
 * Handles importing venues to Supabase.
 */
export class VenueImporter {
  private supabase: SupabaseClient;
  private dryRun: boolean;
  private existingPlaceIds: Set<string>;

  constructor(supabase: SupabaseClient, dryRun = false) {
    this.supabase = supabase;
    this.dryRun = dryRun;
    this.existingPlaceIds = new Set();
  }

  /**
   * Fetches all existing google_place_ids for duplicate detection.
   */
  async fetchExistingPlaceIds(): Promise<void> {
    console.log('\n🔍 Fetching existing venue IDs for deduplication...');

    const { data, error } = await this.supabase
      .from('locations')
      .select('google_place_id')
      .not('google_place_id', 'is', null);

    if (error) {
      console.warn('⚠️  Could not fetch existing IDs:', error.message);
      return;
    }

    if (data) {
      data.forEach((row) => {
        if (row.google_place_id) {
          this.existingPlaceIds.add(row.google_place_id);
        }
      });
    }

    console.log(`✅ Found ${this.existingPlaceIds.size} existing venues in database`);
  }

  /**
   * Fetches all existing slugs for the slug generator.
   */
  async fetchExistingSlugs(): Promise<string[]> {
    console.log('🔍 Fetching existing venue slugs...');

    const { data, error } = await this.supabase
      .from('locations')
      .select('slug');

    if (error) {
      console.warn('⚠️  Could not fetch existing slugs:', error.message);
      return [];
    }

    const slugs = data?.map((row) => row.slug) || [];
    console.log(`✅ Found ${slugs.length} existing slugs`);

    return slugs;
  }

  /**
   * Checks if a venue already exists by google_place_id.
   */
  isDuplicate(record: VenueRecord): boolean {
    if (!record.google_place_id) return false;
    return this.existingPlaceIds.has(record.google_place_id);
  }

  /**
   * Inserts a batch of venues.
   */
  private async insertBatch(
    records: VenueRecord[],
    startIndex: number
  ): Promise<VenueImportResult[]> {
    const results: VenueImportResult[] = [];

    if (this.dryRun) {
      // Dry run: simulate success for all records
      records.forEach((record, i) => {
        results.push({
          rowIndex: startIndex + i,
          name: record.name,
          success: true,
          action: 'inserted',
          slug: record.slug,
        });
      });
      return results;
    }

    // Actual insert
    const { data, error } = await this.supabase
      .from('locations')
      .insert(records)
      .select('id, name, slug');

    if (error) {
      // If batch fails, try individual inserts to identify problem records
      console.warn(`⚠️  Batch insert failed: ${error.message}`);
      console.log('   Retrying individual inserts...');

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const { data: singleData, error: singleError } = await this.supabase
          .from('locations')
          .insert(record)
          .select('id, name, slug')
          .single();

        if (singleError) {
          results.push({
            rowIndex: startIndex + i,
            name: record.name,
            success: false,
            action: 'error',
            error: singleError.message,
          });
        } else {
          results.push({
            rowIndex: startIndex + i,
            name: record.name,
            success: true,
            action: 'inserted',
            id: singleData.id,
            slug: singleData.slug,
          });
        }
      }
    } else {
      // Batch succeeded
      data?.forEach((row, i) => {
        results.push({
          rowIndex: startIndex + i,
          name: row.name,
          success: true,
          action: 'inserted',
          id: row.id,
          slug: row.slug,
        });
      });
    }

    return results;
  }

  /**
   * Imports an array of venue records.
   *
   * @param records - Venue records to import
   * @param batchId - Unique ID for this import batch
   * @returns ImportSummary with results
   */
  async importVenues(
    records: VenueRecord[],
    batchId: string
  ): Promise<ImportSummary> {
    const startedAt = new Date();
    const results: VenueImportResult[] = [];

    console.log('\n📥 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 VENUE IMPORTER');
    console.log('📥 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📥 Mode: ${this.dryRun ? '🧪 DRY RUN (no database writes)' : '💾 LIVE IMPORT'}`);
    console.log(`📥 Batch ID: ${batchId}`);
    console.log(`📥 Records to process: ${records.length}`);

    // Filter out duplicates
    const newRecords: VenueRecord[] = [];
    const skippedDuplicates: VenueImportResult[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      if (this.isDuplicate(record)) {
        skippedDuplicates.push({
          rowIndex: i,
          name: record.name,
          success: true,
          action: 'skipped',
          skipReason: 'Duplicate google_place_id',
        });
      } else {
        newRecords.push(record);
        // Track this ID so we don't duplicate within the batch
        if (record.google_place_id) {
          this.existingPlaceIds.add(record.google_place_id);
        }
      }
    }

    console.log(`📥 New venues to insert: ${newRecords.length}`);
    console.log(`📥 Duplicates skipped: ${skippedDuplicates.length}`);

    // Add skipped duplicates to results
    results.push(...skippedDuplicates);

    // Process in batches
    const totalBatches = Math.ceil(newRecords.length / BATCH_SIZE);
    let processedCount = 0;

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const start = batchNum * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, newRecords.length);
      const batch = newRecords.slice(start, end);

      const batchResults = await this.insertBatch(batch, start);
      results.push(...batchResults);

      processedCount += batch.length;

      // Progress report
      if (processedCount % PROGRESS_INTERVAL === 0 || batchNum === totalBatches - 1) {
        const percent = Math.round((processedCount / newRecords.length) * 100);
        console.log(`📥 Progress: ${processedCount}/${newRecords.length} (${percent}%)`);
      }
    }

    const finishedAt = new Date();

    // Calculate summary
    const summary: ImportSummary = {
      batchId,
      startedAt,
      finishedAt,
      totalRows: records.length,
      inserted: results.filter((r) => r.action === 'inserted').length,
      skipped: results.filter((r) => r.action === 'skipped').length,
      errors: results.filter((r) => r.action === 'error').length,
      results,
    };

    // Print summary
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    const durationSec = (durationMs / 1000).toFixed(1);

    console.log('\n📥 ─────────────────────────────────────────────────────────────');
    console.log('📥 IMPORT COMPLETE');
    console.log('📥 ─────────────────────────────────────────────────────────────');
    console.log(`📥 Duration:  ${durationSec}s`);
    console.log(`📥 Total:     ${summary.totalRows}`);
    console.log(`📥 Inserted:  ${summary.inserted} ✅`);
    console.log(`📥 Skipped:   ${summary.skipped} ⏭️`);
    console.log(`📥 Errors:    ${summary.errors} ❌`);
    console.log('📥 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Log errors if any
    if (summary.errors > 0) {
      console.log('❌ ERRORS:');
      results
        .filter((r) => r.action === 'error')
        .slice(0, 10) // Show first 10 errors
        .forEach((r) => {
          console.log(`   Row ${r.rowIndex}: ${r.name} - ${r.error}`);
        });

      if (summary.errors > 10) {
        console.log(`   ... and ${summary.errors - 10} more errors`);
      }
    }

    return summary;
  }
}

// ============================================================================
// SUPABASE CLIENT FACTORY
// ============================================================================

/**
 * Creates a Supabase client for the import script.
 * Uses environment variables for credentials.
 *
 * Required env vars:
 *   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (for admin access)
 */
export function createImportClient(): SupabaseClient {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!');
    console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    console.error('');
    console.error('   Example:');
    console.error('   export SUPABASE_URL="https://xxx.supabase.co"');
    console.error('   export SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."');
    process.exit(1);
  }

  console.log(`🔌 Connecting to Supabase: ${supabaseUrl}`);

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
