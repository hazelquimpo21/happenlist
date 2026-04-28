/**
 * Money & links section
 * ======================
 * Pricing (price type + low/high) and external links (ticket, registration,
 * website, IG, FB).
 *
 * Pricing layout uses a single column wrapper — the prior 3-column grid
 * shifted widths as price_type changed, which felt unstable.
 *
 * @module components/superadmin/event-edit-form/sections/money-links-section
 */
'use client';

import { ChevronDown } from 'lucide-react';
import { FieldRow, inputClass } from '@/components/admin/form-shell';
import { FieldHeuristicFlag } from '../../field-heuristic-flag';
import { checkField } from '@/lib/admin/field-heuristics';
import { PRICE_TYPES } from '../helpers';
import type { SectionBaseProps } from './types';

export function MoneyLinksSection({
  formState,
  setFormState,
  resetStatus,
  heuristicEvent,
}: SectionBaseProps) {
  const showPriceFields = formState.price_type !== 'free' && formState.price_type !== 'varies';

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <FieldRow
          label="Price type"
          htmlFor="price_type"
          labelRight={<FieldHeuristicFlag flag={checkField(heuristicEvent, 'price')} />}
        >
          <div className="relative">
            <select
              id="price_type"
              name="price_type"
              value={formState.price_type}
              onChange={(e) => {
                setFormState((p) => ({ ...p, price_type: e.target.value }));
                resetStatus();
              }}
              className={`${inputClass} appearance-none pr-10`}
            >
              {PRICE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc pointer-events-none" />
          </div>
        </FieldRow>

        {showPriceFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldRow
              label={formState.price_type === 'range' ? 'Min price ($)' : 'Price ($)'}
              htmlFor="price_low"
            >
              <input
                type="number"
                id="price_low"
                name="price_low"
                value={formState.price_low}
                onChange={(e) => {
                  setFormState((p) => ({ ...p, price_low: e.target.value }));
                  resetStatus();
                }}
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="0.00"
              />
            </FieldRow>
            {formState.price_type === 'range' && (
              <FieldRow label="Max price ($)" htmlFor="price_high">
                <input
                  type="number"
                  id="price_high"
                  name="price_high"
                  value={formState.price_high}
                  onChange={(e) => {
                    setFormState((p) => ({ ...p, price_high: e.target.value }));
                    resetStatus();
                  }}
                  min="0"
                  step="0.01"
                  className={inputClass}
                  placeholder="0.00"
                />
              </FieldRow>
            )}
          </div>
        )}
      </div>

      <FieldRow label="Ticket URL" htmlFor="ticket_url" hint="(optional)">
        <input
          type="url"
          id="ticket_url"
          name="ticket_url"
          value={formState.ticket_url}
          onChange={(e) => {
            setFormState((p) => ({ ...p, ticket_url: e.target.value }));
            resetStatus();
          }}
          className={inputClass}
          placeholder="https://…"
        />
      </FieldRow>

      <div className="rounded-lg border border-mist/60 bg-cloud/40 p-3">
        <p className="text-sm font-medium text-ink mb-3">
          External links <span className="text-zinc font-normal">(optional)</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ExternalLinkField
            id="website_url"
            label="Event website"
            value={formState.website_url}
            placeholder="https://myevent.com"
            onChange={(v) => {
              setFormState((p) => ({ ...p, website_url: v }));
              resetStatus();
            }}
          />
          <ExternalLinkField
            id="registration_url"
            label="Registration / RSVP"
            value={formState.registration_url}
            placeholder="https://rsvp.example.com"
            onChange={(v) => {
              setFormState((p) => ({ ...p, registration_url: v }));
              resetStatus();
            }}
          />
          <ExternalLinkField
            id="instagram_url"
            label="Instagram"
            value={formState.instagram_url}
            placeholder="https://instagram.com/event"
            onChange={(v) => {
              setFormState((p) => ({ ...p, instagram_url: v }));
              resetStatus();
            }}
          />
          <ExternalLinkField
            id="facebook_url"
            label="Facebook event"
            value={formState.facebook_url}
            placeholder="https://facebook.com/events/123"
            onChange={(v) => {
              setFormState((p) => ({ ...p, facebook_url: v }));
              resetStatus();
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface ExternalLinkFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (next: string) => void;
}

function ExternalLinkField({ id, label, value, placeholder, onChange }: ExternalLinkFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-zinc mb-1">
        {label}
      </label>
      <input
        type="url"
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={placeholder}
      />
    </div>
  );
}
