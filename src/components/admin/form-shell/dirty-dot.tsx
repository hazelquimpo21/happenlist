/**
 * DirtyDot
 * ========
 * Tiny visual primitive — colored dot used in the section TOC and command
 * bar to indicate "this section has unsaved changes". Pulses gently while
 * dirty to draw the eye without being noisy.
 *
 * @module components/admin/form-shell/dirty-dot
 */
import { cn } from '@/lib/utils';

interface Props {
  active: boolean;
  /** Optional extra classes for sizing or color override. */
  className?: string;
}

export function DirtyDot({ active, className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block w-1.5 h-1.5 rounded-full transition-all duration-base',
        active ? 'bg-blue animate-pulse' : 'bg-mist',
        className,
      )}
    />
  );
}
