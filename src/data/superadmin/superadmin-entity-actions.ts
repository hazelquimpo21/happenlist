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
import { ADMIN_ENTITIES, type AdminEntityKind } from '@/lib/constants/admin-entities';
import type { SuperadminActionResult } from './superadmin-event-actions';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Entity types this module can edit.
 *
 * Superset of {@link AdminEntityKind} because 'series' is managed through
 * superadminEditEntity/superadminDeleteEntity but lives in a different admin
 * surface (has its own list + merge/bulk-delete UI, not in the Directory).
 */
export type SuperadminEntityType = AdminEntityKind | 'series';

export interface EditEntityParams {
  entityId: string;
  entityType: SuperadminEntityType;
  adminEmail: string;
  updates: Record<string, unknown>;
  notes?: string;
}

export interface DeleteEntityParams {
  entityId: string;
  entityType: SuperadminEntityType;
  adminEmail: string;
  reason: string;
}

export interface CreateEntityParams {
  entityType: AdminEntityKind; // create flow is scoped to the four Directory entities
  adminEmail: string;
  values: Record<string, unknown>;
  notes?: string;
}

// Table name mapping. Venues live in the `locations` table — see
// ADMIN_ENTITIES for the UI ↔ DB mapping rationale.
const TABLE_MAP: Record<SuperadminEntityType, string> = {
  organizer: ADMIN_ENTITIES.organizer.tableName,
  venue: ADMIN_ENTITIES.venue.tableName,
  performer: ADMIN_ENTITIES.performer.tableName,
  membership_org: ADMIN_ENTITIES.membership_org.tableName,
  series: 'series',
};

// Entities whose soft-delete flips is_active=false (vs. series which uses status=cancelled).
const SOFT_DELETE_ENTITIES = new Set<SuperadminEntityType>([
  'organizer',
  'venue',
  'performer',
  'membership_org',
]);

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

    // Fetch current entity for audit log.
    // `tableName` is a dynamic string (five entity kinds) — the Supabase generic
    // client types are too strict for this dispatch, so cast once here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentEntity, error: fetchError } = await (supabase as any)
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

    // Fetch current entity for audit. Dynamic tableName — see edit handler.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentEntity, error: fetchError } = await (supabase as any)
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

// ============================================================================
// CREATE ENTITY
// ============================================================================

/**
 * Create a new Directory entity (organizer / venue / performer / membership_org).
 *
 * Returns the inserted row's `id` and `slug` so the caller can redirect to
 * the edit page. Maps Postgres 23505 (unique_violation) onto a friendly
 * "slug already taken" message — all four tables have a UNIQUE constraint on
 * `slug` (see `organizers`, `locations`, `performers`, `membership_organizations`).
 */
export async function superadminCreateEntity(
  params: CreateEntityParams
): Promise<SuperadminActionResult & { slug?: string }> {
  const { entityType, adminEmail, values, notes } = params;
  const timestamp = new Date().toISOString();
  const tableName = TABLE_MAP[entityType];

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

  const timer = superadminLogger.time(`superadminCreate_${entityType}`, {
    action: 'superadmin_create',
    entityType,
    adminEmail,
  });

  try {
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from(tableName)
      .insert({
        ...values,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .select('id, slug')
      .single();

    if (error) {
      // 23505 = Postgres unique_violation. Slug or name collision.
      const isDuplicate = error.code === '23505';
      timer.error(
        isDuplicate ? `${entityType} slug already exists` : `Failed to create ${entityType}`,
        error
      );
      return {
        success: false,
        message: isDuplicate
          ? 'A record with this slug already exists — choose a different name.'
          : `Failed to create ${entityType}`,
        error: error.message,
        timestamp,
      };
    }

    // Log to audit trail
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'superadmin_create',
        entity_type: entityType,
        entity_id: data.id,
        admin_email: adminEmail,
        changes: { entity_name: values.name || values.title || data.id, fields: Object.keys(values) },
        notes: notes || `Created ${entityType}`,
      });
    } catch (auditError) {
      superadminLogger.warn('Failed to log audit entry', { metadata: { error: auditError } });
    }

    timer.success(`${entityType} created successfully`, {
      entityId: data.id,
      metadata: { slug: data.slug },
    });

    return {
      success: true,
      message: `${entityType} created successfully`,
      eventId: data.id,
      slug: data.slug,
      timestamp,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      message: `Failed to create ${entityType}`,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    };
  }
}
