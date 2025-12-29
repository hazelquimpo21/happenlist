/**
 * CLASSNAME UTILITY
 * =================
 * Combines clsx and tailwind-merge for optimal class handling.
 * This utility merges Tailwind classes intelligently.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind CSS conflict resolution.
 *
 * @example
 * cn('px-4', 'px-6')        // => 'px-6'
 * cn('bg-red-500', isActive && 'bg-blue-500')  // => 'bg-blue-500' if active
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
