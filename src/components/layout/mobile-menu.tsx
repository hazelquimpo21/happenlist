/**
 * MOBILE MENU COMPONENT
 * =====================
 * Slide-out navigation drawer for mobile devices.
 *
 * Shows:
 * - User info (if logged in)
 * - Navigation links
 * - Submit event button
 * - Auth controls (login/logout)
 *
 * Uses Radix UI Dialog for accessibility.
 *
 * @module components/layout/mobile-menu
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  LogIn,
  LogOut,
  Plus,
  Heart,
  FileText,
  Settings,
  Shield,
  Megaphone,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '@/hooks/use-auth';
import { UserAvatar } from '@/components/auth/user-avatar';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';

// ============================================================================
// MENU LINK COMPONENT
// ============================================================================

interface MenuLinkProps {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}

/**
 * Navigation link in mobile menu
 */
function MenuLink({ href, icon, children, onClick }: MenuLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg',
        'text-ink font-medium',
        'hover:bg-cloud/50 active:bg-cloud',
        'transition-colors duration-fast'
      )}
    >
      {icon && <span className="w-5 h-5 text-zinc">{icon}</span>}
      {children}
    </Link>
  );
}

// ============================================================================
// MENU BUTTON COMPONENT
// ============================================================================

interface MenuButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}

/**
 * Button in mobile menu
 */
function MenuButton({ onClick, icon, children, variant = 'default' }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left',
        'font-medium',
        'transition-colors duration-fast',
        variant === 'danger'
          ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
          : 'text-ink hover:bg-cloud/50 active:bg-cloud'
      )}
    >
      {icon && (
        <span className={cn('w-5 h-5', variant === 'danger' ? 'text-red-500' : 'text-zinc')}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Mobile navigation menu
 */
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { session, signOut } = useAuth();

  const closeMenu = () => setIsOpen(false);

  const handleSignOut = () => {
    closeMenu();
    signOut();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      {/* Trigger Button */}
      <Dialog.Trigger asChild>
        <button
          className={cn(
            'p-2 rounded-md',
            'text-zinc hover:text-ink hover:bg-cloud/50',
            'transition-colors duration-fast'
          )}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </Dialog.Trigger>

      {/* Dialog Portal */}
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 bg-ink/50 z-modal-backdrop',
            'animate-in fade-in-0 duration-200'
          )}
        />

        {/* Drawer Content */}
        <Dialog.Content
          className={cn(
            'fixed top-0 right-0 h-full w-[300px] max-w-[85vw]',
            'bg-white z-modal',
            'flex flex-col',
            'animate-in slide-in-from-right duration-300',
            'focus:outline-none'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-mist">
            <Dialog.Title className="font-body text-lg text-ink">
              Menu
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-2 rounded-md text-zinc hover:text-ink hover:bg-cloud/50"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* User Info (if logged in) */}
          {session && (
            <div className="p-4 border-b border-mist">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={session.name}
                  email={session.email}
                  avatarUrl={session.avatarUrl}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">
                    {session.name || 'User'}
                  </p>
                  <p className="text-body-sm text-zinc truncate">
                    {session.email}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              {session.isAdmin && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                </div>
              )}
              {session.organizerId && !session.isAdmin && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange/10 text-orange text-xs font-medium">
                    <Megaphone className="w-3 h-3" />
                    Organizer
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Main Navigation */}
            <div className="space-y-1 mb-6">
              <p className="px-4 py-2 text-body-sm font-medium text-zinc uppercase tracking-wide">
                Discover
              </p>
              {NAV_ITEMS.map((item) => (
                <MenuLink
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                >
                  {item.label}
                </MenuLink>
              ))}
            </div>

            {/* Submit Event */}
            <div className="mb-6">
              <MenuLink
                href="/submit/new"
                onClick={closeMenu}
                icon={<Plus className="w-5 h-5" />}
              >
                ➕ Submit an Event
              </MenuLink>
            </div>

            {/* User Links (if logged in) */}
            {session && (
              <div className="space-y-1 mb-6">
                <p className="px-4 py-2 text-body-sm font-medium text-zinc uppercase tracking-wide">
                  My Stuff
                </p>
                <MenuLink
                  href="/my/hearts"
                  onClick={closeMenu}
                  icon={<Heart className="w-5 h-5" />}
                >
                  ❤️ Saved Events
                </MenuLink>
                <MenuLink
                  href="/my/submissions"
                  onClick={closeMenu}
                  icon={<FileText className="w-5 h-5" />}
                >
                  📝 My Submissions
                </MenuLink>
                {session.organizerId && (
                  <MenuLink
                    href="/organizer/dashboard"
                    onClick={closeMenu}
                    icon={<Megaphone className="w-5 h-5" />}
                  >
                    📣 My Organizer
                  </MenuLink>
                )}
              </div>
            )}

            {/* Admin Link */}
            {session?.isAdmin && (
              <div className="mb-6">
                <MenuLink
                  href="/admin"
                  onClick={closeMenu}
                  icon={<Shield className="w-5 h-5" />}
                >
                  🔐 Admin Dashboard
                </MenuLink>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-mist">
            {session ? (
              <>
                <MenuLink
                  href="/my/settings"
                  onClick={closeMenu}
                  icon={<Settings className="w-5 h-5" />}
                >
                  ⚙️ Settings
                </MenuLink>
                <MenuButton
                  onClick={handleSignOut}
                  icon={<LogOut className="w-5 h-5" />}
                  variant="danger"
                >
                  🚪 Sign Out
                </MenuButton>
              </>
            ) : (
              <MenuLink
                href="/auth/login"
                onClick={closeMenu}
                icon={<LogIn className="w-5 h-5" />}
              >
                🔐 Login
              </MenuLink>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
