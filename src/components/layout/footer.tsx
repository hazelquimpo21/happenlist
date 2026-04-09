/**
 * FOOTER COMPONENT — v3 Redesign
 * ==============================
 * Dark footer. Blue accent links. Clean sans-serif.
 */

import Link from 'next/link';
import { Container } from './container';
import { FOOTER_NAV, ROUTES } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-night mt-auto">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and tagline */}
          <div className="md:col-span-2">
            <Link
              href={ROUTES.home}
              className="inline-block font-body text-h2 font-bold text-pure hover:text-blue transition-colors"
            >
              <span className="text-blue">H</span>appenlist
            </Link>
            <p className="mt-3 text-zinc text-body-sm max-w-sm">
              Discover concerts, festivals, classes, workshops, and more
              happening in Milwaukee.
            </p>
          </div>

          {/* Discover links */}
          <div>
            <h3 className="font-body text-h4 font-bold text-pure mb-4">
              Discover
            </h3>
            <ul className="space-y-2">
              {FOOTER_NAV.discover.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-zinc text-body-sm hover:text-blue transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About links */}
          <div>
            <h3 className="font-body text-h4 font-bold text-pure mb-4">
              About
            </h3>
            <ul className="space-y-2">
              {FOOTER_NAV.about.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-zinc text-body-sm hover:text-blue transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-pure/10">
          <p className="text-zinc/60 text-body-sm text-center">
            &copy; {currentYear} Happenlist. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
