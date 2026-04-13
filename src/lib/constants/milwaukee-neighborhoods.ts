/**
 * MILWAUKEE NEIGHBORHOODS — center coordinates for distance filtering
 * ===================================================================
 * ~15 neighborhoods with approximate center lat/lng, used by the
 * NeighborhoodPicker filter and distance-sort in get-events.ts.
 *
 * Coordinates sourced from Google Maps centroids. "Downtown" serves as
 * the default anchor when no neighborhood is selected.
 *
 * Cross-file coupling:
 *   - src/components/events/filters/neighborhood-picker.tsx — renders the list
 *   - src/data/events/get-events.ts — consumes nearLat/nearLng from these coords
 *   - src/components/events/filters/types.ts — FilterState.neighborhood field
 *
 * If you add/rename a neighborhood, update:
 *   1. The NEIGHBORHOODS array below
 *   2. Nothing else — everything downstream reads from this array
 */

export interface Neighborhood {
  /** URL-safe slug, used as the neighborhood filter value */
  readonly id: string;
  /** Human-readable display name */
  readonly label: string;
  /** Center latitude */
  readonly lat: number;
  /** Center longitude */
  readonly lng: number;
}

/**
 * Milwaukee neighborhoods with approximate center coordinates.
 * Ordered roughly north-to-south then west-to-east for natural browsing.
 */
export const NEIGHBORHOODS: readonly Neighborhood[] = [
  { id: 'downtown',       label: 'Downtown',        lat: 43.0389, lng: -87.9065 },
  { id: 'east-side',      label: 'East Side',       lat: 43.0590, lng: -87.8860 },
  { id: 'third-ward',     label: 'Third Ward',      lat: 43.0330, lng: -87.9040 },
  { id: 'walkers-point',  label: "Walker's Point",  lat: 43.0240, lng: -87.9130 },
  { id: 'bay-view',       label: 'Bay View',        lat: 43.0070, lng: -87.8960 },
  { id: 'riverwest',      label: 'Riverwest',       lat: 43.0620, lng: -87.9030 },
  { id: 'brewers-hill',   label: "Brewer's Hill",   lat: 43.0560, lng: -87.9080 },
  { id: 'bronzeville',    label: 'Bronzeville',     lat: 43.0520, lng: -87.9160 },
  { id: 'sherman-park',   label: 'Sherman Park',    lat: 43.0670, lng: -87.9460 },
  { id: 'wauwatosa',      label: 'Wauwatosa',       lat: 43.0495, lng: -88.0076 },
  { id: 'shorewood',      label: 'Shorewood',       lat: 43.0890, lng: -87.8870 },
  { id: 'whitefish-bay',  label: 'Whitefish Bay',   lat: 43.1130, lng: -87.9000 },
  { id: 'south-side',     label: 'South Side',      lat: 42.9940, lng: -87.9210 },
  { id: 'menomonee-valley', label: 'Menomonee Valley', lat: 43.0270, lng: -87.9380 },
  { id: 'north-side',     label: 'North Side',      lat: 43.0830, lng: -87.9340 },
] as const;

/** Default radius in miles when a neighborhood is selected but no custom radius is set. */
export const DEFAULT_RADIUS_MILES = 5;

/** Maximum allowed radius to prevent degenerate queries. */
export const MAX_RADIUS_MILES = 50;

/** Lookup a neighborhood by id. Returns undefined for unknown ids. */
export function getNeighborhood(id: string): Neighborhood | undefined {
  return NEIGHBORHOODS.find((n) => n.id === id);
}

/** Type guard for valid neighborhood IDs. */
export function isNeighborhoodId(value: string): boolean {
  return NEIGHBORHOODS.some((n) => n.id === value);
}
