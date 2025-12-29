// ============================================================================
// 📦 HAPPENLIST - UI Components Index
// ============================================================================
// Central export point for all UI primitive components.
// Import from '@/components/ui' instead of individual files.
//
// @example
// import { Button, Input, Card, Badge } from '@/components/ui'
// ============================================================================

// Buttons & Actions
export { Button, buttonVariants, type ButtonProps } from './button'
export { Spinner, type SpinnerProps } from './spinner'

// Form Controls
export { Input, type InputProps } from './input'
export { Textarea, type TextareaProps } from './textarea'
export { Label, type LabelProps } from './label'

// Display Components
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  type CardProps,
} from './card'
export { Badge, badgeVariants, type BadgeProps } from './badge'
export { Skeleton } from './skeleton'
