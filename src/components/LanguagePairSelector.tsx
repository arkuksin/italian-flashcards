/**
 * LanguagePairSelector - Component for selecting language pairs
 * Displays available language pairs with stats and recommendations
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, TrendingUp, ChevronRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { languageService } from '../services/languageService';
import type { LanguagePair, LanguagePairStats, LearningDirection } from '../types';
import { Card } from './ui/Card';
import { MARGIN_BOTTOM, VERTICAL_SPACING } from '../constants/spacing';

interface LanguagePairSelectorProps {
  onSelect: (pairId: number, direction: LearningDirection) => void;
}

export const LanguagePairSelector: React.FC<LanguagePairSelectorProps> = ({
  onSelect
}) => {
  const { t } = useTranslation('dashboard');

  // Initialize with fallback data to ensure component always renders
  const [pairs, setPairs] = useState<LanguagePair[]>([
    {
      id: 1,
      source_lang: 'ru',
      target_lang: 'it',
      is_active: true,
      display_name_source: 'Русский',
      display_name_target: 'Italiano',
      flag_emoji_source: '🇷🇺',
      flag_emoji_target: '🇮🇹'
    },
    {
      id: 2,
      source_lang: 'it',
      target_lang: 'ru',
      is_active: true,
      display_name_source: 'Italiano',
      display_name_target: 'Русский',
      flag_emoji_source: '🇮🇹',
      flag_emoji_target: '🇷🇺'
    }
  ]);
  const [stats, setStats] = useState<LanguagePairStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanguagePairs();
  }, []);

  const loadLanguagePairs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [pairsData, statsData] = await Promise.all([
        languageService.getActiveLanguagePairs(),
        languageService.getLanguagePairStats(user.id)
      ]);

      // Only update if we got valid data from the database
      if (pairsData && pairsData.length > 0) {
        setPairs(pairsData);
      }
      // Always update stats (can be empty array)
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading language pairs:', error);
      // Keep using the default fallback data already in state
      console.log('Using fallback language pairs (ru-it, it-ru)');
    } finally {
      setLoading(false);
    }
  };

  const getStatsForPair = (pairId: number): LanguagePairStats | undefined => {
    return stats.find(s => s.language_pair_id === pairId);
  };

  const getSuggestion = (): LanguagePairStats | null => {
    const learnedPairs = stats.filter(s => s.words_learned > 0);
    if (learnedPairs.length === 0) return null;

    return learnedPairs.reduce((lowest, current) =>
      current.avg_accuracy < lowest.avg_accuracy ? current : lowest
    );
  };

  const handlePairSelect = (pair: LanguagePair) => {
    const direction = `${pair.source_lang}-${pair.target_lang}` as LearningDirection;
    onSelect(pair.id, direction);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 md:p-8 border-2 border-blue-200 dark:border-blue-800 shadow-lg" data-testid="mode-selection">
        <div className="text-center py-8">
          <Globe className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-300">
            {t('modeSelection.loading', 'Loading language pairs...')}
          </p>
        </div>
      </div>
    );
  }

  const suggestion = getSuggestion();

  // Group pairs by source-target combination (e.g., ru-it and it-ru together)
  const groupedPairs: Record<string, LanguagePair[]> = {};
  pairs.forEach(pair => {
    const key = [pair.source_lang, pair.target_lang].sort().join('-');
    if (!groupedPairs[key]) {
      groupedPairs[key] = [];
    }
    groupedPairs[key].push(pair);
  });

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 md:p-8 border-2 border-blue-200 dark:border-blue-800 shadow-lg" data-testid="mode-selection">
      {/* Hero Header */}
      <div className={`text-center ${MARGIN_BOTTOM.md} md:${MARGIN_BOTTOM.lg}`}>
        <Globe className={`w-12 h-12 md:w-16 md:h-16 text-blue-600 dark:text-blue-400 mx-auto ${MARGIN_BOTTOM.sm} md:${MARGIN_BOTTOM.md}`} />
        <h2 className={`text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 ${MARGIN_BOTTOM.xs}`}>
          {t('modeSelection.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg">
          {t('languagePairs.subtitle', 'Choose your learning direction')}
        </p>
      </div>

      {/* Recommendation Banner */}
      {suggestion && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg ${MARGIN_BOTTOM.md}`}
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-100">
                {t('languagePairs.recommendation', 'Recommendation')}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {suggestion.flag_emoji_source} {suggestion.display_name_source} → {suggestion.flag_emoji_target} {suggestion.display_name_target}{' '}
                {t('languagePairs.lowestAccuracy', 'has the lowest accuracy')} ({suggestion.avg_accuracy.toFixed(0)}%)
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Language Pair Cards */}
      <div className={`${VERTICAL_SPACING.sm} md:${VERTICAL_SPACING.md} max-w-2xl mx-auto`}>
        {pairs.map(pair => {
          const pairStats = getStatsForPair(pair.id);
          const direction = `${pair.source_lang}-${pair.target_lang}` as LearningDirection;
          const isNew = !pairStats || pairStats.words_learned === 0;

          return (
            <Card
              key={pair.id}
              variant="outlined"
              size="default"
              as={motion.button}
              data-testid={`mode-${direction}`}
              onClick={() => handlePairSelect(pair)}
              className="w-full min-h-[120px] !border-blue-300 dark:!border-blue-700 hover:!border-blue-500 dark:hover:!border-blue-500 hover:shadow-xl transition-all group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4 flex-1">
                  {/* Language Flags */}
                  <div className="flex items-center gap-2">
                    <span className="text-3xl md:text-5xl flex-shrink-0" style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
                      {pair.flag_emoji_source}
                    </span>
                    <span className="text-xl text-gray-400">→</span>
                    <span className="text-3xl md:text-5xl flex-shrink-0" style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
                      {pair.flag_emoji_target}
                    </span>
                  </div>

                  {/* Language Names and Stats */}
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2" style={{ fontSize: 'clamp(1.125rem, 4vw, 1.5rem)' }}>
                      {pair.display_name_source} → {pair.display_name_target}
                      {isNew && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                          <Sparkles className="w-3 h-3" />
                          {t('languagePairs.new', 'New')}
                        </span>
                      )}
                    </div>

                    {/* Statistics */}
                    {pairStats && pairStats.words_learned > 0 ? (
                      <div className="text-gray-600 dark:text-gray-400 mt-1" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)' }}>
                        {t('languagePairs.wordsLearned', { count: pairStats.words_learned, defaultValue: '{{count}} words learned' })} ·{' '}
                        {t('modeSelection.accuracy', { accuracy: pairStats.avg_accuracy.toFixed(0), defaultValue: '{{accuracy}}% accuracy' })} ·{' '}
                        {t('languagePairs.level', { level: pairStats.avg_mastery_level.toFixed(1), defaultValue: 'Level {{level}}' })}
                      </div>
                    ) : (
                      <div className="text-gray-600 dark:text-gray-400 mt-1" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)' }}>
                        {t('languagePairs.ready', 'Ready to start learning')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chevron Icon */}
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* No pairs available */}
      {pairs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300">
            {t('languagePairs.noPairs', 'No language pairs available')}
          </p>
        </div>
      )}
    </div>
  );
};
