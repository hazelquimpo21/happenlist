/**
 * HEADER AUTH COMPONENT
 * =====================
 * Client-side auth controls for the header.
 *
 * Shows:
 * - "Login" button for guests
 * - User menu dropdown for authenticated users
 * - Loading skeleton while auth is initializing
 *
 * This is a client component because it needs access to auth state.
 * It's imported by the Header component.
 *
 * @module components/layout/header-auth
 */

'use client';

import Link from 'next/link';
import { LogIn, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { UserMenu } from '@/components/auth/user-menu';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

// ============================================================================
// LOADING SKELETON
// ============================================================================

/**
 * Loading skeleton for auth buttons
 */
function AuthSkeleton() {
  return (
    <div className="flex items-center gap-2">
      {/* Submit button skeleton */}
      <div className="hidden md:block w-28 h-9 rounded-md bg-sand animate-pulse" />
      {/* Login button skeleton */}
      <div className="w-20 h-9 rounded-md bg-sand animate-pulse" />
    </div>
  );
}

// ============================================================================
// GUEST BUTTONS
// ============================================================================

/**
 * Buttons shown to guests (not logged in)
 */
function GuestButtons() {
  return (
    <div className="flex items-center gap-2">
      {/* Submit Event Button (desktop only) */}
      <Button
        href="/submit/new"
        variant="secondary"
        size="sm"
        leftIcon={<Plus className="w-4 h-4" />}
        className="hidden md:inline-flex"
      >
        Submit Event
      </Button>

      {/* Login Button */}
      <Button
        href="/auth/login"
        variant="primary"
        size="sm"
        leftIcon={<LogIn className="w-4 h-4" />}
      >
        Login
      </Button>
    </div>
  );
}

// ============================================================================
// AUTHENTICATED BUTTONS
// ============================================================================

interface AuthenticatedButtonsProps {
  session: NonNullable<ReturnType<typeof useAuth>['session']>;
  onSignOut: () => void;
}

/**
 * Buttons shown to authenticated users
 */
function AuthenticatedButtons({ session, onSignOut }: AuthenticatedButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Submit Event Button (desktop only) */}
      <Button
        href="/submit/new"
        variant="secondary"
        size="sm"
        leftIcon={<Plus className="w-4 h-4" />}
        className="hidden md:inline-flex"
      >
        Submit Event
      </Button>

      {/* User Menu */}
      <UserMenu session={session} onSignOut={onSignOut} />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Header auth controls
 *
 * Automatically shows the right UI based on auth state:
 * - Loading → Skeleton
 * - Guest → Login button
 * - Authenticated → User menu
 */
export function HeaderAuth() {
  const { session, isLoading, signOut } = useAuth();

  // Show skeleton while loading
  if (isLoading) {
    return <AuthSkeleton />;
  }

  // Show user menu if authenticated
  if (session) {
    return <AuthenticatedButtons session={session} onSignOut={signOut} />;
  }

  // Show login button for guests
  return <GuestButtons />;
}
