/**
 * <PersonalityStickers> — editorial hook phrases as rotated stickers.
 *
 * Replaces the old tinted bordered pills. Each badge rotates slightly in
 * alternating directions so the row feels like a playful collage, not a
 * regimented chip list.
 */

import { MessageCircle } from 'lucide-react';
import { Sticker } from '@/components/ui';

interface PersonalityStickersProps {
  badges: string[];
}

export function PersonalityStickers({ badges }: PersonalityStickersProps) {
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3 pl-1">
      {badges.map((badge, i) => (
        <Sticker
          key={i}
          variant="cream"
          rotate={i % 2 === 0 ? -2 : 2}
          className="!py-2 !text-xs"
        >
          <MessageCircle className="w-3 h-3 mr-1.5" aria-hidden="true" />
          {badge}
        </Sticker>
      ))}
    </div>
  );
}
