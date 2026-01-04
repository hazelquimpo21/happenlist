/**
 * HOOKS INDEX
 * ===========
 * Central export for all custom hooks.
 *
 * @module hooks
 */

// ============================================================================
// AUTH HOOKS
// ============================================================================

export { useAuth } from './use-auth';

// ============================================================================
// USER FEATURE HOOKS
// ============================================================================

export { useHeart } from './use-heart';
export type { UseHeartOptions, UseHeartReturn } from './use-heart';

// ============================================================================
// UI HOOKS
// ============================================================================

export { useDebounce } from './use-debounce';
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from './use-media-query';
