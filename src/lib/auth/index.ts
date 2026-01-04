/**
 * AUTH MODULE
 * ===========
 * Authentication utilities for Happenlist.
 *
 * @module lib/auth
 */

export { isAdmin, requireAdmin, logAdminConfig } from './is-admin';
export {
  getSession,
  requireAuth,
  requireAdminAuth,
  getAuthenticatedSession,
  signInWithMagicLink,
  signOut,
} from './session';
export type { UserSession, SessionResult } from './session';
