/**
 * STAT CARD COMPONENT
 * ====================
 * Dashboard statistic card for displaying key metrics.
 */

import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: 'coral' | 'sage' | 'stone' | 'charcoal';
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'coral',
  trend,
  href,
  className,
}: StatCardProps) {
  const iconColorStyles = {
    coral: 'text-coral bg-coral/10',
    sage: 'text-sage bg-sage/10',
    stone: 'text-stone bg-sand',
    charcoal: 'text-charcoal bg-sand',
  };

  const trendStyles = {
    up: 'text-sage',
    down: 'text-red-500',
    neutral: 'text-stone',
  };

  const Wrapper = href ? 'a' : 'div';

  return (
    <Wrapper
      href={href}
      className={cn(
        'bg-warm-white rounded-xl p-6 border border-sand',
        'transition-all duration-200',
        href && 'hover:border-coral hover:shadow-md cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone font-medium mb-1">{label}</p>
          <p className="text-3xl font-display font-semibold text-charcoal">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div
          className={cn(
            'p-3 rounded-xl',
            iconColorStyles[iconColor]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className={cn('flex items-center gap-1 mt-3', trendStyles[trend.direction])}>
          {trend.direction === 'up' && <TrendingUp className="w-4 h-4" />}
          {trend.direction === 'down' && <TrendingDown className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {trend.direction !== 'neutral' && (trend.value > 0 ? '+' : '')}
            {trend.value}
          </span>
          <span className="text-sm text-stone">{trend.label}</span>
        </div>
      )}
    </Wrapper>
  );
}

/**
 * Grid wrapper for stat cards
 */
interface StatCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function StatCardGrid({ children, columns = 4 }: StatCardGridProps) {
  const gridStyles = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-6', gridStyles[columns])}>
      {children}
    </div>
  );
}
