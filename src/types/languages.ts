/**
 * Language-related types for multi-language support
 */

// Supported language codes
export type LanguageCode = 'ru' | 'it' | 'de' | 'en';

// Language pair definition from database
export interface LanguagePair {
  id: number;
  source_lang: LanguageCode;
  target_lang: LanguageCode;
  is_active: boolean;
  display_name_source: string;
  display_name_target: string;
  flag_emoji_source: string;
  flag_emoji_target: string;
  created_at?: string;
}

// Statistics for a specific language pair
export interface LanguagePairStats {
  language_pair_id: number;
  source_lang: LanguageCode;
  target_lang: LanguageCode;
  display_name_source: string;
  display_name_target: string;
  flag_emoji_source: string;
  flag_emoji_target: string;
  user_id: string;
  words_learned: number;
  avg_accuracy: number;
  avg_mastery_level: number;
}

// Extended Word interface with all language translations
export interface MultilingualWord {
  id: number;
  russian: string;
  italian: string;
  german?: string;
  english?: string;
  category: string;
  created_at?: string;
}

// Extended learning directions to include all language pairs
export type ExtendedLearningDirection =
  | 'ru-it'
  | 'it-ru'
  | 'de-it'
  | 'it-de'
  | 'en-it'
  | 'it-en';

// Helper type to convert between learning direction and language codes
export interface LanguagePairInfo {
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  direction: ExtendedLearningDirection;
}

// Database types for language pairs
export interface DbLanguagePair {
  id: number;
  source_lang: string;
  target_lang: string;
  is_active: boolean;
  display_name_source: string;
  display_name_target: string;
  flag_emoji_source: string;
  flag_emoji_target: string;
  created_at: string;
}

export interface DbLanguagePairStats {
  language_pair_id: number;
  source_lang: string;
  target_lang: string;
  display_name_source: string;
  display_name_target: string;
  flag_emoji_source: string;
  flag_emoji_target: string;
  user_id: string;
  words_learned: number;
  avg_accuracy: number;
  avg_mastery_level: number;
}
