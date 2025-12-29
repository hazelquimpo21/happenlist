// ============================================================================
// 🔄 HAPPENLIST - Spinner Component
// ============================================================================
// A loading spinner for async operations.
//
// Usage:
//   <Spinner />
//   <Spinner size="lg" />
//   <Spinner className="text-primary" />
// ============================================================================

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// 📋 Spinner Props
// ============================================================================

export interface SpinnerProps extends React.HTMLAttributes<SVGSVGElement> {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg'
}

// ============================================================================
// 🔄 Spinner Component
// ============================================================================

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-text-tertiary', sizeClasses[size], className)}
      aria-hidden="true"
      {...props}
    />
  )
}

// ============================================================================
// 📤 Exports
// ============================================================================

export { Spinner }
