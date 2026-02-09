/**
 * STEP 4: LOCATION (ENHANCED)
 * ============================
 * Fourth step of the event submission form with smart venue search.
 *
 * Features:
 *   • Search 3500+ venues with fuzzy matching
 *   • Popular venues quick-select
 *   • Venue ratings and review counts
 *   • Mapbox address autocomplete for new venues
 *   • Mini-map preview for selected venue
 *
 * Options:
 *   - Select existing venue (smart search)
 *   - Add new venue (with address autocomplete)
 *   - Online event
 *   - Location TBD
 *
 * @module components/submit/steps/step-4-location
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Globe,
  HelpCircle,
  Star,
  Loader2,
  CheckCircle,
  Building,
} from 'lucide-react';
import { StepHeader } from '../step-progress';
import { Input } from '@/components/ui';
import { AddressSearch, type AddressResult } from '@/components/maps';
import type { EventDraftData, LocationMode } from '@/types/submission';
import { LOCATION_MODE_LABELS } from '@/types/submission';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Enhanced venue type with additional fields from import.
 */
interface Venue {
  id: string;
  name: string;
  slug: string;
  address_line: string | null;
  city: string;
  state: string | null;
  venue_type: string;
  category: string | null;
  rating: number | null;
  review_count: number;
  latitude: number | null;
  longitude: number | null;
}

interface Step4Props {
  draftData: EventDraftData;
  updateData: (updates: Partial<EventDraftData>) => void;
  popularVenues?: Venue[];
  onSearchVenues: (query: string) => Promise<Venue[]>;
  onFetchVenueById?: (id: string) => Promise<Venue | null>;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Displays venue rating with stars and review count.
 */
function VenueRating({
  rating,
  reviewCount,
}: {
  rating: number | null;
  reviewCount: number;
}) {
  if (!rating || reviewCount === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-stone">
      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
      <span>{rating.toFixed(1)}</span>
      <span className="text-stone/60">({reviewCount})</span>
    </div>
  );
}

/**
 * Badge showing venue category.
 */
function VenueTypeBadge({ type }: { type: string }) {
  return (
    <span className="text-xs bg-sand text-stone px-2 py-0.5 rounded capitalize">
      {type}
    </span>
  );
}

/**
 * Venue card for search results.
 */
function VenueCard({
  venue,
  isSelected,
  onClick,
}: {
  venue: Venue;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start justify-between p-3 rounded-lg border text-left',
        'hover:border-coral hover:bg-coral/5 transition-all',
        isSelected ? 'border-coral bg-coral/10' : 'border-sand bg-warm-white'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-charcoal truncate">{venue.name}</p>
          {isSelected && (
            <CheckCircle className="w-4 h-4 text-coral flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-stone truncate">
          {venue.address_line && `${venue.address_line}, `}
          {venue.city}
          {venue.state && `, ${venue.state}`}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <VenueRating rating={venue.rating} reviewCount={venue.review_count} />
        </div>
      </div>
      <div className="flex-shrink-0 ml-2">
        <VenueTypeBadge type={venue.category || venue.venue_type} />
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Step4Location({
  draftData,
  updateData,
  popularVenues = [],
  onSearchVenues,
  onFetchVenueById,
}: Step4Props) {
  // ========== State ==========
  const [venueQuery, setVenueQuery] = useState('');
  const [venueResults, setVenueResults] = useState<Venue[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [duplicateSuggestions, setDuplicateSuggestions] = useState<Venue[]>([]);

  // Number of popular venues to show initially
  const INITIAL_POPULAR_COUNT = 6;

  // ========== Effects ==========

  // Restore selected venue on mount if location_id exists in draft
  useEffect(() => {
    if (draftData.location_id && !selectedVenue && onFetchVenueById) {
      onFetchVenueById(draftData.location_id).then((venue) => {
        if (venue) {
          setSelectedVenue(venue);
          setVenueQuery(venue.name);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftData.location_id]);

  // ========== Venue Search (debounced) ==========
  const debounceRef = useRef<NodeJS.Timeout>();

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setVenueResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await onSearchVenues(query);
      setVenueResults(results);
    } catch (error) {
      console.error('🏛️ Venue search failed:', error);
      setVenueResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [onSearchVenues]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleVenueSearch = (query: string) => {
    setVenueQuery(query);

    if (query.length < 2) {
      setVenueResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  // ========== Duplicate Check (for new venue name) ==========
  const dupDebounceRef = useRef<NodeJS.Timeout>();

  const checkDuplicateVenue = useCallback((name: string) => {
    if (dupDebounceRef.current) clearTimeout(dupDebounceRef.current);

    if (name.length < 3) {
      setDuplicateSuggestions([]);
      return;
    }

    dupDebounceRef.current = setTimeout(async () => {
      try {
        const results = await onSearchVenues(name);
        // Only show high-relevance matches
        setDuplicateSuggestions(results.slice(0, 3));
      } catch {
        setDuplicateSuggestions([]);
      }
    }, 500);
  }, [onSearchVenues]);

  useEffect(() => {
    return () => {
      if (dupDebounceRef.current) clearTimeout(dupDebounceRef.current);
    };
  }, []);

  // ========== Select Venue ==========
  const selectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    updateData({
      location_id: venue.id,
      location_mode: 'existing',
    });
    setVenueQuery(venue.name);
    setVenueResults([]);
  };

  // ========== Clear Selection ==========
  const clearSelection = () => {
    setSelectedVenue(null);
    setVenueQuery('');
    setVenueResults([]);
    updateData({ location_id: undefined });
  };

  // ========== Address Selection (New Venue) ==========
  const handleAddressSelect = (result: AddressResult) => {
    updateData({
      new_location: {
        ...draftData.new_location,
        name: draftData.new_location?.name || result.placeName || '',
        address_line: result.street,
        city: result.city,
        state: result.state,
        postal_code: result.postalCode,
        latitude: result.coordinates.latitude,
        longitude: result.coordinates.longitude,
      },
    });
  };

  // ========== Mode Selection Options ==========
  const modeOptions: { mode: LocationMode; icon: React.ReactNode }[] = [
    { mode: 'existing', icon: <MapPin className="w-5 h-5" /> },
    { mode: 'new', icon: <Plus className="w-5 h-5" /> },
    { mode: 'online', icon: <Globe className="w-5 h-5" /> },
    { mode: 'tbd', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  // Popular venues to display
  const displayedPopularVenues = showAllPopular
    ? popularVenues
    : popularVenues.slice(0, INITIAL_POPULAR_COUNT);

  // ========== Render ==========
  return (
    <div className="space-y-6">
      <StepHeader
        step={4}
        title="Location"
        description="Where will your event take place?"
      />

      {/* ========== Mode Selection ========== */}
      <div className="grid grid-cols-2 gap-3">
        {modeOptions.map(({ mode, icon }) => {
          const config = LOCATION_MODE_LABELS[mode];
          const isSelected = draftData.location_mode === mode;

          return (
            <button
              key={mode}
              type="button"
              onClick={() => {
                updateData({ location_mode: mode });
                if (mode !== 'existing') {
                  updateData({ location_id: undefined });
                  setSelectedVenue(null);
                }
              }}
              className={cn(
                'flex items-center p-4 rounded-lg border text-left transition-all',
                'hover:border-coral hover:bg-coral/5',
                isSelected
                  ? 'border-coral bg-coral/10'
                  : 'border-sand bg-warm-white'
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 p-2 rounded-lg mr-3',
                  isSelected ? 'bg-coral text-white' : 'bg-sand text-stone'
                )}
              >
                {icon}
              </div>
              <div>
                <p
                  className={cn(
                    'font-medium',
                    isSelected ? 'text-coral' : 'text-charcoal'
                  )}
                >
                  {config.title}
                </p>
                <p className="text-xs text-stone mt-0.5">{config.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ========== Existing Venue Search ========== */}
      {draftData.location_mode === 'existing' && (
        <div className="space-y-4">
          {/* Selected Venue Display */}
          {selectedVenue && (
            <div className="p-4 bg-sage/10 border border-sage/30 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-sage" />
                    <p className="font-medium text-charcoal">
                      {selectedVenue.name}
                    </p>
                  </div>
                  <p className="text-sm text-stone mt-1 ml-7">
                    {selectedVenue.address_line && `${selectedVenue.address_line}, `}
                    {selectedVenue.city}
                    {selectedVenue.state && `, ${selectedVenue.state}`}
                  </p>
                  <div className="ml-7 mt-1">
                    <VenueRating
                      rating={selectedVenue.rating}
                      reviewCount={selectedVenue.review_count}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-sm text-coral hover:text-coral/80"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Search Box (hidden when venue selected) */}
          {!selectedVenue && (
            <div className="p-4 bg-cream rounded-lg border border-sand">
              <label className="block text-sm font-medium text-charcoal mb-2">
                Search Venues
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                <Input
                  type="text"
                  value={venueQuery}
                  onChange={(e) => handleVenueSearch(e.target.value)}
                  placeholder="Type venue name or address..."
                  className="pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone animate-spin" />
                )}
              </div>

              {/* Search Results */}
              {venueResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {venueResults.map((venue) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      isSelected={draftData.location_id === venue.id}
                      onClick={() => selectVenue(venue)}
                    />
                  ))}
                </div>
              )}

              {/* No Results */}
              {venueQuery.length >= 2 &&
                !isSearching &&
                venueResults.length === 0 && (
                  <div className="mt-3 p-3 bg-sand/30 rounded-lg text-center">
                    <p className="text-sm text-stone">
                      No venues found for &ldquo;{venueQuery}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        updateData({ location_mode: 'new' });
                      }}
                      className="mt-2 text-sm text-coral hover:text-coral/80 font-medium"
                    >
                      + Add a new venue instead
                    </button>
                  </div>
                )}
            </div>
          )}

          {/* Popular Venues (hidden when venue selected or searching) */}
          {!selectedVenue &&
            venueQuery.length < 2 &&
            popularVenues.length > 0 && (
              <div className="p-4 bg-warm-white rounded-lg border border-sand">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-4 h-4 text-coral" />
                  <h4 className="text-sm font-medium text-charcoal">
                    Popular Venues
                  </h4>
                </div>
                <div className="space-y-2">
                  {displayedPopularVenues.map((venue) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      isSelected={draftData.location_id === venue.id}
                      onClick={() => selectVenue(venue)}
                    />
                  ))}
                </div>
                {popularVenues.length > INITIAL_POPULAR_COUNT && (
                  <button
                    type="button"
                    onClick={() => setShowAllPopular(!showAllPopular)}
                    className="mt-3 text-sm text-coral hover:text-coral/80 font-medium"
                  >
                    {showAllPopular
                      ? 'Show less'
                      : `Show all ${popularVenues.length} popular venues`}
                  </button>
                )}
              </div>
            )}
        </div>
      )}

      {/* ========== New Venue Form (with Address Autocomplete) ========== */}
      {draftData.location_mode === 'new' && (
        <div className="p-4 bg-cream rounded-lg border border-sand space-y-4">
          <h3 className="font-medium text-charcoal">New Venue Details</h3>

          {/* Venue Name */}
          <div>
            <label
              htmlFor="venue_name"
              className="block text-sm font-medium text-charcoal mb-1"
            >
              Venue Name <span className="text-coral">*</span>
            </label>
            <Input
              id="venue_name"
              type="text"
              value={draftData.new_location?.name || ''}
              onChange={(e) => {
                const name = e.target.value;
                updateData({
                  new_location: {
                    ...draftData.new_location,
                    name,
                    city: draftData.new_location?.city || '',
                  },
                });
                checkDuplicateVenue(name);
              }}
              placeholder="e.g., The Music Hall"
            />

            {/* Did you mean? - duplicate venue suggestions */}
            {duplicateSuggestions.length > 0 && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-medium text-amber-800 mb-2">
                  Did you mean one of these existing venues?
                </p>
                <div className="space-y-1">
                  {duplicateSuggestions.map((venue) => (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => {
                        selectVenue(venue);
                        updateData({ location_mode: 'existing' });
                        setDuplicateSuggestions([]);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded text-left text-sm hover:bg-amber-100 transition-colors"
                    >
                      <span className="text-charcoal font-medium truncate">{venue.name}</span>
                      <span className="text-stone text-xs flex-shrink-0 ml-2">
                        {venue.city}{venue.state ? `, ${venue.state}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Address Autocomplete */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Search Address
            </label>
            <AddressSearch
              onSelect={handleAddressSelect}
              placeholder="Start typing an address..."
            />
            <p className="text-xs text-stone mt-1">
              Search for an address to auto-fill the fields below
            </p>
          </div>

          {/* Manual Address Fields (pre-filled from autocomplete) */}
          <div className="pt-2 border-t border-sand">
            <p className="text-xs text-stone mb-3">
              Or enter the address manually:
            </p>

            {/* Street Address */}
            <div className="mb-3">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-charcoal mb-1"
              >
                Street Address
              </label>
              <Input
                id="address"
                type="text"
                value={draftData.new_location?.address_line || ''}
                onChange={(e) =>
                  updateData({
                    new_location: {
                      ...draftData.new_location,
                      name: draftData.new_location?.name || '',
                      city: draftData.new_location?.city || '',
                      address_line: e.target.value,
                    },
                  })
                }
                placeholder="123 Main Street"
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-charcoal mb-1"
                >
                  City <span className="text-coral">*</span>
                </label>
                <Input
                  id="city"
                  type="text"
                  value={draftData.new_location?.city || ''}
                  onChange={(e) =>
                    updateData({
                      new_location: {
                        ...draftData.new_location,
                        name: draftData.new_location?.name || '',
                        city: e.target.value,
                      },
                    })
                  }
                  placeholder="Milwaukee"
                />
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-charcoal mb-1"
                >
                  State
                </label>
                <Input
                  id="state"
                  type="text"
                  value={draftData.new_location?.state || ''}
                  onChange={(e) =>
                    updateData({
                      new_location: {
                        ...draftData.new_location,
                        name: draftData.new_location?.name || '',
                        city: draftData.new_location?.city || '',
                        state: e.target.value,
                      },
                    })
                  }
                  placeholder="WI"
                />
              </div>
            </div>

            {/* Postal Code */}
            <div className="w-1/2">
              <label
                htmlFor="postal_code"
                className="block text-sm font-medium text-charcoal mb-1"
              >
                Postal Code
              </label>
              <Input
                id="postal_code"
                type="text"
                value={draftData.new_location?.postal_code || ''}
                onChange={(e) =>
                  updateData({
                    new_location: {
                      ...draftData.new_location,
                      name: draftData.new_location?.name || '',
                      city: draftData.new_location?.city || '',
                      postal_code: e.target.value,
                    },
                  })
                }
                placeholder="53202"
              />
            </div>
          </div>

          {/* Coordinates Status */}
          {draftData.new_location?.latitude &&
            draftData.new_location?.longitude && (
              <div className="flex items-center gap-2 text-sm text-sage">
                <CheckCircle className="w-4 h-4" />
                <span>
                  Coordinates captured ({draftData.new_location.latitude.toFixed(4)},{' '}
                  {draftData.new_location.longitude.toFixed(4)})
                </span>
              </div>
            )}
        </div>
      )}

      {/* ========== Online Event Info ========== */}
      {draftData.location_mode === 'online' && (
        <div className="p-4 bg-cream rounded-lg border border-sand">
          <div className="flex items-center mb-3">
            <Globe className="w-5 h-5 text-coral mr-2" />
            <h3 className="font-medium text-charcoal">Online Event</h3>
          </div>
          <p className="text-sm text-stone mb-4">
            Add the event link or meeting URL in the pricing step (ticket URL
            field).
          </p>
        </div>
      )}

      {/* ========== TBD Info ========== */}
      {draftData.location_mode === 'tbd' && (
        <div className="p-4 bg-cream rounded-lg border border-sand">
          <div className="flex items-center mb-3">
            <HelpCircle className="w-5 h-5 text-coral mr-2" />
            <h3 className="font-medium text-charcoal">
              Location To Be Announced
            </h3>
          </div>
          <p className="text-sm text-stone">
            The event will show as &quot;Location TBD&quot;. You can update this
            later through your submissions page.
          </p>
        </div>
      )}
    </div>
  );
}
