'use client';

/**
 * GLOBAL ERROR BOUNDARY
 * =====================
 * Catches unhandled errors and shows a friendly recovery page.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <Container className="py-24 md:py-32">
      <div className="text-center max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-rose-light mb-8">
          <span className="text-3xl">!</span>
        </div>

        <h1 className="text-display font-bold text-ink mb-4">
          Something went wrong
        </h1>

        <p className="text-body text-zinc mb-8">
          We hit an unexpected snag. Try refreshing, or head back to the
          homepage.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue text-pure font-semibold rounded-md hover:bg-blue-dark transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-mist text-ink font-semibold rounded-md hover:bg-cloud transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </Container>
  );
}
