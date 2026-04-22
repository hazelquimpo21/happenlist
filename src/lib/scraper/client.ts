/**
 * SCRAPER CLIENT
 * ==============
 * Server-only client for the Render-hosted happenlist_scraper backend.
 *
 * NEVER import this from a client component — it carries SCRAPER_API_SECRET.
 * All callers are server-side (route handlers, server actions, server components).
 *
 * Coupling notes:
 * - Auth header `X-API-Secret` matches the scraper's middleware in
 *   happenlist_scraper/backend/index.js.
 * - Endpoints and response shapes are mirrored in ./types.ts. If you change a
 *   scraper endpoint, update both files.
 *
 * @module lib/scraper/client
 */

import 'server-only';
import type {
  ScraperAnalyzeResponse,
  ScraperRecurrenceResponse,
  ScraperRecheckResponse,
  ScraperSoldOutResponse,
  ScraperEvent,
} from './types';

// ============================================================================
// CONFIG
// ============================================================================

const SCRAPER_API_URL = process.env.SCRAPER_API_URL?.replace(/\/$/, '') || '';
const SCRAPER_API_SECRET = process.env.SCRAPER_API_SECRET || '';
const DEFAULT_TIMEOUT_MS = 60_000; // analyze can take 20-45s for LLM extraction

// ============================================================================
// ERRORS
// ============================================================================

export class ScraperClientError extends Error {
  readonly status: number;
  readonly endpoint: string;

  constructor(message: string, opts: { status?: number; endpoint: string }) {
    super(message);
    this.name = 'ScraperClientError';
    this.status = opts.status ?? 0;
    this.endpoint = opts.endpoint;
  }
}

// ============================================================================
// CORE REQUEST
// ============================================================================

function requireConfig() {
  if (!SCRAPER_API_URL) {
    throw new ScraperClientError(
      'SCRAPER_API_URL is not configured. Set it to the Render backend URL.',
      { endpoint: '(config)' }
    );
  }
  if (!SCRAPER_API_SECRET) {
    throw new ScraperClientError(
      'SCRAPER_API_SECRET is not configured.',
      { endpoint: '(config)' }
    );
  }
}

/**
 * Low-level POST. Used by all typed helpers below.
 * Throws ScraperClientError on any non-2xx or network/timeout failure.
 */
async function post<T>(
  endpoint: string,
  body: Record<string, unknown>,
  opts?: { timeoutMs?: number }
): Promise<T> {
  requireConfig();

  const url = `${SCRAPER_API_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  console.log(`[scraper:client] POST ${endpoint}`);
  const started = Date.now();

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Secret': SCRAPER_API_SECRET,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes('aborted') || msg.includes('timeout');
    console.error(`[scraper:client] ${endpoint} ${isTimeout ? 'timed out' : 'network error'}: ${msg}`);
    throw new ScraperClientError(
      isTimeout ? `Scraper request timed out after ${timeoutMs}ms` : `Network error: ${msg}`,
      { endpoint }
    );
  } finally {
    clearTimeout(timer);
  }

  const duration = Date.now() - started;

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = (body && typeof body === 'object' && 'error' in body)
        ? String(body.error)
        : JSON.stringify(body);
    } catch {
      detail = await response.text().catch(() => response.statusText);
    }
    console.error(`[scraper:client] ${endpoint} failed ${response.status} in ${duration}ms: ${detail}`);
    throw new ScraperClientError(
      `Scraper returned ${response.status}: ${detail || response.statusText}`,
      { status: response.status, endpoint }
    );
  }

  console.log(`[scraper:client] ${endpoint} ok in ${duration}ms`);
  return response.json() as Promise<T>;
}

// ============================================================================
// TYPED HELPERS
// ============================================================================

/**
 * Analyze a pasted block of event text (optionally with a source URL for context).
 * Returns a single event OR multiple events depending on what the text describes.
 */
export function analyzeText(args: {
  text: string;
  hint?: string;
  sourceUrl?: string;
}): Promise<ScraperAnalyzeResponse> {
  return post<ScraperAnalyzeResponse>('/analyze/text', {
    text: args.text,
    hint: args.hint,
    sourceUrl: args.sourceUrl,
  });
}

/**
 * Analyze an event page by URL. The scraper fetches the page server-side, pulls
 * a body snippet, and runs the text extraction pipeline on it.
 *
 * Requires the scraper's /analyze/url endpoint (added alongside this client).
 */
export function analyzeUrl(args: {
  url: string;
  hint?: string;
}): Promise<ScraperAnalyzeResponse> {
  return post<ScraperAnalyzeResponse>('/analyze/url', {
    url: args.url,
    hint: args.hint,
  });
}

/**
 * Re-scrape an event we previously imported. Returns the new analyzed payload
 * plus a field-level diff against the passed-in `currentEvent` snapshot.
 *
 * Requires the scraper's /recheck endpoint (Phase 2).
 */
export function recheckEvent(args: {
  sourceUrl: string;
  currentEvent: Partial<ScraperEvent>;
}): Promise<ScraperRecheckResponse> {
  return post<ScraperRecheckResponse>('/recheck', {
    sourceUrl: args.sourceUrl,
    currentEvent: args.currentEvent,
  });
}

/**
 * Parse a plain-English recurrence description into a structured rule.
 * e.g. "every other Tuesday at 7pm starting May 3" → { frequency: 'biweekly', ... }
 *
 * Requires the scraper's /parse/recurrence endpoint (Phase 3).
 */
export function parseRecurrence(args: {
  description: string;
  startDate?: string;
  defaultTime?: string;
}): Promise<ScraperRecurrenceResponse> {
  return post<ScraperRecurrenceResponse>('/parse/recurrence', {
    description: args.description,
    startDate: args.startDate,
    defaultTime: args.defaultTime,
  });
}

/**
 * Lightweight ticket-page check: is this event sold out, and has pricing drifted?
 * Cheaper than a full recheck — targets only the ticket URL.
 *
 * Requires the scraper's /check-sold-out endpoint (Phase 4).
 */
export function checkSoldOut(args: {
  ticketUrl: string;
  sourceUrl?: string;
}): Promise<ScraperSoldOutResponse> {
  return post<ScraperSoldOutResponse>(
    '/check-sold-out',
    {
      ticketUrl: args.ticketUrl,
      sourceUrl: args.sourceUrl,
    },
    { timeoutMs: 30_000 }
  );
}

/**
 * Quick health probe. Handy for admin UIs that want to show a status dot.
 * Uses GET /health which is unauthenticated on the scraper side.
 */
export async function scraperHealth(): Promise<{ ok: boolean; message?: string }> {
  if (!SCRAPER_API_URL) return { ok: false, message: 'SCRAPER_API_URL not set' };
  try {
    const r = await fetch(`${SCRAPER_API_URL}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    return { ok: r.ok };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}
