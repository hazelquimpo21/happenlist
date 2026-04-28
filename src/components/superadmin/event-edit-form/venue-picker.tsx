/**
 * EVENT EDIT FORM — VENUE PICKER
 * ===============================
 * Self-contained venue search + selection state. Hits
 * /api/submit/venues/search for fuzzy lookup. Calls onChange whenever the
 * selected venue changes (or is cleared); parent diffs against the original
 * `event.location_id` at save time.
 *
 * Extracted from the original monolithic event-edit-form.tsx (2026-04-22 split).
 *
 * @module components/superadmin/event-edit-form/venue-picker
 */

'use client';

import { useState, useCallback } from 'react';
import { MapPin, Search, Star, Loader2 } from 'lucide-react';
import type { VenueSearchResult } from './helpers';

interface VenuePickerProps {
  initialVenue: VenueSearchResult | null;
  onChange: (venue: VenueSearchResult | null) => void;
}

export function VenuePicker({ initialVenue, onChange }: VenuePickerProps) {
  const [selectedVenue, setSelectedVenue] = useState<VenueSearchResult | null>(initialVenue);
  const [venueQuery, setVenueQuery] = useState('');
  const [venueResults, setVenueResults] = useState<VenueSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setVenueQuery(query);

    if (query.length < 2) {
      setVenueResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/submit/venues/search?q=${encodeURIComponent(query)}&limit=10`
      );
      const result = await response.json();

      if (result.success) {
        setVenueResults(result.venues);
      } else {
        setVenueResults([]);
      }
    } catch {
      setVenueResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectVenue = useCallback((venue: VenueSearchResult) => {
    setSelectedVenue(venue);
    setShowSearch(false);
    setVenueQuery('');
    setVenueResults([]);
    onChange(venue);
  }, [onChange]);

  const clearVenue = useCallback(() => {
    setSelectedVenue(null);
    onChange(null);
  }, [onChange]);

  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-2">
        Venue / Location
      </label>

      {selectedVenue && !showSearch && (
        <div className="p-4 bg-emerald/10 border border-sage/30 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald mt-0.5" />
              <div>
                <p className="font-medium text-ink">{selectedVenue.name}</p>
                <p className="text-sm text-zinc">
                  {selectedVenue.address_line && `${selectedVenue.address_line}, `}
                  {selectedVenue.city}
                  {selectedVenue.state && `, ${selectedVenue.state}`}
                </p>
                {selectedVenue.rating && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-zinc">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{selectedVenue.rating.toFixed(1)}</span>
                    {selectedVenue.review_count > 0 && (
                      <span className="text-zinc/60">({selectedVenue.review_count})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="text-sm text-blue hover:text-blue/80"
              >
                Change
              </button>
              <button
                type="button"
                onClick={clearVenue}
                className="text-sm text-zinc hover:text-ink"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedVenue && !showSearch && (
        <button
          type="button"
          onClick={() => setShowSearch(true)}
          className="w-full p-4 border border-dashed border-mist rounded-lg hover:border-coral hover:bg-blue/5 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cloud rounded-lg">
              <MapPin className="w-5 h-5 text-zinc" />
            </div>
            <div>
              <p className="font-medium text-ink">No venue selected</p>
              <p className="text-sm text-zinc">Click to search and select a venue</p>
            </div>
          </div>
        </button>
      )}

      {showSearch && (
        <div className="p-4 bg-white rounded-lg border border-mist space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Search Venues</p>
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setVenueQuery('');
                setVenueResults([]);
              }}
              className="text-sm text-zinc hover:text-ink"
            >
              Cancel
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc" />
            <input
              type="text"
              value={venueQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Type venue name or address..."
              className="w-full pl-10 pr-10 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc animate-spin" />
            )}
          </div>

          {venueResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {venueResults.map((venue) => (
                <button
                  key={venue.id}
                  type="button"
                  onClick={() => selectVenue(venue)}
                  className="w-full flex items-start justify-between p-3 rounded-lg border border-mist bg-pure hover:border-coral hover:bg-blue/5 transition-all text-left"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{venue.name}</p>
                    <p className="text-sm text-zinc truncate">
                      {venue.address_line && `${venue.address_line}, `}
                      {venue.city}
                      {venue.state && `, ${venue.state}`}
                    </p>
                    {venue.rating && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-zinc">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{venue.rating.toFixed(1)}</span>
                        {venue.review_count > 0 && (
                          <span className="text-zinc/60">({venue.review_count})</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs bg-cloud text-zinc px-2 py-0.5 rounded capitalize flex-shrink-0 ml-2">
                    {venue.category || venue.venue_type}
                  </span>
                </button>
              ))}
            </div>
          )}

          {venueQuery.length >= 2 && !isSearching && venueResults.length === 0 && (
            <div className="p-3 bg-cloud/30 rounded-lg text-center">
              <p className="text-sm text-zinc">No venues found for &quot;{venueQuery}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
