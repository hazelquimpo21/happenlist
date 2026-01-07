/**
 * SLUG GENERATOR
 * ==============
 * Generates unique, URL-friendly slugs for venues.
 *
 * Features:
 *   • Converts names to lowercase kebab-case
 *   • Removes special characters
 *   • Handles duplicates with numeric suffixes
 *   • Tracks used slugs across batch
 *
 * Usage:
 *   const generator = new SlugGenerator(existingSlugs);
 *   const slug = generator.generate('The Pabst Theater');
 *   // Returns: 'the-pabst-theater'
 *
 * @module scripts/venue-import/slug-generator
 */

// ============================================================================
// SLUG GENERATOR CLASS
// ============================================================================

/**
 * Generates unique slugs for venue names.
 * Tracks used slugs to ensure uniqueness within a batch.
 */
export class SlugGenerator {
  /** Set of already-used slugs */
  private usedSlugs: Set<string>;

  /**
   * Creates a new SlugGenerator.
   *
   * @param existingSlugs - Array of slugs already in use (from database)
   */
  constructor(existingSlugs: string[] = []) {
    this.usedSlugs = new Set(existingSlugs);
    console.log(`🔤 SlugGenerator initialized with ${existingSlugs.length} existing slugs`);
  }

  /**
   * Converts a string to a URL-friendly slug.
   *
   * @param text - Text to convert
   * @returns Slugified text
   *
   * @example
   * slugify('The Pabst Theater!')
   * // Returns: 'the-pabst-theater'
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      // Replace & with 'and'
      .replace(/&/g, 'and')
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, '-')
      // Remove all non-alphanumeric characters except hyphens
      .replace(/[^a-z0-9-]/g, '')
      // Remove multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-|-$/g, '');
  }

  /**
   * Generates a unique slug for a venue name.
   * Format: venue-name-neighborhood-city (if available)
   *
   * @param name - Venue name
   * @param city - City name
   * @param neighborhood - Neighborhood/borough (optional)
   * @returns Unique slug
   *
   * @example
   * generate('The Coffee Shop', 'Milwaukee', 'Third Ward')
   * // Returns: 'the-coffee-shop-third-ward-milwaukee'
   *
   * @example
   * generate('The Coffee Shop', 'Milwaukee')
   * // Returns: 'the-coffee-shop-milwaukee'
   */
  generate(name: string, city?: string, neighborhood?: string): string {
    // Build the slug parts
    const namePart = this.slugify(name);
    const neighborhoodPart = neighborhood ? this.slugify(neighborhood) : '';
    const cityPart = city ? this.slugify(city) : '';

    // Handle empty names
    if (!namePart) {
      const fallback = cityPart ? `${cityPart}-venue` : 'venue';
      return this.ensureUnique(fallback);
    }

    // Build full slug: name-neighborhood-city
    let baseSlug = namePart;

    // Add neighborhood if it's meaningful (not "None", not empty, not same as city)
    if (
      neighborhoodPart &&
      neighborhoodPart !== 'none' &&
      neighborhoodPart !== cityPart
    ) {
      baseSlug = `${namePart}-${neighborhoodPart}`;
    }

    // Always add city for SEO and uniqueness
    if (cityPart) {
      baseSlug = `${baseSlug}-${cityPart}`;
    }

    return this.ensureUnique(baseSlug);
  }

  /**
   * Ensures a slug is unique by adding a numeric suffix if needed.
   *
   * @param baseSlug - The base slug to make unique
   * @returns A unique slug
   */
  private ensureUnique(baseSlug: string): string {
    // Check if base slug is unique
    if (!this.usedSlugs.has(baseSlug)) {
      this.usedSlugs.add(baseSlug);
      return baseSlug;
    }

    // Add numeric suffix until unique
    let counter = 2;
    let candidateSlug = `${baseSlug}-${counter}`;

    while (this.usedSlugs.has(candidateSlug)) {
      counter++;
      candidateSlug = `${baseSlug}-${counter}`;

      // Safety valve to prevent infinite loops
      if (counter > 1000) {
        throw new Error(`Failed to generate unique slug for: ${baseSlug}`);
      }
    }

    this.usedSlugs.add(candidateSlug);
    return candidateSlug;
  }

  /**
   * Gets the count of slugs generated so far.
   */
  get count(): number {
    return this.usedSlugs.size;
  }

  /**
   * Checks if a slug is already in use.
   */
  isUsed(slug: string): boolean {
    return this.usedSlugs.has(slug);
  }
}
