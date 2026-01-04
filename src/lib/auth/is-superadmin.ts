/**
 * 🦸 SUPERADMIN DETECTION
 * ========================
 * Utility for checking if a user has superadmin privileges.
 *
 * Superadmins have the highest level of access:
 * - Can edit ANY event (regardless of who created it)
 * - Can delete ANY event
 * - Can manage users and roles
 * - Can access all admin features
 *
 * 🔐 SECURITY NOTES:
 * - Superadmin emails are configured via SUPERADMIN_EMAILS environment variable
 * - This is the app-layer check (first line of defense)
 * - Database also has RLS policies checking user_roles table (second line)
 * - This dual approach ensures security even if one layer fails
 *
 * @module lib/auth/is-superadmin
 */

// ============================================================================
// 📧 SUPERADMIN EMAIL LIST
// ============================================================================

/**
 * Parse superadmin emails from environment variable.
 * Expected format: "superadmin1@example.com,superadmin2@example.com"
 *
 * @returns Array of lowercase email addresses
 */
function getSuperadminEmails(): string[] {
  const superadminEmailsEnv = process.env.SUPERADMIN_EMAILS || '';
  return superadminEmailsEnv
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

// ============================================================================
// 🔍 SUPERADMIN CHECK FUNCTIONS
// ============================================================================

/**
 * Check if an email address belongs to a superadmin.
 *
 * @param email - Email address to check
 * @returns true if the email is in the superadmin list
 *
 * @example
 * ```ts
 * if (isSuperAdmin(user.email)) {
 *   // Show superadmin controls (edit any event, delete, etc.)
 * }
 * ```
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) {
    console.log('🦸 [isSuperAdmin] No email provided → false');
    return false;
  }

  const superadminEmails = getSuperadminEmails();
  const isSuperadmin = superadminEmails.includes(email.toLowerCase());

  if (process.env.NODE_ENV === 'development') {
    console.log(`🦸 [isSuperAdmin] Checking "${email}" → ${isSuperadmin ? '✅ YES' : '❌ NO'}`);
  }

  return isSuperadmin;
}

/**
 * Check if an email is superadmin and throw if not.
 * Use this to guard superadmin-only operations.
 *
 * @param email - Email address to check
 * @throws Error if not a superadmin
 *
 * @example
 * ```ts
 * requireSuperAdmin(user.email); // Throws if not superadmin
 * // Continue with superadmin-only operation
 * ```
 */
export function requireSuperAdmin(email: string | null | undefined): void {
  if (!isSuperAdmin(email)) {
    console.error('🦸 [requireSuperAdmin] ❌ Access denied for:', email || '(no email)');
    throw new Error('Unauthorized: Superadmin access required');
  }
  console.log('🦸 [requireSuperAdmin] ✅ Access granted for:', email);
}

/**
 * Get superadmin status with detailed info.
 * Useful for UI decisions and logging.
 *
 * @param email - Email address to check
 * @returns Object with superadmin status and metadata
 *
 * @example
 * ```ts
 * const status = getSuperAdminStatus(user.email);
 * if (status.isSuperAdmin) {
 *   console.log('User is superadmin, can edit any event');
 * }
 * ```
 */
export function getSuperAdminStatus(email: string | null | undefined): {
  isSuperAdmin: boolean;
  email: string | null;
  checkedAt: string;
} {
  return {
    isSuperAdmin: isSuperAdmin(email),
    email: email || null,
    checkedAt: new Date().toISOString(),
  };
}

// ============================================================================
// 🔧 DEBUG & CONFIGURATION
// ============================================================================

/**
 * Get the list of superadmin emails (for debugging only).
 * In production, returns a placeholder to avoid exposing the list.
 *
 * @returns Array of superadmin emails (hidden in production)
 */
export function getSuperadminEmailList(): string[] {
  if (process.env.NODE_ENV !== 'development') {
    return ['[hidden in production]'];
  }
  return getSuperadminEmails();
}

/**
 * Log superadmin configuration on startup (development only).
 * Call this in your app initialization to verify setup.
 */
export function logSuperadminConfig(): void {
  if (process.env.NODE_ENV === 'development') {
    const superadminEmails = getSuperadminEmails();
    console.log('\n🦸 [Auth] Superadmin Configuration:');
    console.log(`   └─ ${superadminEmails.length} superadmin email(s) configured`);

    if (superadminEmails.length === 0) {
      console.log('   ⚠️  No superadmin emails configured!');
      console.log('   💡 Add SUPERADMIN_EMAILS to your .env.local file:');
      console.log('      SUPERADMIN_EMAILS=your-email@example.com');
    } else {
      superadminEmails.forEach((email, i) => {
        console.log(`   ${i === superadminEmails.length - 1 ? '└─' : '├─'} ${email}`);
      });
    }
  }
}

// ============================================================================
// 🏷️ TYPE EXPORTS
// ============================================================================

/**
 * Superadmin status object type.
 */
export interface SuperAdminStatus {
  isSuperAdmin: boolean;
  email: string | null;
  checkedAt: string;
}
