/**
 * EVENT LINKS COMPONENT
 * =====================
 * Displays external links for an event (website, social media, tickets, registration).
 *
 * 🎯 PURPOSE:
 * - Show all available external links in a clean, organized way
 * - Use recognizable icons for each platform
 * - Handle gracefully when some links are missing
 *
 * 📝 USAGE:
 * ```tsx
 * <EventLinks
 *   websiteUrl={event.website_url}
 *   instagramUrl={event.instagram_url}
 *   facebookUrl={event.facebook_url}
 *   ticketUrl={event.ticket_url}
 *   registrationUrl={event.registration_url}
 * />
 * ```
 *
 * 🎨 VARIANTS:
 * - "full": Shows all links with labels (for event detail page)
 * - "compact": Shows just icons (for tight spaces)
 */

import { ExternalLink, Globe, Instagram, Facebook, Ticket, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface EventLinksProps {
  /** Event's own website URL */
  websiteUrl?: string | null;
  /** Instagram profile or post URL */
  instagramUrl?: string | null;
  /** Facebook event or page URL */
  facebookUrl?: string | null;
  /** Ticket purchase URL */
  ticketUrl?: string | null;
  /** Registration/RSVP URL */
  registrationUrl?: string | null;
  /** Display variant */
  variant?: 'full' | 'compact';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Configuration for each link type.
 * Keeps link metadata in one place for easy maintenance.
 */
interface LinkConfig {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  hoverClass: string;
}

// ============================================================================
// LINK CONFIGURATION
// ============================================================================

const LINK_CONFIGS: LinkConfig[] = [
  {
    key: 'website',
    label: 'Event Website',
    shortLabel: 'Website',
    icon: Globe,
    colorClass: 'text-coral',
    hoverClass: 'hover:text-coral/80 hover:bg-coral/5',
  },
  {
    key: 'registration',
    label: 'Register / RSVP',
    shortLabel: 'Register',
    icon: ClipboardList,
    colorClass: 'text-sage',
    hoverClass: 'hover:text-sage/80 hover:bg-sage/5',
  },
  {
    key: 'ticket',
    label: 'Get Tickets',
    shortLabel: 'Tickets',
    icon: Ticket,
    colorClass: 'text-amber-600',
    hoverClass: 'hover:text-amber-600/80 hover:bg-amber-50',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    shortLabel: 'Instagram',
    icon: Instagram,
    colorClass: 'text-pink-500',
    hoverClass: 'hover:text-pink-500/80 hover:bg-pink-50',
  },
  {
    key: 'facebook',
    label: 'Facebook Event',
    shortLabel: 'Facebook',
    icon: Facebook,
    colorClass: 'text-blue-600',
    hoverClass: 'hover:text-blue-600/80 hover:bg-blue-50',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets the URL for a given link key from props.
 */
function getUrlForKey(
  key: string,
  props: EventLinksProps
): string | null | undefined {
  switch (key) {
    case 'website':
      return props.websiteUrl;
    case 'registration':
      return props.registrationUrl;
    case 'ticket':
      return props.ticketUrl;
    case 'instagram':
      return props.instagramUrl;
    case 'facebook':
      return props.facebookUrl;
    default:
      return null;
  }
}

/**
 * Validates if a URL is properly formatted.
 * Basic validation - just checks if it starts with http.
 */
function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Displays external links for an event.
 *
 * @example Full variant (event detail page)
 * ```tsx
 * <EventLinks
 *   websiteUrl="https://jazzconcert.com"
 *   instagramUrl="https://instagram.com/jazzevent"
 *   ticketUrl="https://tickets.com/jazz"
 *   variant="full"
 * />
 * ```
 *
 * @example Compact variant (cards/tight spaces)
 * ```tsx
 * <EventLinks
 *   instagramUrl="https://instagram.com/event"
 *   facebookUrl="https://facebook.com/events/123"
 *   variant="compact"
 * />
 * ```
 */
export function EventLinks({
  websiteUrl,
  instagramUrl,
  facebookUrl,
  ticketUrl,
  registrationUrl,
  variant = 'full',
  className,
}: EventLinksProps) {
  // Filter to only links that have valid URLs
  const availableLinks = LINK_CONFIGS.filter((config) => {
    const url = getUrlForKey(config.key, {
      websiteUrl,
      instagramUrl,
      facebookUrl,
      ticketUrl,
      registrationUrl,
    });
    return isValidUrl(url);
  });

  // Early return if no links available
  if (availableLinks.length === 0) {
    console.log('📎 [EventLinks] No valid links to display');
    return null;
  }

  console.log(`📎 [EventLinks] Displaying ${availableLinks.length} link(s)`);

  // Get props object for URL lookup
  const props = { websiteUrl, instagramUrl, facebookUrl, ticketUrl, registrationUrl };

  // -------------------------------------------------------------------------
  // COMPACT VARIANT: Just icons in a row
  // -------------------------------------------------------------------------
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {availableLinks.map((config) => {
          const url = getUrlForKey(config.key, props);
          const Icon = config.icon;

          return (
            <a
              key={config.key}
              href={url!}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'p-1.5 rounded-full transition-colors',
                config.colorClass,
                config.hoverClass
              )}
              title={config.label}
              aria-label={config.label}
            >
              <Icon className="w-4 h-4" />
            </a>
          );
        })}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // FULL VARIANT: Icons with labels in a list
  // -------------------------------------------------------------------------
  return (
    <div className={cn('space-y-2', className)}>
      {availableLinks.map((config) => {
        const url = getUrlForKey(config.key, props);
        const Icon = config.icon;

        return (
          <a
            key={config.key}
            href={url!}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg',
              'text-charcoal transition-colors',
              'border border-transparent',
              config.hoverClass,
              'hover:border-sand'
            )}
          >
            <Icon className={cn('w-5 h-5 flex-shrink-0', config.colorClass)} />
            <span className="text-body-sm font-medium">{config.label}</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone/50 ml-auto" />
          </a>
        );
      })}
    </div>
  );
}

// ============================================================================
// SINGLE LINK COMPONENT (for individual use)
// ============================================================================

interface SingleLinkProps {
  /** URL to link to */
  url: string;
  /** Type of link */
  type: 'website' | 'instagram' | 'facebook' | 'ticket' | 'registration';
  /** Show label or just icon */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Single external link with icon.
 * Use this when you need just one link, not the full set.
 *
 * @example
 * ```tsx
 * <EventLink url="https://instagram.com/event" type="instagram" />
 * ```
 */
export function EventLink({
  url,
  type,
  showLabel = true,
  className,
}: SingleLinkProps) {
  const config = LINK_CONFIGS.find((c) => c.key === type);

  if (!config || !isValidUrl(url)) {
    return null;
  }

  const Icon = config.icon;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 transition-colors',
        config.colorClass,
        config.hoverClass,
        showLabel ? 'px-3 py-1.5 rounded-lg' : 'p-1.5 rounded-full',
        className
      )}
      title={config.label}
    >
      <Icon className="w-4 h-4" />
      {showLabel && <span className="text-body-sm">{config.shortLabel}</span>}
    </a>
  );
}

