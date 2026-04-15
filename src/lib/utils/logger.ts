/**
 * ADMIN LOGGER UTILITY
 * ====================
 * Comprehensive logging for admin actions and troubleshooting.
 * Uses emoji prefixes for easy visual scanning in console.
 *
 * Log levels:
 *   - info:  General information
 *   - success: Successful operations
 *   - warn:  Warnings (not errors, but worth attention)
 *   - error: Errors and failures
 *   - debug: Detailed debugging info (only in development)
 */

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';

interface LogContext {
  action?: string;
  entityType?: string;
  entityId?: string;
  adminEmail?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// Emoji prefixes for different log types
const LOG_PREFIXES: Record<LogLevel, string> = {
  info: 'ℹ️',
  success: '✅',
  warn: '⚠️',
  error: '❌',
  debug: '🔍',
};

// Action-specific emoji prefixes
const ACTION_PREFIXES: Record<string, string> = {
  // Event actions
  event_approved: '✅ 🎫',
  event_rejected: '🚫 🎫',
  event_edited: '✏️ 🎫',
  event_deleted: '🗑️ 🎫',
  event_published: '📢 🎫',
  event_unpublished: '📥 🎫',
  event_fetch: '📋 🎫',
  event_fetch_single: '🔎 🎫',
  event_changes_req: '📝 🎫',

  // Superadmin actions
  superadmin_edit: '🦸 ✏️',
  superadmin_soft_delete: '🦸 🗑️',
  superadmin_hard_delete: '🦸 💥',
  superadmin_restore: '🦸 ♻️',
  superadmin_status_change: '🦸 🔄',
  superadmin_bulk_delete: '🦸 🗑️📦',
  superadmin_bulk_status: '🦸 🔄📦',

  // Admin actions
  admin_login: '🔐 👤',
  admin_logout: '🚪 👤',
  admin_action: '⚡ 👤',

  // Venue actions
  venue_created: '🏛️ ➕',
  venue_edited: '✏️ 🏛️',

  // Organizer actions
  organizer_created: '👥 ➕',
  organizer_edited: '✏️ 👥',

  // Search/fetch
  search: '🔍',
  fetch: '📋',
  fetch_stats: '📊',
};

/**
 * Format a log message with context
 */
function formatMessage(
  level: LogLevel,
  module: string,
  message: string,
  context?: LogContext
): string {
  const levelPrefix = LOG_PREFIXES[level];
  const actionPrefix = context?.action ? ACTION_PREFIXES[context.action] || '' : '';

  let formattedMessage = `${levelPrefix} ${actionPrefix} [${module}] ${message}`;

  // Add context details
  const contextParts: string[] = [];

  if (context?.entityType && context?.entityId) {
    contextParts.push(`${context.entityType}:${context.entityId.slice(0, 8)}...`);
  }

  if (context?.adminEmail) {
    contextParts.push(`admin:${context.adminEmail}`);
  }

  if (context?.duration !== undefined) {
    contextParts.push(`${context.duration}ms`);
  }

  if (contextParts.length > 0) {
    formattedMessage += ` (${contextParts.join(', ')})`;
  }

  return formattedMessage;
}

/**
 * Create a logger instance for a specific module
 */
export function createLogger(module: string) {
  const isDev = process.env.NODE_ENV === 'development';

  return {
    /**
     * Log info message
     */
    info(message: string, context?: LogContext) {
      console.log(formatMessage('info', module, message, context));
      if (context?.metadata && isDev) {
        console.log('    └─ metadata:', JSON.stringify(context.metadata, null, 2));
      }
    },

    /**
     * Log success message
     */
    success(message: string, context?: LogContext) {
      console.log(formatMessage('success', module, message, context));
      if (context?.metadata && isDev) {
        console.log('    └─ metadata:', JSON.stringify(context.metadata, null, 2));
      }
    },

    /**
     * Log warning message
     */
    warn(message: string, context?: LogContext) {
      console.warn(formatMessage('warn', module, message, context));
      if (context?.metadata) {
        console.warn('    └─ metadata:', JSON.stringify(context.metadata, null, 2));
      }
    },

    /**
     * Log error message
     */
    error(message: string, error?: unknown, context?: LogContext) {
      console.error(formatMessage('error', module, message, context));
      if (error) {
        if (error instanceof Error) {
          console.error('    └─ error:', error.message);
          if (isDev && error.stack) {
            console.error('    └─ stack:', error.stack);
          }
        } else {
          console.error('    └─ error:', JSON.stringify(error));
        }
      }
      if (context?.metadata) {
        console.error('    └─ metadata:', JSON.stringify(context.metadata, null, 2));
      }
    },

    /**
     * Log debug message (only in development)
     */
    debug(message: string, context?: LogContext) {
      if (isDev) {
        console.log(formatMessage('debug', module, message, context));
        if (context?.metadata) {
          console.log('    └─ metadata:', JSON.stringify(context.metadata, null, 2));
        }
      }
    },

    /**
     * Log the start of an operation (returns a function to log completion)
     */
    time(operation: string, context?: LogContext) {
      const start = performance.now();
      this.debug(`Starting: ${operation}`, context);

      return {
        /**
         * Log successful completion
         */
        success: (message?: string, additionalContext?: LogContext) => {
          const duration = Math.round(performance.now() - start);
          this.success(message || `Completed: ${operation}`, {
            ...context,
            ...additionalContext,
            duration,
          });
          return duration;
        },

        /**
         * Log failed completion
         */
        error: (message: string, error?: unknown, additionalContext?: LogContext) => {
          const duration = Math.round(performance.now() - start);
          this.error(`Failed: ${operation} - ${message}`, error, {
            ...context,
            ...additionalContext,
            duration,
          });
          return duration;
        },
      };
    },
  };
}

// ============================================================================
// ADMIN-SPECIFIC LOGGERS
// ============================================================================

/**
 * Logger for admin event operations
 */
export const adminEventLogger = createLogger('AdminEvents');

/**
 * Logger for admin API routes
 */
export const adminApiLogger = createLogger('AdminAPI');

/**
 * Logger for admin data operations
 */
export const adminDataLogger = createLogger('AdminData');

/**
 * Logger for audit trail
 */
export const auditLogger = createLogger('Audit');

/**
 * Logger for superadmin operations
 */
export const superadminLogger = createLogger('Superadmin');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Log an admin action to console (and database if configured)
 */
export function logAdminAction(
  action: string,
  entityType: string,
  entityId: string,
  adminEmail: string,
  details?: {
    changes?: Record<string, unknown>;
    notes?: string;
  }
) {
  auditLogger.info(`Admin action: ${action}`, {
    action,
    entityType,
    entityId,
    adminEmail,
    metadata: details,
  });
}

/**
 * Create a formatted log entry for structured logging
 */
export function createLogEntry(
  level: LogLevel,
  module: string,
  message: string,
  context?: LogContext
): {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  context?: LogContext;
} {
  return {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    context,
  };
}
