// ============================================================================
// 📝 HAPPENLIST - Logger Utility
// ============================================================================
// A friendly, colorful logger for development and debugging.
// Uses emojis and formatting to make logs easy to read and understand.
//
// Features:
//   - Colored output with emojis
//   - Different log levels (debug, info, warn, error)
//   - Structured data logging
//   - Environment-aware (less verbose in production)
// ============================================================================

// Log levels from least to most severe
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// Configuration
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Emoji prefixes for each level
const LOG_EMOJIS: Record<LogLevel, string> = {
  debug: '🔍',
  info: '📘',
  warn: '⚠️',
  error: '🚨',
}

// Colors for terminal output (ANSI codes)
const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
}

const RESET_COLOR = '\x1b[0m'
const DIM_COLOR = '\x1b[2m'

// ============================================================================
// 🛠️ Logger Implementation
// ============================================================================

/**
 * Formats the current timestamp for log output.
 * Format: HH:MM:SS.mmm
 */
function getTimestamp(): string {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  return `${hours}:${minutes}:${seconds}.${ms}`
}

/**
 * Formats additional data for logging.
 * Objects are pretty-printed, other values are stringified.
 */
function formatData(data: unknown): string {
  if (data === undefined || data === null) {
    return ''
  }

  if (typeof data === 'object') {
    try {
      return '\n' + JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  return String(data)
}

/**
 * Determines if we should log at this level.
 * In production, we skip debug logs.
 */
function shouldLog(level: LogLevel): boolean {
  const minLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel]
}

/**
 * Internal logging function.
 */
function log(level: LogLevel, message: string, data?: unknown): void {
  if (!shouldLog(level)) {
    return
  }

  const emoji = LOG_EMOJIS[level]
  const color = LOG_COLORS[level]
  const timestamp = getTimestamp()
  const formattedData = formatData(data)

  // Format: [HH:MM:SS.mmm] 📘 Message
  const prefix = `${DIM_COLOR}[${timestamp}]${RESET_COLOR}`
  const coloredMessage = `${color}${emoji} ${message}${RESET_COLOR}`

  // Use appropriate console method
  const consoleMethod = level === 'error' ? console.error :
                        level === 'warn' ? console.warn :
                        console.log

  if (formattedData) {
    consoleMethod(`${prefix} ${coloredMessage}${formattedData}`)
  } else {
    consoleMethod(`${prefix} ${coloredMessage}`)
  }
}

// ============================================================================
// 📤 Exported Logger Object
// ============================================================================

/**
 * Logger utility with methods for different log levels.
 *
 * @example
 * import { logger } from '@/lib/utils/logger'
 *
 * logger.debug('Fetching events', { filters })
 * logger.info('User logged in')
 * logger.warn('API rate limit approaching')
 * logger.error('Failed to save event', { error })
 */
export const logger = {
  /**
   * Debug level - detailed information for developers.
   * Only shown in development mode.
   */
  debug: (message: string, data?: unknown) => log('debug', message, data),

  /**
   * Info level - general information about app operations.
   * Useful for tracking normal flow.
   */
  info: (message: string, data?: unknown) => log('info', message, data),

  /**
   * Warn level - something unexpected but recoverable happened.
   * The app can continue, but this should be investigated.
   */
  warn: (message: string, data?: unknown) => log('warn', message, data),

  /**
   * Error level - something went wrong!
   * This usually means a feature isn't working correctly.
   */
  error: (message: string, data?: unknown) => log('error', message, data),

  /**
   * Group related logs together (browser only).
   * Useful for grouping related operations.
   */
  group: (label: string) => {
    if (typeof console.group === 'function') {
      console.group(`📂 ${label}`)
    }
  },

  /**
   * End a log group (browser only).
   */
  groupEnd: () => {
    if (typeof console.groupEnd === 'function') {
      console.groupEnd()
    }
  },

  /**
   * Log a table of data (browser only).
   * Great for arrays of objects.
   */
  table: (data: unknown[]) => {
    if (typeof console.table === 'function') {
      console.table(data)
    }
  },
}

// ============================================================================
// 🎨 Startup Banner
// ============================================================================

/**
 * Prints a nice startup banner when the app initializes.
 * Call this in your app's entry point for a friendly greeting!
 */
export function printStartupBanner(): void {
  const banner = `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🗓️  HAPPENLIST                                           ║
║   Milwaukee's Events Directory                             ║
║                                                            ║
║   🚀 Server starting...                                    ║
║   📍 http://localhost:3000                                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`
  console.log('\x1b[36m' + banner + '\x1b[0m') // Cyan color
}
