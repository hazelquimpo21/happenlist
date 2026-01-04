/**
 * HEADER COMPONENT
 * ================
 * Site navigation header with logo, nav links, search, and auth.
 *
 * The header shows:
 * - Logo (links to home)
 * - Navigation links (desktop only)
 * - Search button
 * - Auth controls (login button or user menu)
 * - Mobile menu button (mobile only)
 *
 * Auth state is handled by the HeaderAuth client component.
 */

import Link from 'next/link';
import { Search } from 'lucide-react';
import { Container } from './container';
import { HeaderAuth } from './header-auth';
import { MobileMenu } from './mobile-menu';
import { NAV_ITEMS, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface HeaderProps {
  /** Transparent header for hero overlays */
  transparent?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Site header with navigation.
 *
 * @example
 * <Header />
 *
 * @example
 * <Header transparent />
 */
export function Header({ transparent = false }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-sticky',
        'transition-all duration-base',
        transparent
          ? 'bg-transparent'
          : 'bg-cream/95 backdrop-blur-sm border-b border-sand'
      )}
    >
      <Container>
        <nav className="flex items-center justify-between h-16 md:h-18">
          {/* ---------------------------------------------------------------- */}
          {/* LOGO                                                            */}
          {/* ---------------------------------------------------------------- */}
          <Link
            href={ROUTES.home}
            className="flex items-center gap-2 font-display text-h3 text-charcoal hover:text-coral transition-colors"
          >
            <span className="text-coral">H</span>
            <span className="hidden sm:inline">Happenlist</span>
          </Link>

          {/* ---------------------------------------------------------------- */}
          {/* DESKTOP NAVIGATION                                              */}
          {/* ---------------------------------------------------------------- */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-md',
                  'text-body-sm font-medium text-stone',
                  'hover:text-charcoal hover:bg-sand/50',
                  'transition-colors duration-fast'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* RIGHT SIDE ACTIONS                                              */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <Link
              href={ROUTES.search}
              className={cn(
                'p-2 rounded-md',
                'text-stone hover:text-charcoal hover:bg-sand/50',
                'transition-colors duration-fast'
              )}
              aria-label="Search events"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Auth controls (login/user menu) - desktop */}
            <div className="hidden md:block">
              <HeaderAuth />
            </div>

            {/* Mobile menu (includes auth on mobile) */}
            <div className="md:hidden">
              <MobileMenu />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
