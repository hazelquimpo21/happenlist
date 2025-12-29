// ============================================================================
// 🏷️ HAPPENLIST - Category Queries
// ============================================================================
// Database query functions for fetching categories.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { Category, CategoryWithCount } from '@/types'

// ============================================================================
// 🏷️ Get All Categories
// ============================================================================

/**
 * Fetches all categories ordered by sort_order.
 *
 * @example
 * const categories = await getCategories()
 */
export async function getCategories(): Promise<Category[]> {
  logger.debug('🏷️ Fetching categories')

  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    logger.error('❌ Failed to fetch categories', { error })
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  logger.info(`✅ Fetched ${data?.length ?? 0} categories`)
  return data ?? []
}

// ============================================================================
// 🏷️ Get Categories with Event Counts
// ============================================================================

/**
 * Fetches all categories with the count of upcoming events in each.
 *
 * @example
 * const categories = await getCategoriesWithCounts()
 * // => [{ id: '...', name: 'Music', event_count: 15 }, ...]
 */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  logger.debug('🏷️ Fetching categories with counts')

  const supabase = createClient()

  // First, get all categories
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    logger.error('❌ Failed to fetch categories', { error })
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  if (!categories || categories.length === 0) {
    return []
  }

  // Get counts for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('status', 'published')
        .gte('start_at', new Date().toISOString())

      return {
        ...category,
        event_count: count ?? 0,
      }
    })
  )

  logger.info(`✅ Fetched ${categoriesWithCounts.length} categories with counts`)
  return categoriesWithCounts
}

// ============================================================================
// 🏷️ Get Category by Slug
// ============================================================================

/**
 * Fetches a single category by its URL slug.
 *
 * @example
 * const category = await getCategoryBySlug('music')
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  logger.debug('🏷️ Fetching category by slug', { slug })

  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      logger.debug('🏷️ Category not found', { slug })
      return null
    }
    logger.error('❌ Failed to fetch category', { slug, error })
    throw new Error(`Failed to fetch category: ${error.message}`)
  }

  logger.info('✅ Fetched category', { slug })
  return data
}
