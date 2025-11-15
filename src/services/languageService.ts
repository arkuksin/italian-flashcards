/**
 * Language Service - Manages language pairs and multi-language support
 */

import { supabase } from '../lib/supabase';
import type {
  LanguagePair,
  LanguagePairStats,
  LanguageCode,
  LearningDirection,
  MultilingualWord,
  Word
} from '../types';

export class LanguageService {
  private static instance: LanguageService;
  private cachedLanguagePairs: LanguagePair[] | null = null;

  private constructor() {}

  static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  /**
   * Get all active language pairs
   */
  async getActiveLanguagePairs(): Promise<LanguagePair[]> {
    if (this.cachedLanguagePairs) {
      return this.cachedLanguagePairs;
    }

    try {
      const { data, error } = await supabase
        .from('language_pairs')
        .select('*')
        .eq('is_active', true)
        .order('source_lang')
        .order('target_lang');

      if (error) {
        console.error('Error fetching language pairs:', error);
        throw error;
      }

      this.cachedLanguagePairs = data || [];
      return this.cachedLanguagePairs;
    } catch (error) {
      console.error('Failed to fetch language pairs:', error);
      throw new Error('Failed to load language pairs');
    }
  }

  /**
   * Get statistics for all language pairs for a specific user
   */
  async getLanguagePairStats(userId: string): Promise<LanguagePairStats[]> {
    try {
      const { data, error } = await supabase
        .from('v_language_pair_stats')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching language pair stats:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch language pair stats:', error);
      return [];
    }
  }

  /**
   * Get a specific language pair by ID
   */
  async getLanguagePairById(pairId: number): Promise<LanguagePair | null> {
    try {
      const { data, error } = await supabase
        .from('language_pairs')
        .select('*')
        .eq('id', pairId)
        .single();

      if (error) {
        console.error('Error fetching language pair by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch language pair by ID:', error);
      return null;
    }
  }

  /**
   * Convert learning direction string to language pair ID
   */
  async languageDirectionToPairId(direction: LearningDirection): Promise<number> {
    const [source, target] = direction.split('-') as [LanguageCode, LanguageCode];
    return this.getPairIdByLanguages(source, target);
  }

  /**
   * Get language pair ID by source and target language codes
   */
  async getPairIdByLanguages(
    sourceLang: LanguageCode,
    targetLang: LanguageCode
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('language_pairs')
        .select('id')
        .eq('source_lang', sourceLang)
        .eq('target_lang', targetLang)
        .single();

      if (error) {
        console.error('Error fetching language pair ID:', error);
        throw error;
      }

      if (!data) {
        throw new Error(`Language pair not found: ${sourceLang}-${targetLang}`);
      }

      return data.id;
    } catch (error) {
      console.error('Failed to get language pair ID:', error);
      throw error;
    }
  }

  /**
   * Get translation of a word in a specific language
   */
  getWordTranslation(word: Word | MultilingualWord, lang: LanguageCode): string {
    switch (lang) {
      case 'ru':
        return word.russian;
      case 'it':
        return word.italian;
      case 'de':
        return word.german || '';
      case 'en':
        return word.english || '';
      default:
        return '';
    }
  }

  /**
   * Get human-readable language name from code
   */
  languageCodeToName(code: LanguageCode, displayLanguage: 'en' | 'de' | 'it' | 'ru' = 'en'): string {
    const names: Record<'en' | 'de' | 'it' | 'ru', Record<LanguageCode, string>> = {
      en: {
        ru: 'Russian',
        it: 'Italian',
        de: 'German',
        en: 'English'
      },
      de: {
        ru: 'Russisch',
        it: 'Italienisch',
        de: 'Deutsch',
        en: 'Englisch'
      },
      it: {
        ru: 'Russo',
        it: 'Italiano',
        de: 'Tedesco',
        en: 'Inglese'
      },
      ru: {
        ru: 'Русский',
        it: 'Итальянский',
        de: 'Немецкий',
        en: 'Английский'
      }
    };

    return names[displayLanguage][code];
  }

  /**
   * Get flag emoji for a language code
   */
  languageCodeToFlag(code: LanguageCode): string {
    const flags: Record<LanguageCode, string> = {
      ru: '🇷🇺',
      it: '🇮🇹',
      de: '🇩🇪',
      en: '🇬🇧'
    };
    return flags[code];
  }

  /**
   * Parse learning direction string into source and target languages
   */
  parseLearningDirection(direction: LearningDirection): {
    source: LanguageCode;
    target: LanguageCode;
  } {
    const [source, target] = direction.split('-') as [LanguageCode, LanguageCode];
    return { source, target };
  }

  /**
   * Create learning direction string from language codes
   */
  createLearningDirection(source: LanguageCode, target: LanguageCode): LearningDirection {
    return `${source}-${target}` as LearningDirection;
  }

  /**
   * Check if a word has translation for a specific language
   */
  hasTranslation(word: Word | MultilingualWord, lang: LanguageCode): boolean {
    const translation = this.getWordTranslation(word, lang);
    return translation !== null && translation !== undefined && translation !== '';
  }

  /**
   * Check if a word has complete translations for a language pair
   */
  hasCompleteTranslations(
    word: Word | MultilingualWord,
    sourceLang: LanguageCode,
    targetLang: LanguageCode
  ): boolean {
    return this.hasTranslation(word, sourceLang) && this.hasTranslation(word, targetLang);
  }

  /**
   * Count available words for a language pair
   */
  async countAvailableWordsForPair(
    sourceLang: LanguageCode,
    targetLang: LanguageCode
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('count_available_words_for_pair', {
        p_source_lang: sourceLang,
        p_target_lang: targetLang
      });

      if (error) {
        console.error('Error counting words for pair:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Failed to count words for pair:', error);
      return 0;
    }
  }

  /**
   * Filter words that have complete translations for a language pair
   */
  filterWordsForLanguagePair(
    words: Word[],
    sourceLang: LanguageCode,
    targetLang: LanguageCode
  ): Word[] {
    return words.filter(word =>
      this.hasCompleteTranslations(word, sourceLang, targetLang)
    );
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this.cachedLanguagePairs = null;
  }

  /**
   * Refresh cache
   */
  async refreshCache(): Promise<LanguagePair[]> {
    this.clearCache();
    return this.getActiveLanguagePairs();
  }
}

// Export singleton instance
export const languageService = LanguageService.getInstance();

// Export utility functions for convenience
export const {
  getActiveLanguagePairs,
  getLanguagePairStats,
  getLanguagePairById,
  languageDirectionToPairId,
  getPairIdByLanguages,
  getWordTranslation,
  languageCodeToName,
  languageCodeToFlag,
  parseLearningDirection,
  createLearningDirection,
  hasTranslation,
  hasCompleteTranslations,
  countAvailableWordsForPair,
  filterWordsForLanguagePair
} = languageService;
