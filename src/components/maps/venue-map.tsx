/**
 * VENUE MAP COMPONENT
 * ===================
 * Displays a single venue location on an interactive map.
 *
 * Features:
 *   • Interactive Mapbox map
 *   • Custom marker with venue type color
 *   • Popup with venue info
 *   • "Get Directions" link
 *   • Responsive sizing
 *
 * Usage:
 *   <VenueMap
 *     latitude={43.0389}
 *     longitude={-87.9065}
 *     venueName="The Pabst Theater"
 *     venueType="entertainment"
 *   />
 *
 * @module components/maps/venue-map
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import {
  MAPBOX_ACCESS_TOKEN,
  isMapboxConfigured,
  MAP_STYLES,
  ZOOM_LEVELS,
  getMarkerColor,
} from '@/lib/mapbox/config';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface VenueMapProps {
  /** Venue latitude */
  latitude: number;

  /** Venue longitude */
  longitude: number;

  /** Venue name (for marker popup) */
  venueName: string;

  /** Venue address (for popup and directions) */
  address?: string;

  /** Venue type (for marker color) */
  venueType?: string;

  /** Map height */
  height?: string;

  /** Additional CSS classes */
  className?: string;

  /** Whether to show directions link */
  showDirections?: boolean;

  /** Zoom level */
  zoom?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VenueMap({
  latitude,
  longitude,
  venueName,
  address,
  venueType = 'venue',
  height = '300px',
  className,
  showDirections = true,
  zoom = ZOOM_LEVELS.venue,
}: VenueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== Initialize Map ==========
  useEffect(() => {
    // Check if Mapbox is configured
    if (!isMapboxConfigured()) {
      setError('Map not configured. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.');
      return;
    }

    // Check if container exists
    if (!mapContainerRef.current) return;

    // Dynamically import mapbox-gl to avoid SSR issues
    import('mapbox-gl').then((mapboxgl) => {
      // Set access token
      mapboxgl.default.accessToken = MAPBOX_ACCESS_TOKEN;

      // Create map
      const map = new mapboxgl.default.Map({
        container: mapContainerRef.current!,
        style: MAP_STYLES.light,
        center: [longitude, latitude],
        zoom,
        attributionControl: false,
      });

      // Store reference
      mapRef.current = map;

      // Add navigation controls
      map.addControl(
        new mapboxgl.default.NavigationControl({ showCompass: false }),
        'top-right'
      );

      // Add marker
      const markerColor = getMarkerColor(venueType);

      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'venue-marker';
      markerEl.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${markerColor};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 14px;
          ">📍</div>
        </div>
      `;

      new mapboxgl.default.Marker(markerEl)
        .setLngLat([longitude, latitude])
        .addTo(map);

      // Mark as loaded
      map.on('load', () => {
        setMapLoaded(true);
      });

      // Handle errors
      map.on('error', (e) => {
        console.error('🗺️ Map error:', e);
        setError('Failed to load map');
      });
    }).catch((err) => {
      console.error('🗺️ Failed to load Mapbox:', err);
      setError('Failed to load map library');
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, zoom, venueType]);

  // ========== Directions URL ==========
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  // ========== Render ==========

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-sand/50 rounded-lg border border-sand',
          className
        )}
        style={{ height }}
      >
        <AlertCircle className="w-8 h-8 text-stone mb-2" />
        <p className="text-sm text-stone text-center px-4">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height }}
      />

      {/* Loading overlay */}
      {!mapLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-cream rounded-lg"
          style={{ height }}
        >
          <div className="flex items-center text-stone">
            <MapPin className="w-5 h-5 mr-2 animate-pulse" />
            <span className="text-sm">Loading map...</span>
          </div>
        </div>
      )}

      {/* Directions Button */}
      {showDirections && mapLoaded && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'absolute bottom-3 left-3 z-10',
            'flex items-center gap-2 px-3 py-2',
            'bg-white rounded-lg shadow-md',
            'text-sm font-medium text-charcoal',
            'hover:bg-cream transition-colors'
          )}
        >
          <Navigation className="w-4 h-4 text-coral" />
          Get Directions
        </a>
      )}
    </div>
  );
}
