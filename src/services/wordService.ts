import { supabase } from '../lib/supabase'
import { Word } from '../types'

export class WordService {
  private static instance: WordService
  private cachedWords: Word[] | null = null

  private constructor() {}

  static getInstance(): WordService {
    if (!WordService.instance) {
      WordService.instance = new WordService()
    }
    return WordService.instance
  }

  async getAllWords(): Promise<Word[]> {
    if (this.cachedWords) {
      return this.cachedWords
    }

    try {
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .order('id')

      if (error) {
        console.error('Error fetching words from database:', error)
        throw error
      }

      this.cachedWords = data || []
      return this.cachedWords
    } catch (error) {
      console.error('Failed to fetch words:', error)
      throw new Error('Failed to load words from database')
    }
  }

  async getWordsByCategory(category: string): Promise<Word[]> {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('category', category)
        .order('id')

      if (error) {
        console.error('Error fetching words by category:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch words by category:', error)
      throw new Error(`Failed to load words for category: ${category}`)
    }
  }

  async getWordById(id: number): Promise<Word | null> {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching word by ID:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to fetch word by ID:', error)
      return null
    }
  }

  async getRandomWords(count: number = 10): Promise<Word[]> {
    try {
      // Get all words and shuffle them client-side
      // Note: Supabase doesn't support random() in the same way as PostgreSQL
      const allWords = await this.getAllWords()

      // Shuffle array
      const shuffled = [...allWords].sort(() => Math.random() - 0.5)

      return shuffled.slice(0, count)
    } catch (error) {
      console.error('Failed to get random words:', error)
      throw new Error('Failed to load random words')
    }
  }

  getShuffledWords(): Word[] {
    if (!this.cachedWords) {
      throw new Error('Words not loaded yet. Call getAllWords() first.')
    }

    return [...this.cachedWords].sort(() => Math.random() - 0.5)
  }

  clearCache(): void {
    this.cachedWords = null
  }

  async refreshCache(): Promise<Word[]> {
    this.clearCache()
    return this.getAllWords()
  }
}

// Export singleton instance and utility functions
export const wordService = WordService.getInstance()

export async function loadWords(): Promise<Word[]> {
  return wordService.getAllWords()
}

export function getShuffledWords(words: Word[]): Word[] {
  return [...words].sort(() => Math.random() - 0.5)
}