/**
 * USER AVATAR COMPONENT
 * =====================
 * Displays a user's avatar with fallback to initials.
 *
 * If the user has an avatar URL, it shows their photo.
 * Otherwise, it shows their initials in a colored circle.
 *
 * The background color is derived from the user's email
 * for consistent coloring across the app.
 *
 * @module components/auth/user-avatar
 */

'use client';

import { useMemo } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface UserAvatarProps {
  /** User's display name */
  name?: string | null;

  /** User's email (used for color generation) */
  email?: string | null;

  /** Avatar image URL */
  avatarUrl?: string | null;

  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Size classes for different variants
 */
const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

/**
 * Icon sizes for fallback
 */
const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

/**
 * Warm, friendly colors for avatar backgrounds
 * These match the Happenlist design system
 */
const AVATAR_COLORS = [
  'bg-coral',           // Primary coral
  'bg-amber-500',       // Warm amber
  'bg-emerald-500',     // Fresh green
  'bg-sky-500',         // Sky blue
  'bg-violet-500',      // Soft violet
  'bg-pink-500',        // Playful pink
  'bg-orange-500',      // Warm orange
  'bg-teal-500',        // Cool teal
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get initials from a name or email
 *
 * @example
 * getInitials("John Doe") // "JD"
 * getInitials("john@example.com") // "J"
 * getInitials(null, "jane@example.com") // "J"
 */
function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  if (email) {
    const username = email.split('@')[0];
    return username[0].toUpperCase();
  }

  return '?';
}

/**
 * Get a consistent color based on email hash
 * Same email always gets same color
 */
function getColorFromEmail(email?: string | null): string {
  if (!email) return AVATAR_COLORS[0];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * User avatar with fallback to initials
 *
 * @example
 * // With image
 * <UserAvatar
 *   name="John Doe"
 *   avatarUrl="https://..."
 *   size="md"
 * />
 *
 * @example
 * // Fallback to initials
 * <UserAvatar
 *   name="John Doe"
 *   email="john@example.com"
 *   size="lg"
 * />
 */
export function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 'md',
  className,
}: UserAvatarProps) {
  // Memoize computed values
  const initials = useMemo(() => getInitials(name, email), [name, email]);
  const bgColor = useMemo(() => getColorFromEmail(email), [email]);

  // Base classes
  const baseClasses = cn(
    'inline-flex items-center justify-center',
    'rounded-full',
    'font-medium text-white',
    'select-none',
    'ring-2 ring-white',
    SIZE_CLASSES[size],
    className
  );

  // ---------------------------------------------------------------------------
  // RENDER: WITH IMAGE
  // ---------------------------------------------------------------------------

  if (avatarUrl) {
    return (
      <div className={baseClasses}>
        <img
          src={avatarUrl}
          alt={name || 'User avatar'}
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it (fallback will show)
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: FALLBACK WITH INITIALS
  // ---------------------------------------------------------------------------

  if (name || email) {
    return (
      <div className={cn(baseClasses, bgColor)}>
        <span className="font-semibold">{initials}</span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: GENERIC FALLBACK
  // ---------------------------------------------------------------------------

  return (
    <div className={cn(baseClasses, 'bg-stone')}>
      <User className={ICON_SIZES[size]} />
    </div>
  );
}
