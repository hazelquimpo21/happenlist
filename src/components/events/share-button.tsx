'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  title: string;
  text?: string;
  className?: string;
}

export function ShareButton({ title, text, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    // Use native share sheet if available (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort: prompt-based fallback for older browsers
      window.prompt('Copy this link:', url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? 'Link copied to clipboard' : 'Share this event'}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'font-body font-medium rounded-md transition-all duration-base',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-light',
        'bg-transparent text-zinc hover:text-ink hover:bg-cloud',
        'px-6 py-2.5 text-body h-11',
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Share
        </>
      )}
    </button>
  );
}
