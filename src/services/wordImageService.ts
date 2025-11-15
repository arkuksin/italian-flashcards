import { supabase } from '../lib/supabase'

/**
 * Image sources for word images
 */
export type ImageSource = 'unsplash' | 'pexels' | 'custom' | 'ai'

/**
 * Word image interface matching database schema
 */
export interface WordImage {
  id: string
  word_id: number
  image_url: string
  thumbnail_url?: string | null
  source: ImageSource
  source_attribution?: string | null
  alt_text: string
  is_primary: boolean
  created_at?: string
}

/**
 * Service for managing word images
 */
export class WordImageService {
  private static instance: WordImageService
  private imageCache: Map<number, WordImage | null> = new Map()

  private constructor() {}

  static getInstance(): WordImageService {
    if (!WordImageService.instance) {
      WordImageService.instance = new WordImageService()
    }
    return WordImageService.instance
  }

  /**
   * Get the primary image for a word
   */
  async getImageForWord(wordId: number): Promise<WordImage | null> {
    // Check cache first
    if (this.imageCache.has(wordId)) {
      return this.imageCache.get(wordId) ?? null
    }

    try {
      const { data, error } = await supabase
        .from('word_images')
        .select('*')
        .eq('word_id', wordId)
        .eq('is_primary', true)
        .maybeSingle()

      if (error) {
        console.error('Error fetching word image:', error)
        throw error
      }

      // Cache the result (even if null)
      this.imageCache.set(wordId, data)
      return data
    } catch (error) {
      console.error('Failed to fetch word image:', error)
      return null
    }
  }

  /**
   * Get all images for a word (including non-primary)
   */
  async getAllImagesForWord(wordId: number): Promise<WordImage[]> {
    try {
      const { data, error } = await supabase
        .from('word_images')
        .select('*')
        .eq('word_id', wordId)
        .order('is_primary', { ascending: false })

      if (error) {
        console.error('Error fetching word images:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch word images:', error)
      return []
    }
  }

  /**
   * Assign an image to a word
   */
  async assignImageToWord(
    wordId: number,
    imageUrl: string,
    source: ImageSource = 'custom',
    options?: {
      thumbnailUrl?: string
      altText?: string
      sourceAttribution?: string
      isPrimary?: boolean
    }
  ): Promise<WordImage> {
    const { data, error } = await supabase
      .from('word_images')
      .insert({
        word_id: wordId,
        image_url: imageUrl,
        thumbnail_url: options?.thumbnailUrl,
        source,
        alt_text: options?.altText || `Image for word ${wordId}`,
        source_attribution: options?.sourceAttribution,
        is_primary: options?.isPrimary ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error assigning image to word:', error)
      throw error
    }

    // Update cache
    if (options?.isPrimary ?? true) {
      this.imageCache.set(wordId, data)
    }

    return data
  }

  /**
   * Update an existing word image
   */
  async updateWordImage(
    imageId: string,
    updates: {
      image_url?: string
      thumbnail_url?: string
      source?: ImageSource
      source_attribution?: string
      alt_text?: string
      is_primary?: boolean
    }
  ): Promise<WordImage> {
    const { data, error } = await supabase
      .from('word_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single()

    if (error) {
      console.error('Error updating word image:', error)
      throw error
    }

    // Clear cache for this word since it was updated
    if (data) {
      this.imageCache.delete(data.word_id)
    }

    return data
  }

  /**
   * Delete a word image
   */
  async deleteWordImage(imageId: string): Promise<void> {
    // First get the word_id before deleting
    const { data: imageData } = await supabase
      .from('word_images')
      .select('word_id')
      .eq('id', imageId)
      .single()

    const { error } = await supabase
      .from('word_images')
      .delete()
      .eq('id', imageId)

    if (error) {
      console.error('Error deleting word image:', error)
      throw error
    }

    // Clear cache for this word
    if (imageData) {
      this.imageCache.delete(imageData.word_id)
    }
  }

  /**
   * Search Unsplash for an image (requires API key)
   * Note: This is a placeholder for future implementation
   */
  async searchUnsplashImage(query: string): Promise<{
    url: string
    thumbnailUrl: string
    attribution: string
  } | null> {
    const apiKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY

    if (!apiKey) {
      console.warn('Unsplash API key not configured')
      return null
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${apiKey}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.statusText}`)
      }

      const data = await response.json()
      const photo = data.results?.[0]

      if (!photo) {
        return null
      }

      return {
        url: photo.urls.regular,
        thumbnailUrl: photo.urls.small,
        attribution: `Photo by ${photo.user.name} on Unsplash`,
      }
    } catch (error) {
      console.error('Failed to search Unsplash:', error)
      return null
    }
  }

  /**
   * Bulk assign images to multiple words
   * This is useful for initial setup or batch processing
   */
  async bulkAssignImages(
    words: Array<{ id: number; italian: string }>,
    source: ImageSource = 'unsplash'
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const word of words) {
      try {
        let imageData: {
          url: string
          thumbnailUrl: string
          attribution: string
        } | null = null

        // Try to get image based on source
        if (source === 'unsplash') {
          imageData = await this.searchUnsplashImage(word.italian)
        }

        if (imageData) {
          await this.assignImageToWord(word.id, imageData.url, source, {
            thumbnailUrl: imageData.thumbnailUrl,
            altText: `Image of ${word.italian}`,
            sourceAttribution: imageData.attribution,
            isPrimary: true,
          })
          results.successful++
        } else {
          results.failed++
          results.errors.push(`No image found for word: ${word.italian}`)
        }

        // Rate limiting - wait between requests
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        results.failed++
        results.errors.push(
          `Failed to assign image for word ${word.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        console.error(`Failed to assign image for word ${word.id}:`, error)
      }
    }

    return results
  }

  /**
   * Clear the image cache
   */
  clearCache(): void {
    this.imageCache.clear()
  }

  /**
   * Preload images for a list of word IDs
   * Useful for prefetching images before rendering flashcards
   */
  async preloadImages(wordIds: number[]): Promise<void> {
    const promises = wordIds.map((wordId) => this.getImageForWord(wordId))
    await Promise.allSettled(promises)
  }
}

// Export singleton instance
export const wordImageService = WordImageService.getInstance()
