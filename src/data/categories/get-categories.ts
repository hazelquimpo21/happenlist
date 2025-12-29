/**
 * GET CATEGORIES
 * ==============
 * Fetches event categories.
 */

import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/types';

/**
 * Fetches all active categories.
 *
 * @example
 * const categories = await getCategories();
 */
export async function getCategories(): Promise<Category[]> {
  console.log('📂 [getCategories] Fetching categories');

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ [getCategories] Error:', error);
    throw error;
  }

  console.log(`✅ [getCategories] Found ${data?.length || 0} categories`);

  return data || [];
}

/**
 * Fetches a single category by slug.
 *
 * @example
 * const category = await getCategoryBySlug('music');
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  console.log('📂 [getCategoryBySlug] Fetching category:', slug);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️ [getCategoryBySlug] Category not found');
      return null;
    }
    console.error('❌ [getCategoryBySlug] Error:', error);
    throw error;
  }

  console.log('✅ [getCategoryBySlug] Found category:', (data as Category)?.name);

  return data as Category;
}
