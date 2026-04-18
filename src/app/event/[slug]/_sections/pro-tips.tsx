/**
 * <ProTips> — persona-scoped insider tips.
 *
 * Renders 0–2 tips produced by the scraper's pro-tips analyzer. Each tip is
 * tagged with a persona label (Parents, Driving / parking, Concert-goers,
 * etc.) so the reader can self-select the one that applies to them.
 *
 * Most events have zero pro tips — the analyzer is prompted to return empty
 * unless something genuinely decision-relevant applies. Do not render the
 * section when the array is empty.
 */

import { Lightbulb } from 'lucide-react';
import { SectionLabel } from '@/components/ui';
import {
  PRO_TIP_PERSONA_LABELS,
  isProTipPersona,
  type ProTip,
} from '@/lib/constants/vocabularies';

interface ProTipsProps {
  tips: ProTip[];
  accentColor: string;
}

export function ProTips({ tips, accentColor }: ProTipsProps) {
  const valid = tips.filter((t) => t && isProTipPersona(t.persona) && typeof t.tip === 'string' && t.tip.trim().length > 0);
  if (valid.length === 0) return null;

  return (
    <section>
      <SectionLabel icon={Lightbulb} color={accentColor} className="mb-4">
        Pro tips
      </SectionLabel>
      <ul className="space-y-4">
        {valid.slice(0, 2).map((tip, idx) => (
          <li key={`${tip.persona}-${idx}`} className="border-l-2 border-ink pl-4">
            <div
              className="font-mono text-[10px] tracking-[0.15em] uppercase mb-1"
              style={{ color: accentColor }}
            >
              {PRO_TIP_PERSONA_LABELS[tip.persona]}
            </div>
            <p className="text-base leading-relaxed text-ink">{tip.tip}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
