/**
 * INPUT COMPONENT
 * ===============
 * Form input field with various styles and states.
 */

'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Full width */
  fullWidth?: boolean;
}

/**
 * Input component for forms.
 *
 * @example
 * <Input
 *   label="Email"
 *   placeholder="you@example.com"
 *   leftIcon={<Mail />}
 * />
 *
 * @example
 * <Input
 *   placeholder="Search events..."
 *   leftIcon={<Search />}
 *   rightIcon={query && <X onClick={clear} />}
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      error,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className,
      ...props
    },
    ref
  ) {
    return (
      <div className={cn(fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label className="block text-body-sm font-medium text-ink mb-1.5">
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc">
              {leftIcon}
            </div>
          )}

          {/* Input field */}
          <input
            ref={ref}
            className={cn(
              'w-full h-11',
              'bg-pure text-ink',
              'border border-mist rounded-md',
              'placeholder:text-zinc',
              'transition-all duration-fast',
              'focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/20',
              leftIcon ? 'pl-10' : 'pl-4',
              rightIcon ? 'pr-10' : 'pr-4',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
              props.disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && <p className="mt-1.5 text-body-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
