/**
 * USER MENU COMPONENT
 * ===================
 * Dropdown menu for authenticated users.
 *
 * Shows the user's avatar, and when clicked, reveals a menu with:
 * - User info (name, email, role badge)
 * - Navigation links (hearts, submissions, etc.)
 * - Admin link (if admin)
 * - Settings and sign out
 *
 * Uses Radix UI DropdownMenu for accessibility.
 *
 * @module components/auth/user-menu
 */

'use client';

import Link from 'next/link';
import {
  Heart,
  FileText,
  Settings,
  LogOut,
  Shield,
  ChevronDown,
  Megaphone,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { UserAvatar } from './user-avatar';
import { cn } from '@/lib/utils';
import type { UserSession } from '@/types/user';

// ============================================================================
// TYPES
// ============================================================================

interface UserMenuProps {
  /** Current user session */
  session: UserSession;

  /** Sign out handler */
  onSignOut: () => void;
}

// ============================================================================
// MENU ITEM COMPONENT
// ============================================================================

interface MenuItemProps {
  /** Link href (if navigating) */
  href?: string;

  /** Click handler (if action) */
  onClick?: () => void;

  /** Icon to show */
  icon: React.ReactNode;

  /** Item label */
  label: string;

  /** Is this a destructive action? */
  destructive?: boolean;
}

/**
 * Individual menu item (link or button)
 */
function MenuItem({ href, onClick, icon, label, destructive }: MenuItemProps) {
  const itemClasses = cn(
    'flex items-center gap-3 px-3 py-2 rounded-md',
    'text-body-sm cursor-pointer',
    'outline-none focus:outline-none',
    'transition-colors duration-fast',
    destructive
      ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
      : 'text-charcoal hover:bg-sand/50 focus:bg-sand/50'
  );

  const content = (
    <>
      <span className={cn('w-5 h-5', destructive ? 'text-red-500' : 'text-stone')}>
        {icon}
      </span>
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <DropdownMenu.Item asChild>
        <Link href={href} className={itemClasses}>
          {content}
        </Link>
      </DropdownMenu.Item>
    );
  }

  return (
    <DropdownMenu.Item className={itemClasses} onClick={onClick}>
      {content}
    </DropdownMenu.Item>
  );
}

// ============================================================================
// ROLE BADGE COMPONENT
// ============================================================================

interface RoleBadgeProps {
  role: string;
  isAdmin: boolean;
  organizerId: string | null;
}

/**
 * Badge showing user's role
 */
function RoleBadge({ isAdmin, organizerId }: RoleBadgeProps) {
  if (isAdmin) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
        <Shield className="w-3 h-3" />
        Admin
      </span>
    );
  }

  if (organizerId) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-coral-light text-coral-dark text-xs font-medium">
        <Megaphone className="w-3 h-3" />
        Organizer
      </span>
    );
  }

  return null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * User menu dropdown for authenticated users
 *
 * @example
 * <UserMenu session={session} onSignOut={handleSignOut} />
 */
export function UserMenu({ session, onSignOut }: UserMenuProps) {
  return (
    <DropdownMenu.Root>
      {/* Trigger Button */}
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 p-1 rounded-lg',
            'hover:bg-sand/50 transition-colors duration-fast',
            'focus:outline-none focus:ring-2 focus:ring-coral-light focus:ring-offset-2'
          )}
          aria-label="Open user menu"
        >
          <UserAvatar
            name={session.name}
            email={session.email}
            avatarUrl={session.avatarUrl}
            size="sm"
          />
          <ChevronDown className="w-4 h-4 text-stone hidden sm:block" />
        </button>
      </DropdownMenu.Trigger>

      {/* Dropdown Content */}
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            'min-w-[240px] p-2 rounded-xl',
            'bg-white shadow-lg border border-sand',
            'animate-in fade-in-0 zoom-in-95',
            'z-dropdown'
          )}
          sideOffset={8}
          align="end"
        >
          {/* User Info Header */}
          <div className="px-3 py-2 mb-1">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={session.name}
                email={session.email}
                avatarUrl={session.avatarUrl}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal truncate">
                  {session.name || 'User'}
                </p>
                <p className="text-body-sm text-stone truncate">
                  {session.email}
                </p>
              </div>
            </div>

            {/* Role Badge */}
            <div className="mt-2">
              <RoleBadge
                role={session.role}
                isAdmin={session.isAdmin}
                organizerId={session.organizerId}
              />
            </div>
          </div>

          <DropdownMenu.Separator className="h-px bg-sand my-1" />

          {/* Main Menu Items */}
          <DropdownMenu.Group>
            <MenuItem
              href="/my/hearts"
              icon={<Heart className="w-5 h-5" />}
              label="❤️ My Saved Events"
            />

            <MenuItem
              href="/my/submissions"
              icon={<FileText className="w-5 h-5" />}
              label="📝 My Submissions"
            />

            {/* Organizer Link (if claimed) */}
            {session.organizerId && (
              <MenuItem
                href="/organizer/dashboard"
                icon={<Megaphone className="w-5 h-5" />}
                label="📣 My Organizer"
              />
            )}
          </DropdownMenu.Group>

          {/* Admin Section */}
          {session.isAdmin && (
            <>
              <DropdownMenu.Separator className="h-px bg-sand my-1" />
              <DropdownMenu.Group>
                <MenuItem
                  href="/admin"
                  icon={<Shield className="w-5 h-5" />}
                  label="🔐 Admin Dashboard"
                />
              </DropdownMenu.Group>
            </>
          )}

          <DropdownMenu.Separator className="h-px bg-sand my-1" />

          {/* Settings & Sign Out */}
          <DropdownMenu.Group>
            <MenuItem
              href="/my/settings"
              icon={<Settings className="w-5 h-5" />}
              label="⚙️ Settings"
            />

            <MenuItem
              onClick={onSignOut}
              icon={<LogOut className="w-5 h-5" />}
              label="🚪 Sign Out"
              destructive
            />
          </DropdownMenu.Group>

          {/* Arrow for visual polish */}
          <DropdownMenu.Arrow className="fill-white" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
