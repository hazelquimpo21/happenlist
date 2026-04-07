/**
 * OPENAI AI UTILITIES
 * ====================
 * AI-assisted event operations for superadmin workflows.
 *
 * Functions:
 *   - mergeEventFields: picks the best field values from multiple events
 *   - detectRecurrencePattern: identifies a recurrence pattern from event dates
 *
 * @module lib/ai/openai
 */

import OpenAI from 'openai';
import type { RecurrenceRule } from '@/lib/supabase/types';

// Lazy-init so the module can be imported without OPENAI_API_KEY set at build time
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

const MODEL = 'gpt-4o-mini';

// ============================================================================
// TYPES
// ============================================================================

/** Minimal event shape sent to AI for merging */
export interface EventForMerge {
  id: string;
  title: string | null;
  description: string | null;
  short_description: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  instance_date: string | null;
  category_id: string | null;
  category_name?: string | null;
  location_id: string | null;
  location_name?: string | null;
  organizer_id: string | null;
  organizer_name?: string | null;
  price_type: string | null;
  price_low: number | null;
  price_high: number | null;
  price_details: string | null;
  ticket_url: string | null;
  website_url: string | null;
  registration_url: string | null;
  image_url: string | null;
  source: string | null;
  source_url: string | null;
}

/** Fields the AI suggests for the merged event */
export interface MergedEventSuggestion {
  title: string;
  description: string | null;
  short_description: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  category_id: string | null;
  location_id: string | null;
  organizer_id: string | null;
  price_type: string | null;
  price_low: number | null;
  price_high: number | null;
  price_details: string | null;
  ticket_url: string | null;
  website_url: string | null;
  registration_url: string | null;
  image_url: string | null;
  /** Which event ID the AI recommends keeping as primary */
  recommended_primary_id: string;
  /** Short explanation of merge decisions */
  reasoning: string;
}

/** Minimal event shape for pattern detection */
export interface EventForPatternDetect {
  id: string;
  title: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  instance_date: string | null;
  location_name?: string | null;
}

/** AI-detected recurrence pattern */
export interface DetectedPattern {
  recurrence_rule: RecurrenceRule;
  suggested_series_title: string;
  suggested_series_type: 'recurring' | 'class' | 'camp' | 'workshop';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

// ============================================================================
// MERGE EVENT FIELDS
// ============================================================================

/**
 * Uses GPT-4o-mini to analyze multiple events and suggest the best merged
 * field values. Picks the most complete/accurate data from each event.
 */
export async function mergeEventFields(
  events: EventForMerge[]
): Promise<MergedEventSuggestion> {
  const client = getClient();

  const eventsDescription = events.map((e, i) => `
Event ${i + 1} (ID: ${e.id}):
  Title: ${e.title || '(none)'}
  Description: ${e.description || '(none)'}
  Short Description: ${e.short_description || '(none)'}
  Date: ${e.start_datetime || '(none)'} to ${e.end_datetime || '(none)'}
  Instance Date: ${e.instance_date || '(none)'}
  Category: ${e.category_name || e.category_id || '(none)'}
  Location: ${e.location_name || e.location_id || '(none)'}
  Organizer: ${e.organizer_name || e.organizer_id || '(none)'}
  Price: ${e.price_type || '(none)'} ${e.price_low != null ? `$${e.price_low}` : ''}${e.price_high != null ? `-$${e.price_high}` : ''}
  Price Details: ${e.price_details || '(none)'}
  Ticket URL: ${e.ticket_url || '(none)'}
  Website: ${e.website_url || '(none)'}
  Registration: ${e.registration_url || '(none)'}
  Image: ${e.image_url ? 'yes' : 'no'}
  Source: ${e.source || '(none)'} ${e.source_url || ''}
`).join('\n');

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a data quality assistant for an events directory. You're merging duplicate event listings into one clean record.

Rules:
- Pick the most complete/accurate value for each field
- Prefer longer, more detailed descriptions over short ones
- If descriptions differ significantly, merge them intelligently
- For dates: pick the most specific/correct date
- For prices: pick the most detailed/accurate pricing
- For URLs: prefer working, specific URLs over generic ones
- For location/category/organizer IDs: pick the one that appears most often, or the most specific one
- For images: prefer events that have images
- Recommend the event with the most complete data as the primary (the one to keep)

Return a JSON object with these exact fields:
{
  "title": "best title",
  "description": "best/merged description or null",
  "short_description": "best short description or null",
  "start_datetime": "best datetime or null",
  "end_datetime": "best end datetime or null",
  "category_id": "best category_id or null",
  "location_id": "best location_id or null",
  "organizer_id": "best organizer_id or null",
  "price_type": "best price_type or null",
  "price_low": number or null,
  "price_high": number or null,
  "price_details": "best price details or null",
  "ticket_url": "best ticket url or null",
  "website_url": "best website url or null",
  "registration_url": "best registration url or null",
  "image_url": "best image url or null",
  "recommended_primary_id": "id of event to keep",
  "reasoning": "1-2 sentence explanation of key merge decisions"
}`
      },
      {
        role: 'user',
        content: `Merge these ${events.length} duplicate events into one:\n${eventsDescription}`
      }
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from AI merge');
  }

  return JSON.parse(content) as MergedEventSuggestion;
}

// ============================================================================
// DETECT RECURRENCE PATTERN
// ============================================================================

/**
 * Uses GPT-4o-mini to analyze event dates/times and detect a recurrence pattern.
 * Returns a RecurrenceRule suggestion or null if no pattern found.
 */
export async function detectRecurrencePattern(
  events: EventForPatternDetect[]
): Promise<DetectedPattern | null> {
  const client = getClient();

  // Sort events by date for the AI
  const sorted = [...events].sort((a, b) =>
    (a.start_datetime || '').localeCompare(b.start_datetime || '')
  );

  const eventsDescription = sorted.map((e, i) => {
    const date = e.start_datetime ? new Date(e.start_datetime) : null;
    const dayName = date ? date.toLocaleDateString('en-US', { weekday: 'long' }) : '?';
    const time = e.start_datetime?.split('T')[1]?.substring(0, 5) || '?';
    return `  ${i + 1}. "${e.title}" — ${e.instance_date || '?'} (${dayName}) at ${time}${e.location_name ? ` @ ${e.location_name}` : ''}`;
  }).join('\n');

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You analyze event dates to detect recurrence patterns for a local events directory.

Given a list of events with dates and times, determine if they follow a recurring pattern.

Day-of-week numbers: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

Return a JSON object:
{
  "found_pattern": true/false,
  "recurrence_rule": {
    "frequency": "daily" | "weekly" | "biweekly" | "monthly",
    "interval": 1,
    "days_of_week": [numbers],
    "time": "HH:MM",
    "duration_minutes": number,
    "end_type": "never"
  },
  "suggested_series_title": "clean series title",
  "suggested_series_type": "recurring" | "class" | "camp" | "workshop",
  "confidence": "high" | "medium" | "low",
  "reasoning": "1-2 sentence explanation"
}

If no clear pattern: { "found_pattern": false, "reasoning": "explanation" }

Tips:
- "recurring" is the most common type for regular weekly/biweekly events
- "class" if titles suggest educational content
- "camp" if titles suggest multi-day consecutive programs
- "workshop" if titles suggest one-off learning sessions
- Look at time gaps between events to determine frequency
- If all events are on the same weekday, it's likely weekly
- Duration: calculate from start_datetime to end_datetime if both available, otherwise estimate 120 min`
      },
      {
        role: 'user',
        content: `Detect recurrence pattern in these ${sorted.length} events:\n${eventsDescription}`
      }
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content);

  if (!parsed.found_pattern) return null;

  return {
    recurrence_rule: parsed.recurrence_rule as RecurrenceRule,
    suggested_series_title: parsed.suggested_series_title,
    suggested_series_type: parsed.suggested_series_type,
    confidence: parsed.confidence,
    reasoning: parsed.reasoning,
  };
}
