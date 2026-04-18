/**
 * =============================================================================
 * signals-copy.ts — human sentences from signal enums
 * =============================================================================
 *
 * The tagging-expansion work (Stages 1–4) gave Happenlist the data. This file
 * gives that data a voice.
 *
 * Used by <HowItFeelsSection> on the event detail page. If a combination
 * doesn't have a hand-written sentence yet, the functions return null and the
 * component falls back to rendering pills. Sentence is preferable where we
 * have one — it reads more like a person describing the room than a spec.
 *
 * Coverage today is deliberate-not-exhaustive. Add more combos as the
 * component surfaces events with unusual pairings.
 *
 * Cross-file coupling:
 *   - src/lib/constants/vocabularies.ts — the enums we read
 *   - src/components/events/how-it-feels-section.tsx — the consumer
 *   - src/components/events/vibe-profile.tsx — has its own LEAVE_WITH_ICONS
 *     map; if icons drift, reconcile here. (Duplicated intentionally to avoid
 *     creating a deep import from a 'use client' file into a server-friendly
 *     helper.)
 * =============================================================================
 */

import {
  Hammer,
  GraduationCap,
  Users,
  UtensilsCrossed,
  Camera,
  Wind,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import {
  SENSORY_TAG_LABELS,
  SOCIAL_MODE_LABELS,
  ENERGY_NEEDED_LABELS,
  type SensoryTag,
  type LeaveWith,
  type SocialMode,
  type EnergyNeeded,
} from '@/lib/constants/vocabularies';

// -----------------------------------------------------------------------------
// LEAVE-WITH ICON MAP
// -----------------------------------------------------------------------------
// Duplicates the map in vibe-profile.tsx. Kept in sync manually — if one
// changes, change the other. Larger-icon variant used by HowItFeelsSection.

export const LEAVE_WITH_ICON_MAP: Record<LeaveWith, LucideIcon> = {
  a_thing_you_made: Hammer,
  a_new_skill: GraduationCap,
  a_new_connection: Users,
  a_full_belly: UtensilsCrossed,
  a_photo_or_memory: Camera,
  a_shifted_mood: Wind,
  just_an_experience: Sparkles,
};

// -----------------------------------------------------------------------------
// THE CROWD — social_mode + energy_needed → one sentence
// -----------------------------------------------------------------------------
// Returns a human sentence when we have a good fit. When social or energy is
// null, falls back to labeled key:value rows (the component handles this).

export function buildCrowdSentence(
  social: SocialMode | null,
  energy: EnergyNeeded | null,
): string | null {
  if (!social && !energy) return null;

  // Sentences covering the 10–12 most common combos. If we hit an unmapped
  // combo, return null and let the component show the two enum labels instead.

  // Solo-welcoming combos — the big one, because Jamie-the-primary-user
  // specifically benefits from "can I come alone" answers.
  if (social === 'solo_welcoming' && energy === 'receptive') {
    return 'Low-key. You can show up alone, sit back, and receive. No pressure to mingle or perform.';
  }
  if (social === 'solo_welcoming' && energy === 'light_participation') {
    return 'Easy to come alone. A little clapping, maybe a question answered — nothing that puts you on the spot.';
  }
  if (social === 'solo_welcoming' && energy === 'participatory') {
    return 'Fine to come alone, but you will be doing the thing. Come ready to move, make, or speak.';
  }
  if (social === 'solo_welcoming' && energy === 'mentally_demanding') {
    return 'Solo is totally normal here. Bring focus — this one asks for attention.';
  }

  // Observational — concerts, films, talks
  if (social === 'observational' && energy === 'receptive') {
    return 'Audience-shaped. You watch; the room is not here to talk to you.';
  }
  if (social === 'observational' && energy === 'light_participation') {
    return 'Mostly audience-mode — expect some clapping, singing along, or crowd moments.';
  }

  // Mingling required — the warning-signal combos
  if (social === 'mingling_required') {
    if (energy === 'light_participation') {
      return 'Meeting strangers is the point. Low-stakes chat, but you cannot hide in a corner.';
    }
    if (energy === 'emotionally_demanding') {
      return 'Meeting strangers, and going deep. Reserve emotional budget for this one.';
    }
    return 'Meeting strangers is the format. Come ready to introduce yourself.';
  }

  // Pair / small-group
  if (social === 'pair_friendly' && energy === 'receptive') {
    return 'Works great with one other person. No heavy lifting.';
  }
  if (social === 'pair_friendly' && energy === 'participatory') {
    return 'Best with one other person — you will both be doing the thing together.';
  }
  if (social === 'small_group') {
    return energy === 'participatory'
      ? 'Sweet spot is 3–6 people actively doing the thing together.'
      : 'Designed for 3–6 people. Good group-of-friends territory.';
  }
  if (social === 'large_group') {
    return 'Shines with 6+. Bring the crew.';
  }

  // Parallel play — coworking-like
  if (social === 'parallel_play') {
    return 'In a room with others, doing your own thing. Friendly, not chatty.';
  }

  // Physical-demanding fallback
  if (energy === 'physically_demanding') {
    return social
      ? `${SOCIAL_MODE_LABELS[social]}. Physical — come in workout clothes.`
      : 'Physical — come in workout clothes, expect to sweat.';
  }

  // Emotionally heavy fallback
  if (energy === 'emotionally_demanding') {
    return social
      ? `${SOCIAL_MODE_LABELS[social]}. Heavy material — pace yourself.`
      : 'Heavy material — pace yourself.';
  }

  return null;
}

// -----------------------------------------------------------------------------
// THE ROOM — sensory tags → one sentence (when coverage is good)
// -----------------------------------------------------------------------------
// Focuses on the handful of high-signal combos. Strobe gets its own sentence
// because it's seizure-relevant. Quiet-expected gets its own because it's a
// hard constraint on what you can bring (kids, loud voices, drinks).

export function buildSensorySentence(
  tags: readonly SensoryTag[],
): string | null {
  if (tags.length === 0) return null;

  const set = new Set(tags);

  // Seizure warning wins all framing — caller renders this + a warning sticker.
  if (set.has('strobe_lights')) {
    const loud = set.has('loud_music') || set.has('live_amplified');
    return loud
      ? 'Loud and strobing. Heads up if you are photosensitive or sound-sensitive.'
      : 'Strobing light at points. Heads up if you are photosensitive.';
  }

  if (set.has('quiet_expected')) {
    return 'Library rules. Whispers and a calm body — this is not a talking-out-loud room.';
  }

  if (set.has('loud_music') && set.has('crowded')) {
    return 'Loud and packed. Expect bodies within arms-reach and music you will feel in your chest.';
  }

  if (set.has('live_amplified') && set.has('standing_room')) {
    return 'Live amplified sound, no guaranteed seats. On your feet the whole time.';
  }

  if (set.has('loud_music')) {
    return 'Loud. Conversation between songs only — plan around that.';
  }

  if (set.has('low_light') || set.has('dark_room')) {
    return set.has('seated_throughout')
      ? 'Dim and seated throughout. Intimate, slow-paced.'
      : 'Dim room. Dress for mood, not for reading a program.';
  }

  if (set.has('seated_throughout')) {
    return 'Seated throughout. You will not be on your feet.';
  }

  if (set.has('strong_scents')) {
    return 'Strong scents — incense, oils, or cooking aromas depending on the event.';
  }

  if (set.has('unpredictable_volume')) {
    return 'Volume varies a lot. Kids events and festivals swing from quiet to loud with little warning.';
  }

  return null;
}

// -----------------------------------------------------------------------------
// Renders the un-sentence-ified tags as standalone labels for fallback.
// -----------------------------------------------------------------------------

export function sensoryTagLabel(tag: SensoryTag): string {
  return SENSORY_TAG_LABELS[tag];
}

export function socialModeLabel(mode: SocialMode): string {
  return SOCIAL_MODE_LABELS[mode];
}

export function energyNeededLabel(energy: EnergyNeeded): string {
  return ENERGY_NEEDED_LABELS[energy];
}
