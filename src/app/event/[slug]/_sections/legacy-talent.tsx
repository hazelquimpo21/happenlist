/**
 * <LegacyTalent> — fallback when no linked performers exist.
 *
 * Renders the legacy talent_name + talent_bio fields. Shown only when the
 * modern event_performers array is empty, so a migrated row doesn't render
 * the performer twice.
 */

import { SectionLabel } from '@/components/ui';

interface LegacyTalentProps {
  name: string;
  bio?: string | null;
}

export function LegacyTalent({ name, bio }: LegacyTalentProps) {
  return (
    <section>
      <SectionLabel className="mb-4">Featured</SectionLabel>
      <h2 className="text-3xl md:text-4xl font-extrabold text-ink leading-tight tracking-tight mb-3">
        {name}
      </h2>
      {bio && <p className="text-zinc leading-relaxed">{bio}</p>}
    </section>
  );
}
