/**
 * VENUE SOCIAL LINKS COMPONENT
 * =============================
 * Displays social media profile links for a venue.
 *
 * Uses the social_links JSONB field from the locations table.
 * Supports: Instagram, TikTok, Facebook, Twitter/X, YouTube.
 */

import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VenueSocialLinks as SocialLinksType } from '@/types/venue';

// ============================================================================
// TIKTOK ICON (not available in lucide-react)
// ============================================================================

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

// ============================================================================
// LINK CONFIGURATION
// ============================================================================

interface SocialConfig {
  key: keyof SocialLinksType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  hoverClass: string;
}

const SOCIAL_CONFIGS: SocialConfig[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    colorClass: 'text-pink-500',
    hoverClass: 'hover:text-pink-500/80 hover:bg-pink-50',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    colorClass: 'text-blue-600',
    hoverClass: 'hover:text-blue-600/80 hover:bg-blue-50',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: TikTokIcon,
    colorClass: 'text-gray-900',
    hoverClass: 'hover:text-gray-900/80 hover:bg-gray-50',
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    icon: Twitter,
    colorClass: 'text-gray-800',
    hoverClass: 'hover:text-gray-800/80 hover:bg-gray-50',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    colorClass: 'text-red-600',
    hoverClass: 'hover:text-red-600/80 hover:bg-red-50',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface VenueSocialLinksProps {
  socialLinks: SocialLinksType | null | undefined;
  className?: string;
}

/**
 * Displays social media links for a venue.
 * Returns null if no valid social links are present.
 */
export function VenueSocialLinks({ socialLinks, className }: VenueSocialLinksProps) {
  if (!socialLinks) return null;

  // Filter to only platforms that have a URL
  const availableLinks = SOCIAL_CONFIGS.filter((config) => {
    const url = socialLinks[config.key];
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  });

  if (availableLinks.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="font-medium text-charcoal text-body-sm">Follow</p>
      <div className="flex items-center gap-1">
        {availableLinks.map((config) => {
          const url = socialLinks[config.key]!;
          const Icon = config.icon;

          return (
            <a
              key={config.key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'p-2 rounded-lg transition-colors',
                config.colorClass,
                config.hoverClass
              )}
              title={config.label}
              aria-label={`${config.label} profile`}
            >
              <Icon className="w-5 h-5" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
