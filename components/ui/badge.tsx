// ============================================================================
// 🏷️ HAPPENLIST - Badge Component
// ============================================================================
// A small status/tag indicator with color variants.
//
// Usage:
//   <Badge>Default</Badge>
//   <Badge variant="success">Published</Badge>
//   <Badge variant="warning">Draft</Badge>
// ============================================================================

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// 🎨 Badge Variants
// ============================================================================

const badgeVariants = cva(
  // Base styles
  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
  {
    variants: {
      variant: {
        /** Default - subtle gray */
        default: 'bg-background text-text-secondary',
        /** Primary - green brand color */
        primary: 'bg-primary-light text-primary-dark',
        /** Success - for positive states */
        success: 'bg-green-100 text-green-800',
        /** Warning - for attention needed */
        warning: 'bg-amber-100 text-amber-800',
        /** Error - for problems */
        error: 'bg-red-100 text-red-800',
        /** Info - for informational */
        info: 'bg-blue-100 text-blue-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// ============================================================================
// 📋 Badge Props
// ============================================================================

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

// ============================================================================
// 🏷️ Badge Component
// ============================================================================

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// ============================================================================
// 📤 Exports
// ============================================================================

export { Badge, badgeVariants }
