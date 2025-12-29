/**
 * FOOTER COMPONENT
 * ================
 * Site footer with navigation links and branding.
 */

import Link from 'next/link';
import { Container } from './container';
import { FOOTER_NAV, ROUTES } from '@/lib/constants';

/**
 * Site footer with navigation links.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-warm-white border-t border-sand mt-auto">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and tagline */}
          <div className="md:col-span-2">
            <Link
              href={ROUTES.home}
              className="inline-block font-display text-h2 text-charcoal hover:text-coral transition-colors"
            >
              <span className="text-coral">H</span>appenlist
            </Link>
            <p className="mt-3 text-stone text-body-sm max-w-sm">
              Discover concerts, festivals, classes, workshops, and more
              happening in your area.
            </p>
          </div>

          {/* Discover links */}
          <div>
            <h3 className="font-display text-h4 text-charcoal mb-4">
              Discover
            </h3>
            <ul className="space-y-2">
              {FOOTER_NAV.discover.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-stone text-body-sm hover:text-coral transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About links */}
          <div>
            <h3 className="font-display text-h4 text-charcoal mb-4">About</h3>
            <ul className="space-y-2">
              {FOOTER_NAV.about.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-stone text-body-sm hover:text-coral transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-sand">
          <p className="text-stone text-body-sm text-center">
            &copy; {currentYear} Happenlist. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
