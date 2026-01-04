/**
 * USER DATA LAYER
 * ===============
 * Data access functions for user-related features.
 *
 * This module provides functions for:
 *   - Hearts (saving/favoriting events)
 *   - Follows (following organizers, venues, categories)
 *   - Profile (user settings and preferences)
 *
 * 📁 FILE STRUCTURE:
 *   src/data/user/
 *   ├── index.ts          # This file - barrel exports
 *   ├── toggle-heart.ts   # Add/remove heart on event
 *   ├── get-hearts.ts     # Get user's hearted events
 *   ├── check-hearts.ts   # Check if events are hearted
 *   ├── toggle-follow.ts  # Add/remove follow (coming soon)
 *   ├── get-follows.ts    # Get user's follows (coming soon)
 *   └── update-profile.ts # Update user profile (coming soon)
 *
 * @module data/user
 */

// ============================================================================
// HEARTS
// ============================================================================

export { toggleHeart } from './toggle-heart';
export type { ToggleHeartResult, ToggleHeartParams } from './toggle-heart';

export { getHearts, getHeartedEventIds } from './get-hearts';
export type { GetHeartsOptions, GetHeartsResult } from './get-hearts';

export { checkHearts, checkSingleHeart } from './check-hearts';
export type { HeartStatusMap, CheckHeartsResult } from './check-hearts';

// ============================================================================
// FOLLOWS
// ============================================================================

export { toggleFollow } from './toggle-follow';
export type {
  FollowEntityType,
  ToggleFollowResult,
  ToggleFollowParams,
} from './toggle-follow';

export { getFollows, checkFollow, getFollowedIds } from './get-follows';
export type {
  UserFollow,
  GetFollowsOptions,
  GetFollowsResult,
} from './get-follows';

// ============================================================================
// PROFILE
// ============================================================================

export { getProfile } from './get-profile';
export type { GetProfileResult } from './get-profile';

export { updateProfile } from './update-profile';
export type { UpdateProfileResult } from './update-profile';
