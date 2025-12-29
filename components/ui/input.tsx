// ============================================================================
// 📝 HAPPENLIST - Input Component
// ============================================================================
// A styled input component with error state support.
//
// Usage:
//   <Input placeholder="Enter your email" />
//   <Input type="password" error />
//   <Input disabled />
// ============================================================================

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// 📋 Input Props
// ============================================================================

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Shows error styling (red border) */
  error?: boolean
}

// ============================================================================
// 📝 Input Component
// ============================================================================

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          // Base styles
          'w-full px-4 py-2',
          'bg-surface border border-border rounded-lg',
          'text-text-primary placeholder:text-text-tertiary',
          // Focus styles
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          // Disabled styles
          'disabled:bg-background disabled:text-text-tertiary disabled:cursor-not-allowed',
          // Transition
          'transition-colors duration-200',
          // Error state
          error && 'border-error focus:ring-error/20 focus:border-error',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

// ============================================================================
// 📤 Exports
// ============================================================================

export { Input }
