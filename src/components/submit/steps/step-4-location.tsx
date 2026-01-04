/**
 * STEP 4: LOCATION
 * ==================
 * Fourth step of the event submission form.
 *
 * Options:
 *   - Select existing venue
 *   - Add new venue
 *   - Online event
 *   - Location TBD
 *
 * @module components/submit/steps/step-4-location
 */

'use client';

import { useState } from 'react';
import { MapPin, Search, Plus, Globe, HelpCircle } from 'lucide-react';
import { StepHeader } from '../step-progress';
import { Input } from '@/components/ui';
import type { EventDraftData, LocationMode, NewLocationData } from '@/types/submission';
import { LOCATION_MODE_LABELS } from '@/types/submission';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Venue {
  id: string;
  name: string;
  address_line: string | null;
  city: string;
  venue_type: string;
}

interface Step4Props {
  draftData: EventDraftData;
  updateData: (updates: Partial<EventDraftData>) => void;
  venues: Venue[];
  onSearchVenues: (query: string) => Promise<Venue[]>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Step4Location({
  draftData,
  updateData,
  venues: initialVenues,
  onSearchVenues,
}: Step4Props) {
  const [venueQuery, setVenueQuery] = useState('');
  const [venueResults, setVenueResults] = useState<Venue[]>(initialVenues);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  // ========== Venue Search ==========
  const handleVenueSearch = async (query: string) => {
    setVenueQuery(query);
    if (query.length < 2) {
      setVenueResults(initialVenues);
      return;
    }

    setIsSearching(true);
    try {
      const results = await onSearchVenues(query);
      setVenueResults(results);
    } catch (error) {
      console.error('Venue search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

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

  // ========== Mode Selection ==========
  const modeOptions: { mode: LocationMode; icon: React.ReactNode }[] = [
    { mode: 'existing', icon: <MapPin className="w-5 h-5" /> },
    { mode: 'new', icon: <Plus className="w-5 h-5" /> },
    { mode: 'online', icon: <Globe className="w-5 h-5" /> },
    { mode: 'tbd', icon: <HelpCircle className="w-5 h-5" /> },
  ];

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
                <p className={cn(
                  'font-medium',
                  isSelected ? 'text-coral' : 'text-charcoal'
                )}>
                  {config.title}
                </p>
                <p className="text-xs text-stone mt-0.5">
                  {config.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ========== Existing Venue Search ========== */}
      {draftData.location_mode === 'existing' && (
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
              placeholder="Type venue name..."
              className="pl-10"
            />
          </div>

          {/* Selected Venue */}
          {selectedVenue && venueResults.length === 0 && (
            <div className="mt-3 p-3 bg-sage/10 border border-sage/30 rounded-lg">
              <p className="font-medium text-charcoal">{selectedVenue.name}</p>
              <p className="text-sm text-stone">
                {selectedVenue.address_line && `${selectedVenue.address_line}, `}
                {selectedVenue.city}
              </p>
            </div>
          )}

          {/* Search Results */}
          {venueResults.length > 0 && venueQuery.length >= 2 && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {venueResults.map((venue) => (
                <button
                  key={venue.id}
                  type="button"
                  onClick={() => selectVenue(venue)}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg border text-left',
                    'hover:border-coral hover:bg-coral/5',
                    draftData.location_id === venue.id
                      ? 'border-coral bg-coral/10'
                      : 'border-sand bg-warm-white'
                  )}
                >
                  <div>
                    <p className="font-medium text-charcoal">{venue.name}</p>
                    <p className="text-sm text-stone">
                      {venue.address_line && `${venue.address_line}, `}
                      {venue.city}
                    </p>
                  </div>
                  <span className="text-xs bg-sand text-stone px-2 py-1 rounded">
                    {venue.venue_type}
                  </span>
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <p className="mt-3 text-sm text-stone">Searching...</p>
          )}
        </div>
      )}

      {/* ========== New Venue Form ========== */}
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
              onChange={(e) =>
                updateData({
                  new_location: {
                    ...draftData.new_location,
                    name: e.target.value,
                    city: draftData.new_location?.city || '',
                  },
                })
              }
              placeholder="e.g., The Music Hall"
            />
          </div>

          {/* Address */}
          <div>
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
          <div className="grid grid-cols-2 gap-4">
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
      )}

      {/* ========== Online Event Info ========== */}
      {draftData.location_mode === 'online' && (
        <div className="p-4 bg-cream rounded-lg border border-sand">
          <div className="flex items-center mb-3">
            <Globe className="w-5 h-5 text-coral mr-2" />
            <h3 className="font-medium text-charcoal">Online Event</h3>
          </div>
          <p className="text-sm text-stone mb-4">
            Add the event link or meeting URL in the pricing step (ticket URL field).
          </p>
        </div>
      )}

      {/* ========== TBD Info ========== */}
      {draftData.location_mode === 'tbd' && (
        <div className="p-4 bg-cream rounded-lg border border-sand">
          <div className="flex items-center mb-3">
            <HelpCircle className="w-5 h-5 text-coral mr-2" />
            <h3 className="font-medium text-charcoal">Location To Be Announced</h3>
          </div>
          <p className="text-sm text-stone">
            The event will show as &quot;Location TBD&quot;. You can update this later
            through your submissions page.
          </p>
        </div>
      )}
    </div>
  );
}
