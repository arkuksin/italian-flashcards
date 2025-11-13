import { supabase } from '../lib/supabase'
import type { CategoryInfo, CategoryPreference, Word } from '../types'

export class CategoryService {
  private static instance: CategoryService

  private constructor() {}

  static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService()
    }
    return CategoryService.instance
  }

  /**
   * Get all unique categories from words table
   */
  async getAllCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('category')
        .order('category')

      if (error) throw error

      // Get unique categories
      const categories = [...new Set(data?.map(w => w.category).filter(Boolean) || [])]
      return categories.sort()
    } catch (error) {
      console.error('Error loading categories:', error)
      throw new Error('Failed to load categories')
    }
  }

  /**
   * Get category statistics including word counts and accuracy
   */
  async getCategoryStatistics(): Promise<CategoryInfo[]> {
    try {
      const { data, error } = await supabase
        .from('v_category_statistics')
        .select('*')
        .order('category')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading category statistics:', error)
      throw new Error('Failed to load category statistics')
    }
  }

  /**
   * Get user's category preferences
   */
  async getUserCategoryPreferences(userId: string): Promise<CategoryPreference[]> {
    try {
      const { data, error } = await supabase
        .from('user_category_preferences')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading user category preferences:', error)
      throw new Error('Failed to load category preferences')
    }
  }

  /**
   * Update a single category preference
   */
  async updateCategoryPreference(
    userId: string,
    category: string,
    isSelected: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_category_preferences')
        .upsert({
          user_id: userId,
          category,
          is_selected: isSelected
        }, {
          onConflict: 'user_id,category'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating category preference:', error)
      throw new Error('Failed to update category preference')
    }
  }

  /**
   * Bulk update category preferences
   */
  async bulkUpdatePreferences(
    userId: string,
    selections: Record<string, boolean>
  ): Promise<void> {
    try {
      const updates = Object.entries(selections).map(([category, isSelected]) => ({
        user_id: userId,
        category,
        is_selected: isSelected
      }))

      const { error } = await supabase
        .from('user_category_preferences')
        .upsert(updates, {
          onConflict: 'user_id,category'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error bulk updating preferences:', error)
      throw new Error('Failed to update category preferences')
    }
  }

  /**
   * Get selected categories for a user
   * Returns all categories if no preferences are saved
   */
  async getSelectedCategories(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_category_preferences')
        .select('category')
        .eq('user_id', userId)
        .eq('is_selected', true)

      if (error) throw error

      // If no preferences saved, return all categories
      if (!data || data.length === 0) {
        return await this.getAllCategories()
      }

      return data.map(d => d.category)
    } catch (error) {
      console.error('Error getting selected categories:', error)
      throw new Error('Failed to get selected categories')
    }
  }

  /**
   * Get words filtered by categories using database function
   */
  async getWordsByCategories(
    userId: string,
    categories: string[]
  ): Promise<Word[]> {
    try {
      const { data, error } = await supabase.rpc('get_words_by_categories', {
        p_user_id: userId,
        p_categories: categories
      })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting words by categories:', error)
      throw new Error('Failed to load words for selected categories')
    }
  }

  /**
   * Get suggested category based on lowest accuracy
   */
  async getSuggestedCategory(): Promise<string | null> {
    try {
      const stats = await this.getCategoryStatistics()

      // Filter categories with learned words and sort by accuracy
      const sorted = stats
        .filter(s => s.learned_words > 0 && s.avg_accuracy !== null)
        .sort((a, b) => (a.avg_accuracy || 0) - (b.avg_accuracy || 0))

      return sorted[0]?.category || null
    } catch (error) {
      console.error('Error getting suggested category:', error)
      return null
    }
  }

  /**
   * Update last practiced timestamp for a category
   */
  async updateLastPracticed(userId: string, category: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_category_preferences')
        .upsert({
          user_id: userId,
          category,
          last_practiced: new Date().toISOString()
        }, {
          onConflict: 'user_id,category'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating last practiced:', error)
      // Don't throw, this is not critical
    }
  }
}

// Export singleton instance
export const categoryService = CategoryService.getInstance()
