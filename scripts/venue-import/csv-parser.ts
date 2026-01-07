/**
 * CSV PARSER
 * ==========
 * Parses the Google Maps venue CSV export into typed rows.
 *
 * Features:
 *   • Handles quoted fields with commas
 *   • Validates required fields
 *   • Provides helpful error messages
 *
 * Usage:
 *   const rows = await parseCsvFile('/path/to/venues.csv');
 *
 * @module scripts/venue-import/csv-parser
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CsvRow } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Required fields that must be present in every row */
const REQUIRED_FIELDS = ['name', 'city'] as const;

/** Expected CSV headers (first row) */
const EXPECTED_HEADERS = [
  'query',
  'name',
  'name_for_emails',
  'site',
  'subtypes',
  'category',
  'type',
  'phone',
  'full_address',
  'borough',
  'street',
  'city',
  'postal_code',
  'state',
  'us_state',
  'country',
  'country_code',
  'latitude',
  'longitude',
];

// ============================================================================
// CSV PARSING
// ============================================================================

/**
 * Parses a single CSV line, handling quoted fields properly.
 *
 * @param line - Raw CSV line string
 * @returns Array of field values
 *
 * @example
 * parseCsvLine('"Hello, World",123,test')
 * // Returns: ['Hello, World', '123', 'test']
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Don't forget the last field
  fields.push(current.trim());

  return fields;
}

/**
 * Maps an array of field values to a CsvRow object using headers.
 *
 * @param headers - Array of header names
 * @param values - Array of field values
 * @returns CsvRow object with all fields
 */
function mapToRow(headers: string[], values: string[]): CsvRow {
  const row: Record<string, string> = {};

  headers.forEach((header, index) => {
    row[header] = values[index] || '';
  });

  return row as unknown as CsvRow;
}

/**
 * Validates that a row has required fields.
 *
 * @param row - CsvRow to validate
 * @param rowIndex - Row index for error reporting
 * @returns Object with isValid flag and any error messages
 */
function validateRow(
  row: CsvRow,
  rowIndex: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!row.name || row.name.trim() === '') {
    errors.push(`Row ${rowIndex}: Missing required field 'name'`);
  }

  if (!row.city || row.city.trim() === '') {
    errors.push(`Row ${rowIndex}: Missing required field 'city'`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Parses a CSV file into an array of typed CsvRow objects.
 *
 * @param csvPath - Path to the CSV file
 * @returns Promise resolving to array of CsvRow objects
 *
 * @example
 * const rows = await parseCsvFile('./venues.csv');
 * console.log(`Loaded ${rows.length} venues`);
 */
export async function parseCsvFile(csvPath: string): Promise<{
  rows: CsvRow[];
  validRows: CsvRow[];
  invalidRows: { row: CsvRow; index: number; errors: string[] }[];
  headers: string[];
}> {
  console.log('\n📄 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄 CSV PARSER');
  console.log('📄 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Resolve path
  const resolvedPath = path.resolve(csvPath);
  console.log(`📄 Reading: ${resolvedPath}`);

  // Check file exists
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`❌ CSV file not found: ${resolvedPath}`);
  }

  // Read file
  const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
  const lines = fileContent.split('\n').filter((line) => line.trim() !== '');

  console.log(`📄 Found ${lines.length} lines (including header)`);

  // Parse header
  const headers = parseCsvLine(lines[0]);
  console.log(`📄 Headers: ${headers.length} columns`);

  // Validate headers contain expected fields
  const missingHeaders = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    console.warn(`⚠️  Missing expected headers: ${missingHeaders.join(', ')}`);
  }

  // Parse data rows
  const rows: CsvRow[] = [];
  const validRows: CsvRow[] = [];
  const invalidRows: { row: CsvRow; index: number; errors: string[] }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row = mapToRow(headers, values);
    rows.push(row);

    const validation = validateRow(row, i);
    if (validation.isValid) {
      validRows.push(row);
    } else {
      invalidRows.push({ row, index: i, errors: validation.errors });
    }
  }

  // Summary
  console.log('📄 ─────────────────────────────────────────────────────────────');
  console.log(`📄 Total rows:   ${rows.length}`);
  console.log(`📄 Valid rows:   ${validRows.length} ✅`);
  console.log(`📄 Invalid rows: ${invalidRows.length} ⚠️`);
  console.log('📄 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return { rows, validRows, invalidRows, headers };
}
