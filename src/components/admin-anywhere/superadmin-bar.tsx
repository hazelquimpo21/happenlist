/**
 * SUPERADMIN BAR
 * ==============
 * Generic sticky toolbar shown at the top of public pages for superadmins.
 *
 * Unlike AdminToolbar (which is event-specific with quick edit/status),
 * this component works for any entity type: organizers, venues, series, etc.
 *
 * Features:
 * - Shows superadmin badge (purple)
 * - Shows entity type and name
 * - Optional link to admin area
 *
 * @module components/admin-anywhere/superadmin-bar
 */

import { Shield, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface SuperadminBarProps {
  /** The type of entity being viewed */
  entityType: 'organizer' | 'venue' | 'series';
  /** The entity name to display */
  entityName: string;
  /** The entity ID (for admin links) */
  entityId: string;
  /** Optional admin edit URL */
  adminUrl?: string;
}

// ============================================================================
// DISPLAY CONFIG
// ============================================================================

const ENTITY_LABELS: Record<SuperadminBarProps['entityType'], string> = {
  organizer: 'Organizer',
  venue: 'Venue',
  series: 'Series',
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SuperadminBar - Generic sticky toolbar for superadmin visibility.
 *
 * Renders a purple toolbar at the top of entity pages so superadmins
 * can quickly identify their elevated access and navigate to admin tools.
 */
export function SuperadminBar({
  entityType,
  entityName,
  entityId,
  adminUrl,
}: SuperadminBarProps) {
  return (
    <div className="sticky top-0 z-50 bg-purple-50 border-b border-purple-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 gap-4">
          {/* Left: Superadmin badge + Entity type */}
          <div className="flex items-center gap-3">
            {/* Superadmin badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 rounded-md">
              <Shield className="w-3.5 h-3.5 text-purple-700" />
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                Superadmin
              </span>
            </div>

            {/* Entity type badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-white/60 border-purple-200 text-sm font-medium text-purple-800">
              <span>{ENTITY_LABELS[entityType]}</span>
            </div>

            {/* Entity name (truncated on small screens) */}
            <span className="text-sm text-purple-700 truncate max-w-[200px] sm:max-w-none hidden sm:inline">
              {entityName}
            </span>
          </div>

          {/* Right: Admin link (if available) */}
          <div className="flex items-center gap-2">
            {adminUrl && (
              <Link
                href={adminUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 rounded-md text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Edit in Admin</span>
                <ChevronRight className="w-3 h-3 hidden sm:block" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
