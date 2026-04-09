/**
 * CUSTOM 404 PAGE
 * ===============
 * On-brand 404 page for when users hit a dead end.
 */

import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Container } from '@/components/layout';
import { ROUTES } from '@/lib/constants';

export default function NotFound() {
  return (
    <Container className="py-24 md:py-32">
      <div className="text-center max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue/10 mb-8">
          <Compass className="w-10 h-10 text-blue" />
        </div>

        <h1 className="text-display font-bold text-ink mb-4">
          Page not found
        </h1>

        <p className="text-body text-zinc mb-8">
          Looks like this page wandered off. Let&apos;s get you back to
          discovering something cool in Milwaukee.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href={ROUTES.events}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue text-pure font-semibold rounded-md hover:bg-blue-dark transition-colors"
          >
            Browse Events
          </Link>
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
