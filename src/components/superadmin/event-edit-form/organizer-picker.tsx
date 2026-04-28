/**
 * EVENT EDIT FORM — ORGANIZER PICKER
 * ===================================
 * Self-contained organizer search + selection state. Hits
 * /api/submit/organizers/search for fuzzy lookup. Calls onChange whenever the
 * selected organizer changes (or is cleared); parent diffs against the
 * original `event.organizer_id` at save time.
 *
 * Extracted from the original monolithic event-edit-form.tsx (2026-04-22 split).
 *
 * @module components/superadmin/event-edit-form/organizer-picker
 */

'use client';

import { useState, useCallback } from 'react';
import { User, Search, Loader2 } from 'lucide-react';
import type { OrganizerSearchResult } from './helpers';

interface OrganizerPickerProps {
  initialOrganizer: OrganizerSearchResult | null;
  onChange: (organizer: OrganizerSearchResult | null) => void;
}

export function OrganizerPicker({ initialOrganizer, onChange }: OrganizerPickerProps) {
  const [selectedOrganizer, setSelectedOrganizer] = useState<OrganizerSearchResult | null>(initialOrganizer);
  const [organizerQuery, setOrganizerQuery] = useState('');
  const [organizerResults, setOrganizerResults] = useState<OrganizerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setOrganizerQuery(query);

    if (query.length < 2) {
      setOrganizerResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/submit/organizers/search?q=${encodeURIComponent(query)}&limit=10`
      );
      const result = await response.json();

      if (result.success) {
        setOrganizerResults(result.organizers);
      } else {
        setOrganizerResults([]);
      }
    } catch {
      setOrganizerResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectOrganizer = useCallback((organizer: OrganizerSearchResult) => {
    setSelectedOrganizer(organizer);
    setShowSearch(false);
    setOrganizerQuery('');
    setOrganizerResults([]);
    onChange(organizer);
  }, [onChange]);

  const clearOrganizer = useCallback(() => {
    setSelectedOrganizer(null);
    onChange(null);
  }, [onChange]);

  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-2">
        Organizer
      </label>

      {selectedOrganizer && !showSearch && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-ink">{selectedOrganizer.name}</p>
                {selectedOrganizer.website_url && (
                  <p className="text-sm text-zinc truncate max-w-[250px]">
                    {selectedOrganizer.website_url}
                  </p>
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
                onClick={clearOrganizer}
                className="text-sm text-zinc hover:text-ink"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedOrganizer && !showSearch && (
        <button
          type="button"
          onClick={() => setShowSearch(true)}
          className="w-full p-4 border border-dashed border-mist rounded-lg hover:border-coral hover:bg-blue/5 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cloud rounded-lg">
              <User className="w-5 h-5 text-zinc" />
            </div>
            <div>
              <p className="font-medium text-ink">No organizer selected</p>
              <p className="text-sm text-zinc">Click to search and select an organizer</p>
            </div>
          </div>
        </button>
      )}

      {showSearch && (
        <div className="p-4 bg-white rounded-lg border border-mist space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Search Organizers</p>
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setOrganizerQuery('');
                setOrganizerResults([]);
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
              value={organizerQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Type organizer name..."
              className="w-full pl-10 pr-10 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc animate-spin" />
            )}
          </div>

          {organizerResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {organizerResults.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => selectOrganizer(org)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg border border-mist bg-pure hover:border-coral hover:bg-blue/5 transition-all text-left"
                >
                  <User className="w-4 h-4 text-zinc mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{org.name}</p>
                    {org.website_url && (
                      <p className="text-xs text-zinc truncate">{org.website_url}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {organizerQuery.length >= 2 && !isSearching && organizerResults.length === 0 && (
            <div className="p-3 bg-cloud/30 rounded-lg text-center">
              <p className="text-sm text-zinc">No organizers found for &quot;{organizerQuery}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
