/**
 * CARD COMPONENT
 * ==============
 * Container component with consistent styling.
 */

import { cn } from '@/lib/utils';

interface CardProps {
  /** Visual style variant */
  variant?: 'default' | 'elevated' | 'bordered';
  /** Internal padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Enable hover lift effect */
  hover?: boolean;
  /** Card content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Card container component.
 *
 * @example
 * <Card hover>
 *   <CardImage src="/event.jpg" alt="Event" />
 *   <CardContent>
 *     <h3>Event Title</h3>
 *   </CardContent>
 * </Card>
 */
export function Card({
  variant = 'default',
  padding = 'none',
  hover = false,
  children,
  className,
}: CardProps) {
  // Variant styles
  const variantStyles = {
    default: 'bg-warm-white shadow-card',
    elevated: 'bg-warm-white shadow-dropdown',
    bordered: 'bg-warm-white border border-sand',
  };

  // Padding styles
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <article
      className={cn(
        'rounded-lg overflow-hidden',
        'transition-all duration-base',
        variantStyles[variant],
        paddingStyles[padding],
        hover && 'hover:shadow-card-hover hover:-translate-y-1',
        className
      )}
    >
      {children}
    </article>
  );
}
