'use client';

/**
 * STATUS BADGE SELECT
 * ===================
 * A styled dropdown for selecting event status.
 *
 * Features:
 * - Color-coded status badges
 * - Emoji indicators
 * - Accessible dropdown
 *
 * @module components/admin-anywhere/status-badge-select
 */

import { ChevronDown } from 'lucide-react';

// ============================================================================
// STATUS OPTIONS
// ============================================================================

/**
 * Available event statuses with their display properties
 */
const STATUS_OPTIONS = [
  {
    value: 'draft',
    label: 'Draft',
    emoji: '📝',
    className: 'bg-zinc/20 text-zinc',
  },
  {
    value: 'pending_review',
    label: 'Pending Review',
    emoji: '⏳',
    className: 'bg-amber-100 text-amber-800',
  },
  {
    value: 'changes_requested',
    label: 'Changes Requested',
    emoji: '✏️',
    className: 'bg-orange-100 text-orange-800',
  },
  {
    value: 'published',
    label: 'Published',
    emoji: '✅',
    className: 'bg-emerald/20 text-emerald',
  },
  {
    value: 'rejected',
    label: 'Rejected',
    emoji: '❌',
    className: 'bg-red-100 text-red-800',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    emoji: '🚫',
    className: 'bg-zinc/30 text-zinc',
  },
];

// ============================================================================
// TYPES
// ============================================================================

interface StatusBadgeSelectProps {
  /** Current status value */
  value: string;
  /** Callback when status changes */
  onChange: (newStatus: string) => void;
  /** Whether the select is disabled */
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * StatusBadgeSelect - Styled dropdown for event status
 *
 * Displays status options with color-coded badges and emojis.
 *
 * @example
 * ```tsx
 * <StatusBadgeSelect
 *   value={formState.status}
 *   onChange={(newStatus) => setFormState({ ...formState, status: newStatus })}
 * />
 * ```
 */
export function StatusBadgeSelect({
  value,
  onChange,
  disabled = false,
}: StatusBadgeSelectProps) {
  // Find current status option
  const currentOption =
    STATUS_OPTIONS.find((opt) => opt.value === value) || STATUS_OPTIONS[0];

  return (
    <div className="relative">
      {/* Custom styled select wrapper */}
      <div
        className={`
          relative flex items-center gap-2 px-3 py-2
          border border-mist rounded-lg
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Current status badge */}
        <span
          className={`
            inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-sm font-medium
            ${currentOption.className}
          `}
        >
          <span>{currentOption.emoji}</span>
          <span>{currentOption.label}</span>
        </span>

        {/* Dropdown indicator */}
        <ChevronDown className="w-4 h-4 text-zinc ml-auto" />

        {/* Actual select (invisible but functional) */}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Event status"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.emoji} {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status explanation */}
      <p className="text-xs text-zinc mt-1.5">
        {getStatusHint(value)}
      </p>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get a hint text for each status
 */
function getStatusHint(status: string): string {
  const hints: Record<string, string> = {
    draft: 'Not visible to the public. Only you can see this.',
    pending_review: 'Waiting for admin approval before going live.',
    changes_requested: 'Admin requested changes. Edit and resubmit.',
    published: 'Live and visible to everyone!',
    rejected: 'Not approved. See rejection reason for details.',
    cancelled: 'Event cancelled. Still visible with cancelled badge.',
  };

  return hints[status] || 'Select a status for this event.';
}

// ============================================================================
// EXPORTS
// ============================================================================

export { STATUS_OPTIONS };
