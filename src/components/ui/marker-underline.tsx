/**
 * =============================================================================
 * <MarkerUnderline> — hand-drawn underline swoop
 * =============================================================================
 *
 * Magazine-editorial A-energy, contained to one SVG primitive. Use on ONE
 * word per title maximum — typically the highest-signal proper noun. Page
 * logic picks the word; this component just wraps and renders the swoop.
 *
 * The slight path asymmetry (Q50,4 100,10 T198,8) is intentional — a perfectly
 * smooth curve reads as a generic underline, the wobble reads as a hand.
 *
 * If it ages badly, deleting the component and its usages is a 10-minute job.
 * =============================================================================
 */

import { cn } from '@/lib/utils';

interface MarkerUnderlineProps {
  children: React.ReactNode;
  /** Defaults to brand orange. Pass category accent or anything else to override. */
  color?: string;
  className?: string;
}

export function MarkerUnderline({
  children,
  color = '#d95927',
  className,
}: MarkerUnderlineProps) {
  return (
    <span className={cn('relative inline-block', className)}>
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 20"
        preserveAspectRatio="none"
        className="absolute -bottom-[0.1em] left-[-2%] w-[104%] h-[0.3em] pointer-events-none"
      >
        <path
          d="M2,14 Q50,4 100,10 T198,8"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
