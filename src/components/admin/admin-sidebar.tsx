/**
 * ADMIN SIDEBAR
 * ==============
 * Navigation sidebar for the admin area.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  pendingCount?: number;
}

export function AdminSidebar({ pendingCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        {
          label: 'Dashboard',
          href: '/admin',
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
      ],
    },
    {
      title: 'Events',
      items: [
        {
          label: 'Pending Review',
          href: '/admin/events/pending',
          icon: <Clock className="w-5 h-5" />,
          badge: pendingCount,
        },
        {
          label: 'All Events',
          href: '/admin/events',
          icon: <Calendar className="w-5 h-5" />,
        },
        {
          label: 'Published',
          href: '/admin/events?status=published',
          icon: <CheckCircle className="w-5 h-5" />,
        },
        {
          label: 'Rejected',
          href: '/admin/events?status=rejected',
          icon: <XCircle className="w-5 h-5" />,
        },
      ],
    },
    {
      title: 'Reports',
      items: [
        {
          label: 'Activity Log',
          href: '/admin/activity',
          icon: <FileText className="w-5 h-5" />,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-charcoal text-warm-white flex flex-col h-screen sticky top-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold">Happenlist</span>
          <span className="text-coral text-xs font-medium px-2 py-0.5 rounded bg-coral/20">
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="px-6 text-xs font-medium text-stone uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href.split('?')[0]));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-6 py-2.5 text-sm',
                        'transition-colors duration-150',
                        'hover:bg-white/5',
                        isActive
                          ? 'bg-white/10 text-coral border-r-2 border-coral'
                          : 'text-white/70 hover:text-white'
                      )}
                    >
                      <span className={cn(isActive && 'text-coral')}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-coral text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 text-coral" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="p-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Back to Site</span>
        </Link>
      </div>
    </aside>
  );
}
