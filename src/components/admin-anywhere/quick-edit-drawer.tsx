'use client';

/**
 * QUICK EDIT DRAWER
 * =================
 * Slide-out panel for quick event editing from any page.
 *
 * Features:
 * - Smooth slide-in animation from right
 * - Backdrop overlay with click-to-close
 * - Escape key to close
 * - Focus trap when open
 * - Scrollable content area
 *
 * @module components/admin-anywhere/quick-edit-drawer
 */

import { useEffect, useCallback } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { QuickEditForm } from './quick-edit-form';
import type { AdminToolbarEvent } from './admin-toolbar';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('QuickEditDrawer');

// ============================================================================
// TYPES
// ============================================================================

interface QuickEditDrawerProps {
  /** Event data to edit */
  event: AdminToolbarEvent;
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Callback when save is successful */
  onSaveSuccess: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * QuickEditDrawer - Slide-out panel for editing events
 *
 * Opens from the right side of the screen with a backdrop overlay.
 * Contains the QuickEditForm for modifying event fields.
 *
 * @example
 * ```tsx
 * <QuickEditDrawer
 *   event={event}
 *   isOpen={isDrawerOpen}
 *   onClose={() => setIsDrawerOpen(false)}
 *   onSaveSuccess={() => router.refresh()}
 * />
 * ```
 */
export function QuickEditDrawer({
  event,
  isOpen,
  onClose,
  onSaveSuccess,
}: QuickEditDrawerProps) {
  // -------------------------------------------------------------------------
  // ESCAPE KEY HANDLER
  // -------------------------------------------------------------------------

  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        logger.debug('Escape pressed - closing drawer');
        onClose();
      }
    },
    [isOpen, onClose]
  );

  // Listen for escape key
  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [handleEscapeKey]);

  // -------------------------------------------------------------------------
  // BODY SCROLL LOCK
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
      logger.debug('Drawer opened - body scroll locked');
    } else {
      document.body.style.overflow = '';
      logger.debug('Drawer closed - body scroll restored');
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div className="w-screen max-w-md sm:max-w-lg">
          <div className="flex h-full flex-col bg-warm-white shadow-xl">
            {/* -------------------------------------------------------------- */}
            {/* Header */}
            {/* -------------------------------------------------------------- */}
            <div className="sticky top-0 z-10 bg-warm-white border-b border-sand px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-display font-semibold text-charcoal flex items-center gap-2">
                    <span>✏️</span>
                    Quick Edit
                  </h2>
                  <p className="mt-1 text-sm text-stone truncate max-w-[280px]">
                    {event.title}
                  </p>
                </div>

                {/* Close button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-2 text-stone hover:text-charcoal hover:bg-sand/50 transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Series warning */}
              {event.series_id && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">
                      Part of a series
                    </p>
                    <p className="text-blue-700 mt-0.5">
                      Changes only affect this event, not the whole series.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Content (scrollable) */}
            {/* -------------------------------------------------------------- */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-6 sm:px-6">
                <QuickEditForm
                  event={event}
                  onSaveSuccess={onSaveSuccess}
                  onCancel={onClose}
                />
              </div>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Footer note */}
            {/* -------------------------------------------------------------- */}
            <div className="border-t border-sand px-4 py-3 sm:px-6 bg-cream/50">
              <p className="text-xs text-stone text-center">
                For location, category, or image changes,{' '}
                <a
                  href={`/admin/events/${event.id}/edit`}
                  className="text-coral hover:underline font-medium"
                >
                  use Full Edit
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
