/**
 * StatusPill
 * ===========
 * Small badge that renders an event/series status using the centralized
 * STATUS_META palette. Pulses when the status is "needs attention".
 *
 * @module components/admin/form-shell/status-pill
 */
import { cn } from '@/lib/utils';
import { getStatusMeta } from '@/lib/constants/admin-status-palette';

interface Props {
  status: string | null | undefined;
  /** Compact form omits the icon and uses a smaller pill. */
  compact?: boolean;
  className?: string;
}

export function StatusPill({ status, compact = false, className }: Props) {
  const meta = getStatusMeta(status);
  const Icon = meta.icon;

  return (
    <span
      title={meta.hint}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        meta.pill,
        className,
      )}
    >
      {meta.pulse && (
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', meta.dot)} />
      )}
      {!compact && <Icon className="w-3.5 h-3.5" />}
      <span>{meta.label}</span>
    </span>
  );
}
