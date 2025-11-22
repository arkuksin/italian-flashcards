/**
 * Language constants and utilities
 */

import { LearningDirection } from '../types';

/**
 * Maps learning directions to their respective language flags
 */
export const DIRECTION_FLAGS: Record<LearningDirection, { source: string; target: string }> = {
  'ru-it': {
    source: '🇷🇺',
    target: '🇮🇹'
  },
  'it-ru': {
    source: '🇮🇹',
    target: '🇷🇺'
  },
  'de-it': {
    source: '🇩🇪',
    target: '🇮🇹'
  },
  'it-de': {
    source: '🇮🇹',
    target: '🇩🇪'
  },
  'en-it': {
    source: '🇬🇧',
    target: '🇮🇹'
  },
  'it-en': {
    source: '🇮🇹',
    target: '🇬🇧'
  }
};

/**
 * Gets the flag emojis for a given learning direction
 * @param direction - The learning direction (e.g., 'ru-it', 'it-ru')
 * @returns Object containing source and target flags
 */
export function getDirectionFlags(direction: LearningDirection): { source: string; target: string } {
  return DIRECTION_FLAGS[direction] || { source: '', target: '' };
}

/**
 * Formats a learning direction with flags
 * @param direction - The learning direction
 * @param text - Optional text to include (e.g., "Russian → Italian")
 * @returns Formatted string with flags
 */
export function formatDirectionWithFlags(direction: LearningDirection, text?: string): string {
  const flags = getDirectionFlags(direction);
  if (text) {
    return `${flags.source} ${text} ${flags.target}`;
  }
  return `${flags.source} → ${flags.target}`;
}
