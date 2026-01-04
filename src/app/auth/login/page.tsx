/**
 * LOGIN PAGE
 * ==========
 * Magic link login page for Happenlist.
 *
 * ROUTE: /auth/login
 *
 * QUERY PARAMS:
 *   ?redirect=/submit/new  - Where to redirect after login
 *   ?error=invalid_token   - Error from callback
 *
 * This page:
 * - Shows the login form (email input)
 * - Handles redirect after successful login
 * - Shows error messages from failed callbacks
 *
 * @module app/auth/login/page
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Container } from '@/components/layout';
import { LoginForm } from '@/components/auth';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Happenlist with a magic link. No password required!',
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

const ERROR_MESSAGES: Record<string, string> = {
  invalid_token: 'This sign-in link is invalid. Please request a new one.',
  expired_token: 'This sign-in link has expired. Please request a new one.',
  already_used: 'This sign-in link has already been used. Please request a new one.',
  server_error: 'Something went wrong on our end. Please try again.',
};

// ============================================================================
// PROPS
// ============================================================================

interface LoginPageProps {
  searchParams: Promise<{
    redirect?: string;
    error?: string;
  }>;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirect || '/';
  const errorCode = params.error;
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] : null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <Container>
        <div className="max-w-md mx-auto">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-stone hover:text-charcoal transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-soft border border-sand p-8">
            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-body-sm text-red-700">
                  ⚠️ {errorMessage}
                </p>
              </div>
            )}

            {/* Login Form */}
            <LoginForm redirectTo={redirectTo} />
          </div>

          {/* Help Text */}
          <p className="mt-6 text-center text-body-sm text-stone">
            Questions?{' '}
            <Link href="/contact" className="text-coral hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
