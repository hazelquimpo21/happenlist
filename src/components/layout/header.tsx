/**
 * HEADER COMPONENT — v3 Redesign
 * ==============================
 * Clean sans-serif header. Blue brand accent. Search in nav.
 */

import Link from 'next/link';
import { Search } from 'lucide-react';
import { Container } from './container';
import { HeaderAuth } from './header-auth';
import { MobileMenu } from './mobile-menu';
import { NAV_ITEMS, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent = false }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-sticky',
        'transition-all duration-base',
        transparent
          ? 'bg-transparent'
          : 'bg-white/95 backdrop-blur-sm border-b border-mist'
      )}
    >
      <Container>
        <nav className="flex items-center justify-between h-16 md:h-18">
          {/* LOGO */}
          <Link
            href={ROUTES.home}
            className="flex items-center gap-1 font-body text-h3 font-bold text-ink hover:text-blue transition-colors"
          >
            <span className="text-blue">H</span>
            <span className="hidden sm:inline -ml-0.5">appenlist</span>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-md',
                  'text-body-sm font-medium text-zinc',
                  'hover:text-ink hover:bg-cloud',
                  'transition-colors duration-fast'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <Link
              href={ROUTES.search}
              className={cn(
                'p-2 rounded-md',
                'text-zinc hover:text-ink hover:bg-cloud',
                'transition-colors duration-fast'
              )}
              aria-label="Search events"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Auth — desktop */}
            <div className="hidden md:block">
              <HeaderAuth />
            </div>

            {/* Mobile menu */}
            <div className="md:hidden">
              <MobileMenu />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
