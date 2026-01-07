/**
 * ADDRESS SEARCH COMPONENT
 * ========================
 * Mapbox-powered address autocomplete for new venue creation.
 *
 * Features:
 *   • Type-ahead address search
 *   • Powered by Mapbox Geocoding API
 *   • Returns full address components + coordinates
 *   • Debounced search for performance
 *   • Keyboard navigation
 *
 * Usage:
 *   <AddressSearch
 *     onSelect={(result) => {
 *       console.log(result.address, result.coordinates);
 *     }}
 *   />
 *
 * @module components/maps/address-search
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, AlertCircle } from 'lucide-react';
import {
  MAPBOX_ACCESS_TOKEN,
  isMapboxConfigured,
  GEOCODING_CONFIG,
} from '@/lib/mapbox/config';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Parsed address result from Mapbox Geocoding API.
 */
export interface AddressResult {
  /** Full formatted address */
  fullAddress: string;

  /** Street address (e.g., "123 Main St") */
  street: string;

  /** City name */
  city: string;

  /** State code (e.g., "WI") */
  state: string;

  /** Postal code */
  postalCode: string;

  /** Country code (e.g., "US") */
  country: string;

  /** Coordinates [longitude, latitude] */
  coordinates: {
    latitude: number;
    longitude: number;
  };

  /** Place name (for POIs) */
  placeName?: string;
}

interface AddressSearchProps {
  /** Callback when an address is selected */
  onSelect: (result: AddressResult) => void;

  /** Initial value */
  initialValue?: string;

  /** Placeholder text */
  placeholder?: string;

  /** Additional CSS classes */
  className?: string;

  /** Whether the input is disabled */
  disabled?: boolean;
}

// ============================================================================
// GEOCODING API
// ============================================================================

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  address?: string;
  text: string;
}

interface MapboxResponse {
  features: MapboxFeature[];
}

/**
 * Searches for addresses using Mapbox Geocoding API.
 */
async function searchAddresses(query: string): Promise<MapboxFeature[]> {
  if (!query || query.length < 3) return [];

  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    country: GEOCODING_CONFIG.country,
    proximity: GEOCODING_CONFIG.proximity.join(','),
    types: GEOCODING_CONFIG.types.join(','),
    limit: String(GEOCODING_CONFIG.limit),
  });

  const url = `${GEOCODING_CONFIG.endpoint}/${encodeURIComponent(query)}.json?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Geocoding request failed');

    const data: MapboxResponse = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('🗺️ Geocoding error:', error);
    return [];
  }
}

/**
 * Parses a Mapbox feature into our AddressResult format.
 */
function parseFeature(feature: MapboxFeature): AddressResult {
  // Extract address components from context
  const context = feature.context || [];

  const getContextValue = (prefix: string): string => {
    const item = context.find((c) => c.id.startsWith(prefix));
    return item?.text || '';
  };

  const getContextShortCode = (prefix: string): string => {
    const item = context.find((c) => c.id.startsWith(prefix));
    return item?.short_code?.replace('US-', '') || item?.text || '';
  };

  // Build street address
  let street = '';
  if (feature.address && feature.text) {
    street = `${feature.address} ${feature.text}`;
  } else if (feature.place_type.includes('poi')) {
    street = feature.text;
  }

  return {
    fullAddress: feature.place_name,
    street,
    city: getContextValue('place'),
    state: getContextShortCode('region'),
    postalCode: getContextValue('postcode'),
    country: getContextShortCode('country') || 'US',
    coordinates: {
      longitude: feature.center[0],
      latitude: feature.center[1],
    },
    placeName: feature.place_type.includes('poi') ? feature.text : undefined,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AddressSearch({
  onSelect,
  initialValue = '',
  placeholder = 'Search for an address...',
  className,
  disabled = false,
}: AddressSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Check configuration
  const isConfigured = isMapboxConfigured();

  // ========== Debounced Search ==========
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!isConfigured) {
      setError('Address search not configured');
      return;
    }

    if (searchQuery.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const features = await searchAddresses(searchQuery);
      setResults(features);
      setIsOpen(features.length > 0);
      setSelectedIndex(-1);
    } catch {
      setError('Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  // ========== Handle Input Change ==========
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // ========== Handle Selection ==========
  const handleSelect = (feature: MapboxFeature) => {
    const result = parseFeature(feature);
    setQuery(result.fullAddress);
    setIsOpen(false);
    setResults([]);
    onSelect(result);
  };

  // ========== Keyboard Navigation ==========
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // ========== Click Outside to Close ==========
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ========== Cleanup ==========
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ========== Render ==========

  if (!isConfigured) {
    return (
      <div className={cn('relative', className)}>
        <div className="flex items-center gap-2 p-3 bg-sand/50 rounded-lg text-stone text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Address search requires NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone animate-spin" />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className={cn(
            'absolute z-50 w-full mt-1',
            'bg-white rounded-lg border border-sand shadow-lg',
            'max-h-64 overflow-y-auto'
          )}
        >
          {results.map((feature, index) => (
            <button
              key={feature.id}
              type="button"
              onClick={() => handleSelect(feature)}
              className={cn(
                'w-full flex items-start gap-3 p-3 text-left',
                'hover:bg-cream transition-colors',
                index === selectedIndex && 'bg-cream',
                index !== results.length - 1 && 'border-b border-sand/50'
              )}
            >
              <MapPin className="w-4 h-4 text-coral mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-charcoal truncate">
                  {feature.text}
                </p>
                <p className="text-sm text-stone truncate">
                  {feature.place_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && results.length === 0 && query.length >= 3 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 p-3 bg-white rounded-lg border border-sand shadow-lg">
          <p className="text-sm text-stone text-center">No addresses found</p>
        </div>
      )}
    </div>
  );
}
