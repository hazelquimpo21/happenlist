/**
 * USER & AUTH TYPES
 * =================
 * Type definitions for user authentication, sessions, and profiles.
 *
 * These types power the entire auth system - from login to user menus.
 *
 * @module types/user
 */

// ============================================================================
// USER ROLES
// ============================================================================

/**
 * User role levels (hierarchical)
 *
 * 🌐 guest      → Not logged in (anonymous visitor)
 * 👤 attendee   → Logged in user (can submit events, save hearts)
 * 📣 organizer  → Verified organizer (can manage their events)
 * 🔑 admin      → Admin (can approve/reject events)
 * 🦸 superadmin → Superadmin (can edit ANY event from anywhere)
 */
export type UserRole = 'guest' | 'attendee' | 'organizer' | 'admin' | 'superadmin';

// ============================================================================
// USER SESSION
// ============================================================================

/**
 * User session data - what we know about the logged-in user
 *
 * This is the core type used throughout the app to represent
 * an authenticated user's identity and permissions.
 */
export interface UserSession {
  /** Unique user ID from Supabase auth.users */
  id: string;

  /** User's email address */
  email: string;

  /** Display name (from profile or email prefix) */
  name: string | null;

  /** Avatar URL (from profile or null) */
  avatarUrl: string | null;

  /** User's role level */
  role: UserRole;

  /** Quick check: is this user an admin? */
  isAdmin: boolean;

  /** Quick check: is this user a superadmin? (can edit any event from anywhere) */
  isSuperAdmin: boolean;

  /** If user has claimed an organizer, this is the organizer ID */
  organizerId: string | null;

  /** When the user account was created */
  createdAt: string;
}

// ============================================================================
// AUTH CONTEXT
// ============================================================================

/**
 * Auth context value - what the AuthProvider exposes to the app
 *
 * Use the `useAuth()` hook to access these values in any component.
 */
export interface AuthContextValue {
  /** Current user session (null if not logged in) */
  session: UserSession | null;

  /** True while loading initial session */
  isLoading: boolean;

  /** True if user is authenticated */
  isAuthenticated: boolean;

  /**
   * Send a magic link email for sign in
   * @param email - Email address to send link to
   * @param redirectTo - Where to redirect after auth (optional)
   * @returns Success status and any error message
   */
  signIn: (
    email: string,
    redirectTo?: string
  ) => Promise<{ success: boolean; error: string | null }>;

  /**
   * Sign out the current user
   */
  signOut: () => Promise<void>;

  /**
   * Refresh the session (useful after profile updates)
   */
  refresh: () => Promise<void>;
}

// ============================================================================
// PROFILE TYPES
// ============================================================================

/**
 * User profile data from the `profiles` table
 *
 * Profiles are auto-created when a user signs up.
 * They store user preferences and display info.
 */
export interface Profile {
  /** Profile ID (matches auth.users.id) */
  id: string;

  /** User's email */
  email: string;

  /** Display name shown in UI */
  display_name: string | null;

  /** Avatar URL */
  avatar_url: string | null;

  /** Receive email notifications? */
  email_notifications: boolean;

  /** Receive weekly digest email? */
  email_weekly_digest: boolean;

  /** User's timezone for event times */
  timezone: string;

  /** When profile was created */
  created_at: string;

  /** When profile was last updated */
  updated_at: string;
}

/**
 * Data for updating a profile
 *
 * Only include fields you want to change.
 */
export interface ProfileUpdateData {
  display_name?: string;
  avatar_url?: string;
  email_notifications?: boolean;
  email_weekly_digest?: boolean;
  timezone?: string;
}

// ============================================================================
// AUTH FLOW TYPES
// ============================================================================

/**
 * States for the login form
 */
export type LoginFormState =
  | 'idle'           // Initial state - showing email input
  | 'loading'        // Sending magic link
  | 'success'        // Magic link sent - check email
  | 'error';         // Something went wrong

/**
 * Result of auth callback processing
 */
export interface AuthCallbackResult {
  /** Did the auth succeed? */
  success: boolean;

  /** User session (if success) */
  session: UserSession | null;

  /** Where to redirect after auth */
  redirectTo: string;

  /** Error message (if failed) */
  error: string | null;
}

/**
 * Protected route check result
 */
export interface AuthCheckResult {
  /** Is the user authenticated? */
  authenticated: boolean;

  /** Is the user authorized for this route? */
  authorized: boolean;

  /** User session (if authenticated) */
  session: UserSession | null;

  /** Where to redirect (if not authorized) */
  redirectTo: string | null;
}

// ============================================================================
// HEART TYPES (Saved Events)
// ============================================================================

/**
 * A heart record - user has saved this event
 */
export interface Heart {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

/**
 * Heart with event details (for "My Hearts" page)
 */
export interface HeartedEvent {
  heart_id: string;
  user_id: string;
  hearted_at: string;
  event_id: string;
  title: string;
  slug: string;
  instance_date: string;
  start_datetime: string;
  end_datetime: string | null;
  image_url: string | null;
  short_description: string | null;
  is_free: boolean;
  price_low: number | null;
  price_high: number | null;
  status: string;
  category_name: string | null;
  category_slug: string | null;
  location_name: string | null;
  location_city: string | null;
}

// ============================================================================
// ORGANIZER CLAIM TYPES
// ============================================================================

/**
 * Status of an organizer claim request
 */
export type ClaimStatus = 'unclaimed' | 'pending' | 'verified' | 'rejected';

/**
 * Organizer with claim information
 */
export interface OrganizerWithClaim {
  id: string;
  name: string;
  slug: string;
  user_id: string | null;
  claimed_at: string | null;
  claim_verified: boolean;
  claim_status: ClaimStatus;
}

/**
 * Request to claim an organizer profile
 */
export interface ClaimOrganizerRequest {
  organizer_id: string;
  user_email: string;
  verification_method: 'email' | 'admin';
}
