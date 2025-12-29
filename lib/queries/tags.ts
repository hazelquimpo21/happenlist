// ============================================================================
// 🔖 HAPPENLIST - Tag Queries
// ============================================================================
// Database query functions for fetching tags.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { Tag } from '@/types'

// ============================================================================
// 🔖 Get All Tags
// ============================================================================

/**
 * Fetches all tags ordered alphabetically.
 *
 * @example
 * const tags = await getTags()
 */
export async function getTags(): Promise<Tag[]> {
  logger.debug('🔖 Fetching tags')

  const supabase = createClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    logger.error('❌ Failed to fetch tags', { error })
    throw new Error(`Failed to fetch tags: ${error.message}`)
  }

  logger.info(`✅ Fetched ${data?.length ?? 0} tags`)
  return data ?? []
}

// ============================================================================
// 🔖 Get Tag by Slug
// ============================================================================

/**
 * Fetches a single tag by its URL slug.
 *
 * @example
 * const tag = await getTagBySlug('free')
 */
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  logger.debug('🔖 Fetching tag by slug', { slug })

  const supabase = createClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      logger.debug('🔖 Tag not found', { slug })
      return null
    }
    logger.error('❌ Failed to fetch tag', { slug, error })
    throw new Error(`Failed to fetch tag: ${error.message}`)
  }

  logger.info('✅ Fetched tag', { slug })
  return data
}
