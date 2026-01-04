/**
 * AUTH MODULE
 * ===========
 * Authentication utilities for Happenlist.
 *
 * 🔐 Role Hierarchy:
 *   - User: Regular authenticated user
 *   - Admin: Can approve/reject events, moderate content
 *   - Superadmin: Can edit/delete ANY event, manage system
 *
 * @module lib/auth
 */

// Admin utilities
export { isAdmin, requireAdmin, logAdminConfig } from './is-admin';

// Superadmin utilities
export {
  isSuperAdmin,
  requireSuperAdmin,
  getSuperAdminStatus,
  getSuperadminEmailList,
  logSuperadminConfig,
} from './is-superadmin';
export type { SuperAdminStatus } from './is-superadmin';

// Session utilities
export {
  getSession,
  requireAuth,
  requireAdminAuth,
  requireSuperadminAuth,
  getAuthenticatedSession,
  signInWithMagicLink,
  signOut,
} from './session';
export type { UserSession, SessionResult } from './session';
