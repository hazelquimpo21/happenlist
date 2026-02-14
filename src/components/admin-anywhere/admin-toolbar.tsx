'use client';

/**
 * ADMIN TOOLBAR
 * =============
 * Sticky toolbar shown at the top of public event pages for superadmins.
 *
 * Features:
 * - Shows current event status with color-coded badge
 * - Quick Edit button to open inline edit drawer
 * - Full Edit link to comprehensive edit page
 * - Series indicator if event is part of a series
 *
 * @module components/admin-anywhere/admin-toolbar
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Pencil,
  ExternalLink,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { QuickEditDrawer } from './quick-edit-drawer';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('AdminToolbar');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Event data needed for the admin toolbar
 *
 * This is a minimal subset of event fields needed for the toolbar and edit form.
 * Passed from the server component to avoid re-fetching.
 */
export interface AdminToolbarEvent {
  id: string;
  title: string;
  slug: string;
  status: string;
  instance_date: string;
  start_datetime: string;
  end_datetime: string | null;
  description: string | null;
  short_description: string | null;
  price_type: string | null;
  price_low: number | null;
  price_high: number | null;
  is_free: boolean;
  ticket_url: string | null;
  is_all_day: boolean;
  // External links (added 2026-01-06)
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  registration_url: string | null;
  // Good For audience tags
  good_for: string[];
  // Cross-linked entities
  location: {
    id: string;
    name: string;
    slug: string;
    address_line: string | null;
    city: string;
    state: string | null;
    venue_type: string;
  } | null;
  organizer: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    website_url: string | null;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  category_id: string | null;
  location_id: string | null;
  organizer_id: string | null;
  // Series info
  series_id: string | null;
  series_title?: string | null;
}

interface AdminToolbarProps {
  /** Event data for display and editing */
  event: AdminToolbarEvent;
  /** Whether the current user is a superadmin */
  isSuperAdmin: boolean;
  /** Optional callback when event is updated */
  onEventUpdated?: () => void;
}

// ============================================================================
// STATUS BADGE CONFIG
// ============================================================================

/**
 * Status badge configuration
 *
 * Each status has:
 * - label: Human-readable display text
 * - className: Tailwind classes for colors
 * - emoji: Visual indicator
 */
const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; emoji: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-stone/20 text-stone border-stone/30',
    emoji: '📝',
  },
  pending_review: {
    label: 'Pending Review',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    emoji: '⏳',
  },
  changes_requested: {
    label: 'Changes Requested',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    emoji: '✏️',
  },
  published: {
    label: 'Published',
    className: 'bg-sage/20 text-sage border-sage/30',
    emoji: '✅',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border-red-200',
    emoji: '❌',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-stone/30 text-stone border-stone/40',
    emoji: '🚫',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AdminToolbar - Sticky toolbar for superadmin event editing
 *
 * This component renders a fixed toolbar at the top of event pages
 * that allows superadmins to quickly edit events without navigating
 * to the admin area.
 *
 * Only renders for superadmins. Returns null for regular users.
 *
 * @example
 * ```tsx
 * <AdminToolbar
 *   event={event}
 *   isSuperAdmin={session?.isSuperAdmin ?? false}
 *   onEventUpdated={() => router.refresh()}
 * />
 * ```
 */
export function AdminToolbar({
  event,
  isSuperAdmin,
  onEventUpdated,
}: AdminToolbarProps) {
  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // -------------------------------------------------------------------------
  // EARLY RETURN: Not a superadmin
  // -------------------------------------------------------------------------

  if (!isSuperAdmin) {
    logger.debug('Not showing toolbar - user is not superadmin');
    return null;
  }

  logger.debug('Showing admin toolbar for event:', event.title);

  // -------------------------------------------------------------------------
  // DERIVED VALUES
  // -------------------------------------------------------------------------

  const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.draft;
  const hasSeries = !!event.series_id;

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------

  const handleQuickEditClick = () => {
    logger.info('Opening quick edit drawer', { eventId: event.id });
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    logger.info('Closing quick edit drawer');
    setIsDrawerOpen(false);
  };

  const handleSaveSuccess = () => {
    logger.success('Event saved successfully');
    setIsDrawerOpen(false);
    // Notify parent to refresh data
    onEventUpdated?.();
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <>
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-purple-50 border-b border-purple-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 gap-4">
            {/* Left: Superadmin badge + Status */}
            <div className="flex items-center gap-3">
              {/* Superadmin badge */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 rounded-md">
                <Shield className="w-3.5 h-3.5 text-purple-700" />
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                  Superadmin
                </span>
              </div>

              {/* Status badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-medium ${statusConfig.className}`}
              >
                <span>{statusConfig.emoji}</span>
                <span>{statusConfig.label}</span>
              </div>

              {/* Series indicator */}
              {hasSeries && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md border border-blue-200">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">
                    {event.series_title || 'Part of Series'}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2">
              {/* Quick Edit button */}
              <button
                onClick={handleQuickEditClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Edit</span>
              </button>

              {/* Full Edit link */}
              <Link
                href={`/admin/events/${event.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 rounded-md text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Full Edit</span>
                <ChevronRight className="w-3 h-3 hidden sm:block" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Edit Drawer */}
      <QuickEditDrawer
        event={event}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onSaveSuccess={handleSaveSuccess}
      />
    </>
  );
}
