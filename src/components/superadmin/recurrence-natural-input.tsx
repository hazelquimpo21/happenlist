'use client';

/**
 * RECURRENCE NATURAL-LANGUAGE INPUT
 * ==================================
 * A small helper above the structured RecurrenceBuilder: the operator types a
 * plain-English description ("every other Tuesday at 7pm through May") and we
 * call the scraper to parse it into a structured RecurrenceRule.
 *
 * The parsed rule is handed back to the parent via `onParsed` — the parent
 * decides whether to pre-fill a RecurrenceBuilder, save to series immediately,
 * or something else.
 *
 * Coupling notes:
 *  - Calls /api/superadmin/parse-recurrence (thin proxy to scraper).
 *  - Return shape matches lib/scraper/types ScraperRecurrenceResponse.
 *  - The RecurrenceRule fields are a superset of what we render; consumer
 *    should treat unknowns as passthrough.
 *
 * @module components/superadmin/recurrence-natural-input
 */

import { useState, useCallback } from 'react';
import { Sparkles, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecurrenceRule } from '@/lib/supabase/types';

interface Props {
  /** YYYY-MM-DD — passed to the scraper to resolve "through May" etc. */
  startDate?: string | null;
  /** HH:MM — used when the description doesn't state a time. */
  defaultTime?: string | null;
  /** Called with the parsed rule + normalized description. */
  onParsed: (result: { rule: RecurrenceRule; description: string }) => void;
}

export function RecurrenceNaturalInput({ startDate, defaultTime, onParsed }: Props) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'parsing' | 'error' | 'success'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const parse = useCallback(async () => {
    if (text.trim().length < 4) return;
    setStatus('parsing');
    setMessage(null);
    try {
      const res = await fetch('/api/superadmin/parse-recurrence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: text.trim(),
          startDate: startDate || undefined,
          defaultTime: defaultTime || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || `Parse failed (${res.status})`);
        return;
      }
      setStatus('success');
      setMessage(data.recurrence_description || 'Parsed');
      onParsed({
        rule: data.recurrence_rule as RecurrenceRule,
        description: data.recurrence_description,
      });
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Network error');
    }
  }, [text, startDate, defaultTime, onParsed]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      parse();
    }
  };

  return (
    <div className="bg-blue/5 border border-blue/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <Sparkles className="w-4 h-4 text-blue" />
        Describe it in plain English
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. every other Tuesday at 7pm through May"
          disabled={status === 'parsing'}
          className="flex-1 px-3 py-2 border border-mist rounded-lg focus:border-blue focus:ring-1 focus:ring-blue outline-none text-sm bg-pure"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={parse}
          disabled={status === 'parsing' || text.trim().length < 4}
        >
          {status === 'parsing' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Parsing…
            </>
          ) : (
            'Parse'
          )}
        </Button>
      </div>
      {status === 'error' && message && (
        <div className="text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      )}
      {status === 'success' && message && (
        <div className="text-sm text-emerald flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Parsed: <strong className="font-medium">{message}</strong></span>
        </div>
      )}
    </div>
  );
}
