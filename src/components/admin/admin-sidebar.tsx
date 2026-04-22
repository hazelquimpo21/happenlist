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
  Repeat,
  LogOut,
  ChevronRight,
  BarChart3,
  Download,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_ENTITY_LIST } from '@/lib/constants/admin-entities';

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
        {
          // Superadmin-only in the page, but we surface the link to everyone in
          // the sidebar and let the page handle the redirect for non-superadmins.
          label: 'Import',
          href: '/admin/import',
          icon: <Download className="w-5 h-5" />,
        },
      ],
    },
    {
      title: 'Series',
      items: [
        {
          label: 'All Series',
          href: '/admin/series',
          icon: <Repeat className="w-5 h-5" />,
        },
      ],
    },
    {
      // Directory: the four entity CRUD surfaces (organizers, venues,
      // performers, membership_orgs). Source of truth: admin-entities.ts.
      title: 'Directory',
      items: ADMIN_ENTITY_LIST.map((meta) => {
        const Icon = meta.icon;
        return {
          label: meta.labelPlural,
          href: `/admin/${meta.urlSlug}`,
          icon: <Icon className="w-5 h-5" />,
        };
      }),
    },
    {
      title: 'Reports',
      items: [
        {
          label: 'Activity Log',
          href: '/admin/activity',
          icon: <FileText className="w-5 h-5" />,
        },
        {
          label: 'Cleanup Worklists',
          href: '/admin/worklists',
          icon: <ListChecks className="w-5 h-5" />,
        },
        {
          label: 'Signals Calibration',
          href: '/admin/signals-calibration',
          icon: <BarChart3 className="w-5 h-5" />,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-ink text-pure flex flex-col h-screen sticky top-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-body text-xl font-semibold">Happenlist</span>
          <span className="text-blue text-xs font-medium px-2 py-0.5 rounded bg-blue/20">
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="px-6 text-xs font-medium text-zinc uppercase tracking-wider mb-2">
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
                          ? 'bg-white/10 text-blue border-r-2 border-blue'
                          : 'text-white/70 hover:text-white'
                      )}
                    >
                      <span className={cn(isActive && 'text-blue')}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-blue text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 text-blue" />}
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
