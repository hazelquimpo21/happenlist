/**
 * BUTTON COMPONENT
 * ================
 * Flexible button component with multiple variants.
 * Supports links, loading states, and icons.
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ButtonProps {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state - shows spinner */
  loading?: boolean;
  /** Icon on the left side */
  leftIcon?: React.ReactNode;
  /** Icon on the right side */
  rightIcon?: React.ReactNode;
  /** Button content */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Button type */
  type?: 'button' | 'submit';
  /** Link href - renders as <a> if provided */
  href?: string;
  /** Opens link in new tab */
  external?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Primary UI button component.
 *
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Get Tickets
 * </Button>
 *
 * @example
 * <Button href="/events" leftIcon={<Calendar />}>
 *   Browse Events
 * </Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  onClick,
  type = 'button',
  href,
  external = false,
  className,
}: ButtonProps) {
  // Base styles for all buttons
  const baseStyles = cn(
    'inline-flex items-center justify-center gap-2',
    'font-body font-medium',
    'rounded-md transition-all duration-base',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-light',
    'disabled:opacity-50 disabled:pointer-events-none'
  );

  // Variant styles
  const variantStyles = {
    primary: 'bg-coral text-warm-white hover:bg-coral-dark active:bg-coral-dark',
    secondary: 'bg-transparent text-coral border-2 border-coral hover:bg-coral-light',
    ghost: 'bg-transparent text-stone hover:text-charcoal hover:bg-sand',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-4 py-2 text-body-sm h-9',
    md: 'px-6 py-2.5 text-body h-11',
    lg: 'px-8 py-3 text-body h-13',
  };

  // Combined styles
  const combinedStyles = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && 'w-full',
    className
  );

  // Loading spinner
  const loadingSpinner = (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Button content
  const content = (
    <>
      {loading ? loadingSpinner : leftIcon}
      {children}
      {rightIcon}
    </>
  );

  // Render as link if href is provided
  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedStyles}
        >
          {content}
        </a>
      );
    }

    return (
      <Link href={href} className={combinedStyles}>
        {content}
      </Link>
    );
  }

  // Render as button
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={combinedStyles}
    >
      {content}
    </button>
  );
}
