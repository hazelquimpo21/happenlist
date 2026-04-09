/**
 * BADGE COMPONENT
 * ===============
 * Small labels for categories, status, and metadata.
 */

import { cn } from '@/lib/utils';

interface BadgeProps {
  /** Visual style variant */
  variant?: 'default' | 'category' | 'free' | 'date' | 'status' | 'secondary' | 'outline';
  /** Badge size */
  size?: 'sm' | 'md';
  /** Badge content */
  children: React.ReactNode;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Badge component for labels and tags.
 *
 * @example
 * <Badge variant="category">Music</Badge>
 *
 * @example
 * <Badge variant="free">Free</Badge>
 *
 * @example
 * <Badge variant="date" icon={<Calendar />}>Today</Badge>
 */
export function Badge({
  variant = 'default',
  size = 'md',
  children,
  icon,
  className,
}: BadgeProps) {
  // Variant styles
  // v3 palette
  const variantStyles = {
    default: 'bg-cloud text-ink',
    category: 'bg-cloud text-ink',
    free: 'bg-emerald-light text-emerald',
    date: 'bg-blue-muted text-blue',
    status: 'bg-cloud text-zinc',
    secondary: 'bg-emerald/10 text-emerald',
    outline: 'bg-transparent border border-mist text-zinc',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-caption',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        'font-body font-medium',
        'rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
