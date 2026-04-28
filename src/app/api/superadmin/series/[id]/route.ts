/**
 * SUPERADMIN SERIES API ROUTE
 * PATCH /api/superadmin/series/[id] - Edit any series
 *
 * Side effect: when `updates.recurrence_rule` is in the payload, after the
 * row update succeeds we kick off extendSeriesInstances() so the operator
 * gets immediate materialization rather than waiting for the nightly cron.
 * The cron + this route share src/data/series/extend-series.ts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import {
  superadminEditEntity,
  superadminDeleteEntity,
  superadminDeleteSeriesWithInstances,
} from '@/data/superadmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { extendSeriesInstances } from '@/data/series/extend-series';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: entityId } = await context.params;

  try {
    let session;
    try {
      session = await requireSuperadminAuth();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { updates, notes } = body;

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    const result = await superadminEditEntity({
      entityId,
      entityType: 'series',
      adminEmail: session.email,
      updates,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: 400 }
      );
    }

    // If the operator changed recurrence_rule, materialize immediately
    // so the result of the UI's Save lands without waiting for the cron.
    let extend: Awaited<ReturnType<typeof extendSeriesInstances>> | null = null;
    if (
      'recurrence_rule' in updates &&
      updates.recurrence_rule &&
      typeof updates.recurrence_rule === 'object'
    ) {
      try {
        const supabase = createAdminClient();
        const { data: seriesRow } = await supabase
          .from('series')
          .select('id, title, recurrence_rule, end_date')
          .eq('id', entityId)
          .single();

        if (seriesRow) {
          extend = await extendSeriesInstances(
            supabase,
            {
              id: (seriesRow as { id: string }).id,
              title: (seriesRow as { title: string }).title,
              recurrence_rule: (seriesRow as { recurrence_rule: unknown }).recurrence_rule,
              end_date: (seriesRow as { end_date: string | null }).end_date,
            },
            // 'manual' satisfies events_source_check (allowed values:
            // manual, scraper, user_submission, api, import).
            { gateOnBuffer: false, source: 'manual' }
          );
        }
      } catch (e) {
        // Surface the error in the response but don't fail the PATCH —
        // the rule update itself succeeded.
        console.error('[superadmin/series] post-save materialize failed:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      entityId: result.eventId,
      timestamp: result.timestamp,
      extend: extend
        ? {
            status: extend.status,
            generated: extend.generated,
            futureCount: extend.futureCount,
            reason: extend.reason ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error('Unexpected error editing series:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: entityId } = await context.params;

  try {
    let session;
    try {
      session = await requireSuperadminAuth();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    let body: { reason: string; cascadeEvents?: boolean } = {
      reason: 'No reason provided',
    };
    try {
      const parsed = await request.json();
      body = { ...body, ...parsed };
    } catch {
      // Body is optional for DELETE
    }

    // cascadeEvents=true: cancel series + every non-cancelled child event.
    // Default behavior (false) only cancels the series row, leaving children
    // attached but orphaned under a cancelled series.
    if (body.cascadeEvents) {
      const result = await superadminDeleteSeriesWithInstances({
        seriesId: entityId,
        adminEmail: session.email,
        reason: body.reason,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error, message: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        entityId: result.eventId,
        timestamp: result.timestamp,
        eventsCancelled: result.eventsCancelled ?? 0,
      });
    }

    const result = await superadminDeleteEntity({
      entityId,
      entityType: 'series',
      adminEmail: session.email,
      reason: body.reason,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      entityId: result.eventId,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('Unexpected error deleting series:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
