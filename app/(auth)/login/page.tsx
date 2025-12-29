// ============================================================================
// 🔐 HAPPENLIST - Login Page
// ============================================================================
// Admin login page with email and password authentication.
// Uses Supabase Auth for secure authentication.
// ============================================================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { ArrowLeft, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { Button, Input, Card, Label } from '@/components/ui'
import { signIn } from '@/lib/actions/auth'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'

// ============================================================================
// 🔐 Login Page Component
// ============================================================================

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    setError(null)

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    logger.info('🔐 Login attempt', { email })

    const result = await signIn(email, password)

    if (!result.success) {
      setError(result.error || 'Login failed. Please try again.')
      logger.warn('🔐 Login failed', { email, error: result.error })
    }
    // If successful, the signIn action will redirect to admin
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md">
        {/* ========================================
            🔙 Back to Home
            ======================================== */}
        <Link
          href={ROUTES.home}
          className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Happenlist
        </Link>

        {/* ========================================
            🔐 Login Card
            ======================================== */}
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-4xl">🗓️</span>
            <h1 className="text-heading-md font-bold text-text-primary mt-4">
              Admin Login
            </h1>
            <p className="text-body-sm text-text-secondary mt-2">
              Sign in to manage events, venues, and organizers
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-3 text-error">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-body-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form action={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
                className="mt-1.5"
              />
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                  <span className="sr-only">
                    {showPassword ? 'Hide password' : 'Show password'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <SubmitButton />
          </form>
        </Card>

        {/* Help Text */}
        <p className="text-center text-body-sm text-text-tertiary mt-6">
          Need access?{' '}
          <a href="mailto:admin@happenlist.com" className="text-primary hover:underline">
            Contact the administrator
          </a>
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// 📤 Submit Button with Loading State
// ============================================================================

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Signing in...
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </>
      )}
    </Button>
  )
}
