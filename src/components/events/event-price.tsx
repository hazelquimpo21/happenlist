/**
 * EVENT PRICE COMPONENT
 * =====================
 * Displays event pricing with appropriate styling.
 */

import { cn } from '@/lib/utils';
import { formatPrice, isFreeEvent, getPriceClassName } from '@/lib/utils/price';

interface EventPriceProps {
  /** Event pricing data */
  event: {
    price_type: string;
    price_low: number | null;
    price_high: number | null;
    is_free: boolean;
    price_details?: string | null;
  };
  /** Display size */
  size?: 'sm' | 'md' | 'lg';
  /** Show additional price details */
  showDetails?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays formatted event price.
 *
 * @example
 * <EventPrice event={event} />
 *
 * @example
 * <EventPrice event={event} size="lg" showDetails />
 */
export function EventPrice({
  event,
  size = 'md',
  showDetails = false,
  className,
}: EventPriceProps) {
  const price = formatPrice(event);
  const isFree = isFreeEvent(event);

  // Size styles
  const sizeStyles = {
    sm: 'text-body-sm',
    md: 'text-body',
    lg: 'text-h3',
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <span
        className={cn(
          'font-medium',
          sizeStyles[size],
          isFree ? 'text-sage' : 'text-charcoal'
        )}
      >
        {price}
      </span>

      {/* Additional price details */}
      {showDetails && event.price_details && (
        <span className="text-body-sm text-stone mt-0.5">
          {event.price_details}
        </span>
      )}
    </div>
  );
}
