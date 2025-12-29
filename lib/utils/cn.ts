// ============================================================================
// 🎨 HAPPENLIST - Class Name Utility
// ============================================================================
// Combines clsx and tailwind-merge for optimal class name handling.
// This is the standard pattern used in shadcn/ui and similar libraries.
//
// Features:
//   - Handles conditional classes (like clsx)
//   - Merges Tailwind classes intelligently (no duplicates)
//   - Type-safe with TypeScript
// ============================================================================

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names with intelligent Tailwind CSS merging.
 *
 * Uses clsx for conditional class handling and tailwind-merge to
 * prevent duplicate Tailwind utilities (e.g., 'px-2 px-4' becomes 'px-4').
 *
 * @example
 * // Basic usage
 * cn('text-red-500', 'bg-blue-500')
 * // => 'text-red-500 bg-blue-500'
 *
 * @example
 * // Conditional classes
 * cn('base-class', isActive && 'active-class', { 'disabled': isDisabled })
 * // => 'base-class active-class' (if isActive is true)
 *
 * @example
 * // Tailwind merging (later values win)
 * cn('px-2 py-1', 'px-4')
 * // => 'py-1 px-4' (px-4 overwrites px-2)
 *
 * @param inputs - Class values to combine (strings, objects, arrays, etc.)
 * @returns Merged class name string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
