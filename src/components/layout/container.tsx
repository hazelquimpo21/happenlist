/**
 * CONTAINER COMPONENT
 * ===================
 * Page content wrapper with consistent max-width and padding.
 */

import { cn } from '@/lib/utils';

interface ContainerProps {
  /** Maximum width variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Container content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Container component for page content.
 *
 * @example
 * <Container>
 *   <h1>Page Title</h1>
 *   <p>Content...</p>
 * </Container>
 *
 * @example
 * <Container size="sm" className="py-12">
 *   <Form />
 * </Container>
 */
export function Container({
  size = 'xl',
  children,
  className,
}: ContainerProps) {
  // Size max-widths
  const sizeStyles = {
    sm: 'max-w-2xl',    // 640px
    md: 'max-w-3xl',    // 768px
    lg: 'max-w-5xl',    // 1024px
    xl: 'max-w-7xl',    // 1280px
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto px-4 md:px-6',
        sizeStyles[size],
        className
      )}
    >
      {children}
    </div>
  );
}
