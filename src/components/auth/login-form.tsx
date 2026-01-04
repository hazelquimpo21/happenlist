/**
 * LOGIN FORM COMPONENT
 * ====================
 * Email input form for magic link authentication.
 *
 * Shows a simple email input, sends a magic link, and displays
 * a "check your email" message on success.
 *
 * STATES:
 * 1. idle     - Showing email input
 * 2. loading  - Sending magic link
 * 3. success  - Magic link sent, check email
 * 4. error    - Something went wrong
 *
 * @module components/auth/login-form
 */

'use client';

import { useState, useCallback } from 'react';
import { Mail, ArrowRight, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { LoginFormState } from '@/types/user';

// ============================================================================
// TYPES
// ============================================================================

interface LoginFormProps {
  /** Where to redirect after successful login */
  redirectTo?: string;

  /** Called after magic link is sent successfully */
  onSuccess?: () => void;

  /** Compact mode for modals */
  compact?: boolean;

  /** Custom title */
  title?: string;

  /** Custom description */
  description?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Login form with magic link authentication
 *
 * @example
 * <LoginForm redirectTo="/submit/new" />
 *
 * @example
 * <LoginForm
 *   compact
 *   title="Sign in to save events"
 *   onSuccess={() => closeModal()}
 * />
 */
export function LoginForm({
  redirectTo,
  onSuccess,
  compact = false,
  title,
  description,
}: LoginFormProps) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<LoginFormState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * Handle form submission - send magic link
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate email
      if (!email || !email.includes('@')) {
        setErrorMessage('Please enter a valid email address');
        setState('error');
        return;
      }

      setState('loading');
      setErrorMessage(null);

      const result = await signIn(email, redirectTo);

      if (result.success) {
        setState('success');
        onSuccess?.();

        // Start resend cooldown (60 seconds)
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setState('error');
        setErrorMessage(result.error || 'Failed to send magic link. Please try again.');
      }
    },
    [email, redirectTo, signIn, onSuccess]
  );

  /**
   * Reset form to try again
   */
  const handleReset = useCallback(() => {
    setState('idle');
    setErrorMessage(null);
  }, []);

  /**
   * Resend magic link
   */
  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;

    setState('loading');
    const result = await signIn(email, redirectTo);

    if (result.success) {
      setState('success');
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setState('error');
      setErrorMessage(result.error || 'Failed to resend. Please try again.');
    }
  }, [email, redirectTo, signIn, resendCooldown]);

  // ---------------------------------------------------------------------------
  // RENDER: SUCCESS STATE
  // ---------------------------------------------------------------------------

  if (state === 'success') {
    return (
      <div className={cn('text-center', compact ? 'py-4' : 'py-8')}>
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        {/* Success Message */}
        <h3 className={cn('font-display text-charcoal mb-2', compact ? 'text-lg' : 'text-xl')}>
          ✉️ Check your email!
        </h3>

        <p className="text-stone mb-2">
          We sent a sign-in link to:
        </p>

        <p className="font-medium text-charcoal mb-6">
          {email}
        </p>

        <p className="text-body-sm text-stone mb-6">
          Click the link in your email to continue.
          <br />
          The link expires in 1 hour.
        </p>

        {/* Resend & Change Email */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend link'}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleReset}>
            Use different email
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: FORM STATE (idle, loading, error)
  // ---------------------------------------------------------------------------

  return (
    <div className={cn(compact ? 'py-2' : 'py-4')}>
      {/* Title */}
      <h2
        className={cn(
          'font-display text-charcoal mb-2',
          compact ? 'text-lg' : 'text-xl md:text-2xl'
        )}
      >
        {title || '🔐 Sign in to Happenlist'}
      </h2>

      {/* Description */}
      <p className="text-stone mb-6">
        {description || "We'll email you a magic link. No password needed!"}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-body-sm font-medium text-charcoal mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={state === 'loading'}
              autoComplete="email"
              autoFocus
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-lg',
                'border border-sand bg-white',
                'text-charcoal placeholder:text-stone',
                'focus:outline-none focus:ring-2 focus:ring-coral-light focus:border-coral',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-base',
                state === 'error' && 'border-red-400 focus:ring-red-200'
              )}
            />
          </div>
        </div>

        {/* Error Message */}
        {state === 'error' && errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-body-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={state === 'loading'}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {state === 'loading' ? 'Sending...' : 'Send Magic Link'}
        </Button>
      </form>

      {/* Info Text */}
      <p className="mt-4 text-body-sm text-stone text-center">
        By signing in, you agree to our{' '}
        <a href="/about" className="text-coral hover:underline">
          Terms of Service
        </a>
        .
      </p>
    </div>
  );
}
