// ============================================================================
// 🔘 HAPPENLIST - Button Component
// ============================================================================
// A versatile button component with multiple variants and sizes.
// Built with class-variance-authority for type-safe variants.
//
// Usage:
//   <Button>Click me</Button>
//   <Button variant="secondary" size="lg">Large Secondary</Button>
//   <Button isLoading>Saving...</Button>
//   <Button asChild><Link href="/events">View Events</Link></Button>
// ============================================================================

import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// 🎨 Button Variants
// ============================================================================

const buttonVariants = cva(
  // Base styles applied to all buttons
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-lg',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      // ========================================
      // 🎨 Visual Variants
      // ========================================
      variant: {
        /** Primary action button - green background */
        primary: [
          'bg-primary text-white',
          'hover:bg-primary-dark',
          'focus:ring-primary',
        ],
        /** Secondary button - outlined style */
        secondary: [
          'bg-surface border border-border text-text-primary',
          'hover:bg-background',
          'focus:ring-primary',
        ],
        /** Ghost button - transparent until hovered */
        ghost: [
          'bg-transparent text-text-secondary',
          'hover:bg-background hover:text-text-primary',
        ],
        /** Danger button - for destructive actions */
        danger: [
          'bg-error text-white',
          'hover:bg-error/90',
          'focus:ring-error',
        ],
        /** Link-style button - looks like a text link */
        link: [
          'text-primary underline-offset-4',
          'hover:underline',
          'p-0 h-auto',
        ],
      },

      // ========================================
      // 📏 Size Variants
      // ========================================
      size: {
        /** Small - compact buttons */
        sm: 'px-3 py-1.5 text-sm',
        /** Medium - default size */
        md: 'px-4 py-2 text-sm',
        /** Large - prominent buttons */
        lg: 'px-6 py-3 text-base',
        /** Icon-only - square button for icons */
        icon: 'p-2',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

// ============================================================================
// 📋 Button Props
// ============================================================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * If true, renders child as the button element.
   * Useful for wrapping Link components.
   */
  asChild?: boolean
  /** Shows a loading spinner and disables the button */
  isLoading?: boolean
}

// ============================================================================
// 🔘 Button Component
// ============================================================================

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Use Slot for composition (allows <Button asChild><Link /></Button>)
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2
            className="w-4 h-4 animate-spin"
            aria-hidden="true"
          />
        )}
        {children}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

// ============================================================================
// 📤 Exports
// ============================================================================

export { Button, buttonVariants }
