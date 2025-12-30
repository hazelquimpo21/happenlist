/**
 * ACTIVITY LOG PAGE
 * ==================
 * Admin audit log showing all recent admin actions.
 */

import { format } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  Edit,
  FileText,
  Calendar,
  Filter,
} from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRecentActivity } from '@/data/admin';
import { adminDataLogger } from '@/lib/utils/logger';

export const metadata = {
  title: 'Activity Log',
};

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ActivityLogPage({ searchParams }: PageProps) {
  const timer = adminDataLogger.time('ActivityLogPage render');

  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit) : 50;

  const activities = await getRecentActivity(limit);

  timer.success(`Loaded ${activities.length} activities`);

  // Action icon mapping
  const getActionIcon = (action: string) => {
    if (action.includes('approved')) return <CheckCircle className="w-4 h-4 text-sage" />;
    if (action.includes('rejected')) return <XCircle className="w-4 h-4 text-red-500" />;
    if (action.includes('edited')) return <Edit className="w-4 h-4 text-blue-500" />;
    if (action.includes('published')) return <Calendar className="w-4 h-4 text-coral" />;
    return <FileText className="w-4 h-4 text-stone" />;
  };

  // Action label formatting
  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Activity Log"
        description="Recent admin actions and changes"
      />

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Activity Log' },
          ]}
        />

        {activities.length === 0 ? (
          <Card padding="lg" className="border border-sand text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-stone/50" />
            <h2 className="font-display text-xl text-charcoal mb-2">
              No Activity Yet
            </h2>
            <p className="text-stone max-w-md mx-auto">
              Admin actions like approving, rejecting, and editing events will appear here.
            </p>
          </Card>
        ) : (
          <Card className="border border-sand overflow-hidden">
            <table className="w-full">
              <thead className="bg-sand/30">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone uppercase tracking-wider">
                    Action
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-sand/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(activity.action)}
                        <span className="text-sm font-medium text-charcoal">
                          {formatAction(activity.action)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" size="sm">
                          {activity.entity_type}
                        </Badge>
                        <span className="text-xs font-mono text-stone">
                          {activity.entity_id.slice(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-charcoal">
                        {activity.admin_email || 'System'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {activity.notes ? (
                        <span className="text-sm text-stone line-clamp-1 max-w-xs">
                          {activity.notes}
                        </span>
                      ) : (
                        <span className="text-sm text-stone/50">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone">
                        {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
