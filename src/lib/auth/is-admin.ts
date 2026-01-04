/**
 * ADMIN DETECTION
 * ================
 * Utility for checking if a user has admin privileges.
 *
 * Admin emails are configured via environment variable.
 * This keeps admin management simple without needing a database role system.
 *
 * @module lib/auth/is-admin
 */

// ============================================================================
// ADMIN EMAIL LIST
// ============================================================================

/**
 * Parse admin emails from environment variable
 * Expected format: "admin1@example.com,admin2@example.com"
 */
function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  return adminEmailsEnv
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

// ============================================================================
// ADMIN CHECK FUNCTIONS
// ============================================================================

/**
 * Check if an email address belongs to an admin
 *
 * @param email - Email address to check
 * @returns true if the email is in the admin list
 *
 * @example
 * ```ts
 * if (isAdmin(user.email)) {
 *   // Show admin controls
 * }
 * ```
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Check if an email is admin and throw if not
 *
 * @param email - Email address to check
 * @throws Error if not an admin
 *
 * @example
 * ```ts
 * requireAdmin(user.email); // Throws if not admin
 * // Continue with admin-only operation
 * ```
 */
export function requireAdmin(email: string | null | undefined): void {
  if (!isAdmin(email)) {
    throw new Error('Unauthorized: Admin access required');
  }
}

/**
 * Get the list of admin emails (for debugging only)
 * Note: Only use this for logging, never expose to client
 */
export function getAdminEmailList(): string[] {
  if (process.env.NODE_ENV !== 'development') {
    return ['[hidden in production]'];
  }
  return getAdminEmails();
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Log admin configuration on startup (development only)
 */
export function logAdminConfig(): void {
  if (process.env.NODE_ENV === 'development') {
    const adminEmails = getAdminEmails();
    console.log('\n🔐 [Auth] Admin Configuration:');
    console.log(`   └─ ${adminEmails.length} admin email(s) configured`);
    if (adminEmails.length === 0) {
      console.log('   ⚠️ No admin emails configured. Set ADMIN_EMAILS in .env.local');
    }
  }
}
