/**
 * <EditorsTake> — compact sidebar card for Happenlist's editorial commentary.
 *
 * Replaces the old "Part I · The pitch" chapter in the main column. The
 * content (happenlist_summary + personality_badges) was over-dignified by a
 * full chapter header — it's meta-commentary FROM Happenlist ABOUT the event,
 * not part of the event description. Now lives where other "our take" belongs:
 * the sidebar, below the ticket stub.
 *
 * Empty when both fields are missing. Personality stickers row hides
 * independently. Why-we-picked pull-quote hides independently.
 *
 * Cross-file coupling:
 *   - src/app/event/[slug]/page.tsx — rendered below <TicketStub>
 *   - src/components/ui/sticker.tsx — personality-stickers row
 */

import { Sparkles, MessageCircle } from 'lucide-react';
import { Sticker, SectionLabel } from '@/components/ui';

interface EditorsTakeProps {
  summary?: string | null;
  personalityBadges?: string[] | null;
  accentColor: string;
}

export function EditorsTake({
  summary,
  personalityBadges,
  accentColor,
}: EditorsTakeProps) {
  const hasSummary = !!summary;
  const hasBadges = !!(personalityBadges && personalityBadges.length > 0);
  if (!hasSummary && !hasBadges) return null;

  return (
    <section
      aria-label="Happenlist's take"
      className="p-5 bg-pure border-2 border-ink"
      style={{ boxShadow: `4px 4px 0 ${accentColor}` }}
    >
      <SectionLabel icon={Sparkles} color={accentColor} className="mb-3">
        Happenlist&apos;s take
      </SectionLabel>

      {hasSummary && (
        <p className="text-base font-medium italic leading-snug text-ink mb-4">
          {summary}
        </p>
      )}

      {hasBadges && (
        <div className="flex flex-wrap gap-2">
          {personalityBadges!.map((badge, i) => (
            <Sticker
              key={i}
              variant="cream"
              rotate={i % 2 === 0 ? -2 : 2}
              className="!py-1 !px-2 !text-[10px]"
            >
              <MessageCircle className="w-3 h-3 mr-1" aria-hidden="true" />
              {badge}
            </Sticker>
          ))}
        </div>
      )}
    </section>
  );
}
