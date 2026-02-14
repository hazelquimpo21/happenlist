/**
 * SUPERADMIN ENTITY ACTIONS
 * =========================
 * Server-side actions for superadmin editing of organizers, venues, and series.
 *
 * Uses service role key to bypass RLS - these tables may not have
 * update/delete policies for regular users.
 *
 * @module data/superadmin/superadmin-entity-actions
 */

import { createAdminClient } from '@/lib/supabase/admin';
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

export interface DeleteEntityParams {
  entityId: string;
  entityType: 'organizer' | 'venue' | 'series';
  adminEmail: string;
  reason: string;
}

// Table name mapping
const TABLE_MAP = {
  organizer: 'organizers',
  venue: 'locations',
  series: 'series',
} as const;

// Fields that support soft-delete via is_active
const SOFT_DELETE_ENTITIES = new Set(['organizer', 'venue']);

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
    // Use admin client to bypass RLS
    const supabase = createAdminClient();

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

// ============================================================================
// DELETE ENTITY
// ============================================================================

/**
 * Delete an organizer, venue, or series as superadmin.
 *
 * For organizers and venues: soft-deletes by setting is_active = false.
 * For series: sets status to 'cancelled'.
 */
export async function superadminDeleteEntity(
  params: DeleteEntityParams
): Promise<SuperadminActionResult> {
  const { entityId, entityType, adminEmail, reason } = params;
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

  const timer = superadminLogger.time(`superadminDelete_${entityType}`, {
    action: 'superadmin_soft_delete',
    entityType,
    entityId,
    adminEmail,
  });

  try {
    const supabase = createAdminClient();

    // Fetch current entity for audit
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

    // Soft-delete: set is_active=false for organizers/venues, status=cancelled for series
    const updateData = SOFT_DELETE_ENTITIES.has(entityType)
      ? { is_active: false, updated_at: timestamp }
      : { status: 'cancelled', updated_at: timestamp };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from(tableName)
      .update(updateData)
      .eq('id', entityId);

    if (updateError) {
      timer.error(`Failed to delete ${entityType}`, updateError);
      return {
        success: false,
        message: `Failed to delete ${entityType}`,
        error: updateError.message,
        timestamp,
      };
    }

    // Log to audit trail
    try {
      const entityName = (currentEntity as Record<string, unknown>).name ||
        (currentEntity as Record<string, unknown>).title || entityId;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'superadmin_soft_delete',
        entity_type: entityType,
        entity_id: entityId,
        admin_email: adminEmail,
        changes: {
          entity_name: entityName,
          delete_type: 'soft',
        },
        notes: reason || `Deleted ${entityType}`,
      });
    } catch (auditError) {
      superadminLogger.warn('Failed to log audit entry', { metadata: { error: auditError } });
    }

    timer.success(`${entityType} deleted (soft) successfully`);

    return {
      success: true,
      message: `${entityType} deleted successfully`,
      eventId: entityId,
      timestamp,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      message: `Failed to delete ${entityType}`,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    };
  }
}
