/**
 * =============================================================================
 * <SectionLabel> — monospace eyebrow
 * =============================================================================
 *
 * Reusable uppercase tracked-out mono label used above editorial sections
 * across the event detail redesign. Centralizes what was a repeated Tailwind
 * string (`font-mono text-[11px] font-bold tracking-[0.2em] uppercase`).
 *
 * Size scale:
 *   xs → 10px  (tight card labels)
 *   sm → 11px  (default section eyebrow)
 *   md → 12px  (hero eyebrow)
 *
 * When an icon is passed, it renders left-aligned at the same size as the
 * type, colored to match the label. Single DOM element; decorative icons
 * are aria-hidden.
 * =============================================================================
 */

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Size = 'xs' | 'sm' | 'md';

const SIZE_CLASSES: Record<Size, string> = {
  xs: 'text-[10px] tracking-[0.15em]',
  sm: 'text-[11px] tracking-[0.2em]',
  md: 'text-[12px] tracking-[0.25em]',
};

interface SectionLabelProps {
  children: React.ReactNode;
  /** Tint color override — pass categoryColor.accent for on-brand moments. */
  color?: string;
  icon?: LucideIcon;
  size?: Size;
  className?: string;
  as?: 'p' | 'h2' | 'h3';
}

export function SectionLabel({
  children,
  color,
  icon: Icon,
  size = 'sm',
  className,
  as: Tag = 'p',
}: SectionLabelProps) {
  const hasIcon = !!Icon;
  return (
    <Tag
      className={cn(
        'font-mono font-bold uppercase',
        SIZE_CLASSES[size],
        hasIcon && 'flex items-center gap-2',
        !color && 'text-zinc',
        className,
      )}
      style={color ? { color } : undefined}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </Tag>
  );
}
