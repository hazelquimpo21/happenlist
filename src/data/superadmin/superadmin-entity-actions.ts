/**
 * SUPERADMIN ENTITY ACTIONS
 * =========================
 * Server-side actions for superadmin editing of organizers, venues, and series.
 *
 * @module data/superadmin/superadmin-entity-actions
 */

import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/auth';
import { superadminLogger } from '@/lib/utils/logger';
import type { SuperadminActionResult } from './superadmin-event-actions';

// ============================================================================
// TYPES
// ============================================================================

export interface EditEntityParams {
  entityId: string;
  entityType: 'organizer' | 'venue' | 'series';
  adminEmail: string;
  updates: Record<string, unknown>;
  notes?: string;
}

// Table name mapping
const TABLE_MAP = {
  organizer: 'organizers',
  venue: 'locations',
  series: 'series',
} as const;

// ============================================================================
// EDIT ENTITY
// ============================================================================

/**
 * Edit any organizer, venue, or series as superadmin.
 */
export async function superadminEditEntity(
  params: EditEntityParams
): Promise<SuperadminActionResult> {
  const { entityId, entityType, adminEmail, updates, notes } = params;
  const timestamp = new Date().toISOString();
  const tableName = TABLE_MAP[entityType];

  // Verify superadmin status
  try {
    requireSuperAdmin(adminEmail);
  } catch {
    return {
      success: false,
      message: 'Unauthorized: Superadmin access required',
      error: 'Not a superadmin',
      timestamp,
    };
  }

  const timer = superadminLogger.time(`superadminEdit_${entityType}`, {
    action: 'superadmin_edit',
    entityType,
    entityId,
    adminEmail,
  });

  try {
    const supabase = await createClient();

    // Fetch current entity for audit log
    const { data: currentEntity, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', entityId)
      .single();

    if (fetchError || !currentEntity) {
      timer.error(`${entityType} not found`, fetchError);
      return {
        success: false,
        message: `${entityType} not found`,
        error: fetchError?.message || `${entityType} does not exist`,
        timestamp,
      };
    }

    // Build changes object for audit log
    const changes: Record<string, { before: unknown; after: unknown }> = {};
    for (const [key, value] of Object.entries(updates)) {
      if ((currentEntity as Record<string, unknown>)[key] !== value) {
        changes[key] = {
          before: (currentEntity as Record<string, unknown>)[key],
          after: value,
        };
      }
    }

    if (Object.keys(changes).length === 0) {
      return {
        success: true,
        message: 'No changes to save',
        eventId: entityId,
        timestamp,
      };
    }

    // Update the entity
    const updateData = {
      ...updates,
      updated_at: timestamp,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from(tableName)
      .update(updateData)
      .eq('id', entityId);

    if (updateError) {
      timer.error(`Failed to update ${entityType}`, updateError);
      return {
        success: false,
        message: `Failed to update ${entityType}`,
        error: updateError.message,
        timestamp,
      };
    }

    // Log to audit trail
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'superadmin_edit',
        entity_type: entityType,
        entity_id: entityId,
        admin_email: adminEmail,
        changes: {
          fields_changed: Object.keys(changes),
          details: changes,
        },
        notes: notes || `Superadmin edit: ${Object.keys(changes).join(', ')}`,
      });
    } catch (auditError) {
      superadminLogger.warn('Failed to log audit entry', { metadata: { error: auditError } });
    }

    timer.success(`${entityType} edited successfully`);

    return {
      success: true,
      message: `${entityType} updated successfully`,
      eventId: entityId,
      timestamp,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      message: `Failed to update ${entityType}`,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    };
  }
}
