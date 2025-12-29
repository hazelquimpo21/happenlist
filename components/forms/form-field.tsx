// ============================================================================
// 📋 HAPPENLIST - Form Field Component
// ============================================================================
// A wrapper component for form fields with label, hint, and error handling.
// Use this to maintain consistent form layout.
//
// Usage:
//   <FormField label="Title" htmlFor="title" required error="Title is required">
//     <Input id="title" error />
//   </FormField>
// ============================================================================

import { cn } from '@/lib/utils/cn'

// ============================================================================
// 📋 FormField Props
// ============================================================================

export interface FormFieldProps {
  /** Field label text */
  label: string
  /** ID of the associated input (for accessibility) */
  htmlFor?: string
  /** Error message to display */
  error?: string
  /** Hint/help text shown below the input */
  hint?: string
  /** Shows a red asterisk to indicate required */
  required?: boolean
  /** The form control (Input, Textarea, Select, etc.) */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// 📋 FormField Component
// ============================================================================

function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label */}
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && (
          <span className="text-error ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {/* Form Control */}
      {children}

      {/* Hint Text (show when no error) */}
      {hint && !error && (
        <p className="text-xs text-text-tertiary">{hint}</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// ============================================================================
// 📤 Exports
// ============================================================================

export { FormField }
