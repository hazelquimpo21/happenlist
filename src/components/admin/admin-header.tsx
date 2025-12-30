/**
 * ADMIN HEADER
 * =============
 * Top header bar for admin pages with title and actions.
 */

import { Bell, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function AdminHeader({ title, description, children }: AdminHeaderProps) {
  return (
    <header className="bg-warm-white border-b border-sand sticky top-0 z-10">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Title section */}
        <div>
          <h1 className="font-display text-2xl text-charcoal">{title}</h1>
          {description && (
            <p className="text-sm text-stone mt-0.5">{description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search - placeholder for now */}
          <button
            className={cn(
              'p-2 rounded-lg text-stone hover:text-charcoal hover:bg-sand/50',
              'transition-colors'
            )}
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications - placeholder */}
          <button
            className={cn(
              'p-2 rounded-lg text-stone hover:text-charcoal hover:bg-sand/50',
              'transition-colors relative'
            )}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full" />
          </button>

          {/* User menu - placeholder */}
          <div className="flex items-center gap-2 pl-4 border-l border-sand">
            <div className="w-8 h-8 rounded-full bg-coral/20 flex items-center justify-center">
              <User className="w-4 h-4 text-coral" />
            </div>
            <span className="text-sm font-medium text-charcoal">Admin</span>
          </div>
        </div>
      </div>

      {/* Optional action buttons from parent */}
      {children && (
        <div className="px-8 pb-4 flex items-center gap-3">
          {children}
        </div>
      )}
    </header>
  );
}

/**
 * Breadcrumbs for admin pages
 */
interface AdminBreadcrumb {
  label: string;
  href?: string;
}

interface AdminBreadcrumbsProps {
  items: AdminBreadcrumb[];
}

export function AdminBreadcrumbs({ items }: AdminBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-stone mb-4">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          {index > 0 && <span>/</span>}
          {item.href ? (
            <a href={item.href} className="hover:text-charcoal transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-charcoal">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
