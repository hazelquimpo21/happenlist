/**
 * NEIGHBORHOOD PICKER — geo filter for /events
 * ==============================================
 * Dropdown of Milwaukee neighborhoods + "Use my location" button.
 * Selecting a neighborhood sets nearLat/nearLng/radiusMiles in the
 * URL via useFilterState, which triggers the geo RPC in get-events.ts.
 *
 * Design: matches FilterSection layout. Dropdown uses native <select>
 * for mobile accessibility (no custom dropdown needed for 15 items).
 *
 * Cross-file coupling:
 *   - src/lib/constants/milwaukee-neighborhoods.ts — neighborhood data
 *   - src/components/events/filters/types.ts — FilterState.neighborhood field
 *   - src/components/events/filters/use-filter-state.ts — URL state
 *   - src/data/events/get-events.ts — consumes nearLat/nearLng/radiusMiles
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import {
  NEIGHBORHOODS,
  DEFAULT_RADIUS_MILES,
  getNeighborhood,
} from '@/lib/constants/milwaukee-neighborhoods';
import { FilterSection } from './filter-section';
import { useFilterState } from './use-filter-state';

/** Radius options in miles */
const RADIUS_OPTIONS = [1, 2, 3, 5, 10, 15, 25] as const;

export function NeighborhoodPicker() {
  const { state, setState, setSingle } = useFilterState();
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Ref to hold latest state — avoids stale closure in async geolocation callback.
  // The getCurrentPosition callback can fire seconds later; by that time
  // the `state` captured in the useCallback closure may be outdated.
  const stateRef = useRef(state);
  stateRef.current = state;

  // True when ANY geo anchor is set (neighborhood or custom coords)
  const hasGeoAnchor = !!state.neighborhood || (state.nearLat != null && state.nearLng != null);

  // IMPORTANT: geo updates MUST be batched into a single setState call.
  // Calling setSingle 3x in a row hits a stale-closure bug — each call
  // reads the same `state` snapshot, so only the last write survives.
  const handleNeighborhoodChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      if (!id) {
        setState({
          ...stateRef.current,
          neighborhood: undefined,
          nearLat: undefined,
          nearLng: undefined,
        });
        return;
      }
      const hood = getNeighborhood(id);
      if (hood) {
        setState({
          ...stateRef.current,
          neighborhood: hood.id,
          nearLat: hood.lat,
          nearLng: hood.lng,
        });
      }
    },
    [setState]
  );

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported');
      return;
    }

    setLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        // Read from ref to get the latest state at resolve time
        setState({
          ...stateRef.current,
          neighborhood: 'my-location',
          nearLat: position.coords.latitude,
          nearLng: position.coords.longitude,
        });
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === 1
            ? 'Location access denied'
            : 'Could not get location'
        );
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [setState]);

  const handleRadiusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const miles = parseInt(e.target.value, 10);
      if (!isNaN(miles)) {
        setSingle('radiusMiles', miles);
      }
    },
    [setSingle]
  );

  const handleClear = useCallback(() => {
    setState({
      ...stateRef.current,
      neighborhood: undefined,
      nearLat: undefined,
      nearLng: undefined,
      radiusMiles: undefined,
    });
    setLocError(null);
  }, [setState]);

  return (
    <FilterSection
      label="Near"
      showClear={hasGeoAnchor}
      onClear={handleClear}
    >
      <div className="space-y-2 w-full">
        {/* Neighborhood dropdown */}
        <div className="relative">
          <MapPin
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc pointer-events-none"
            aria-hidden="true"
          />
          <select
            value={state.neighborhood === 'my-location' ? '' : (state.neighborhood ?? '')}
            onChange={handleNeighborhoodChange}
            aria-label="Select neighborhood"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-body-sm font-body bg-cloud border border-mist text-ink appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
          >
            <option value="">All neighborhoods</option>
            {NEIGHBORHOODS.map((hood) => (
              <option key={hood.id} value={hood.id}>
                {hood.label}
              </option>
            ))}
          </select>
        </div>

        {/* Use my location button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-mist text-zinc hover:text-blue hover:border-blue transition-colors disabled:opacity-50"
        >
          <Navigation className="w-3 h-3" aria-hidden="true" />
          {locating ? 'Locating...' : state.neighborhood === 'my-location' ? 'Using your location' : 'Use my location'}
        </button>

        {locError && (
          <p className="text-xs text-rose">{locError}</p>
        )}

        {/* Radius selector — only shown when a geo anchor is active */}
        {hasGeoAnchor && (
          <div className="flex items-center gap-2">
            <label htmlFor="radius-select" className="text-xs text-zinc flex-shrink-0">
              Within:
            </label>
            <select
              id="radius-select"
              value={state.radiusMiles ?? DEFAULT_RADIUS_MILES}
              onChange={handleRadiusChange}
              className="py-1 px-2 rounded-md text-xs font-body bg-cloud border border-mist text-ink appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue"
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r} {r === 1 ? 'mile' : 'miles'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </FilterSection>
  );
}
