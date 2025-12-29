// ============================================================================
// 📝 HAPPENLIST - Textarea Component
// ============================================================================
// A styled textarea component for multi-line text input.
//
// Usage:
//   <Textarea placeholder="Enter description..." />
//   <Textarea rows={6} error />
// ============================================================================

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// 📋 Textarea Props
// ============================================================================

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Shows error styling (red border) */
  error?: boolean
}

// ============================================================================
// 📝 Textarea Component
// ============================================================================

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          // Base styles
          'w-full px-4 py-3',
          'bg-surface border border-border rounded-lg',
          'text-text-primary placeholder:text-text-tertiary',
          // Focus styles
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          // Disabled styles
          'disabled:bg-background disabled:text-text-tertiary disabled:cursor-not-allowed',
          // Transition
          'transition-colors duration-200',
          // Resize
          'resize-y min-h-[100px]',
          // Error state
          error && 'border-error focus:ring-error/20 focus:border-error',
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

// ============================================================================
// 📤 Exports
// ============================================================================

export { Textarea }
