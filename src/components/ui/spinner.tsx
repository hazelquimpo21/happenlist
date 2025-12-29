/**
 * SPINNER COMPONENT
 * =================
 * Loading spinner for async operations.
 */

import { cn } from '@/lib/utils';

interface SpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  color?: 'coral' | 'stone' | 'white';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading spinner component.
 *
 * @example
 * <Spinner size="md" />
 *
 * @example
 * <Button loading>
 *   <Spinner size="sm" color="white" /> Loading...
 * </Button>
 */
export function Spinner({
  size = 'md',
  color = 'coral',
  className,
}: SpinnerProps) {
  // Size styles
  const sizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  // Color styles
  const colorStyles = {
    coral: 'text-coral',
    stone: 'text-stone',
    white: 'text-white',
  };

  return (
    <svg
      className={cn(
        'animate-spin',
        sizeStyles[size],
        colorStyles[color],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
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
}

/**
 * Full-page loading spinner.
 */
export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-stone text-body-sm">Loading...</p>
      </div>
    </div>
  );
}
