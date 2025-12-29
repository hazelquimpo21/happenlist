// ============================================================================
// 🏷️ HAPPENLIST - Label Component
// ============================================================================
// Form input label with optional required indicator.
//
// Usage:
//   <Label htmlFor="email">Email</Label>
//   <Label htmlFor="title" required>Title</Label>
// ============================================================================

import { forwardRef } from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// 📋 Label Props
// ============================================================================

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  /** Shows a red asterisk to indicate required field */
  required?: boolean
}

// ============================================================================
// 🏷️ Label Component
// ============================================================================

const Label = forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, required, children, ...props }, ref) => {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        'block text-sm font-medium text-text-primary mb-1.5',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-error ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </LabelPrimitive.Root>
  )
})

Label.displayName = 'Label'

// ============================================================================
// 📤 Exports
// ============================================================================

export { Label }
