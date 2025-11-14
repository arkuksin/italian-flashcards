import React from 'react';
import { motion } from 'framer-motion';
import { Globe, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LearningDirection } from '../types';
import { useProgress } from '../hooks/useProgress';
import { Card } from './ui/Card';
import { MARGIN_BOTTOM, VERTICAL_SPACING } from '../constants/spacing';

interface ModeSelectionProps {
  onModeSelect: (direction: LearningDirection, selectedCategories?: string[]) => void;
  selectedCategories?: string[];
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onModeSelect, selectedCategories }) => {
  const { t } = useTranslation('dashboard');
  const { getStats } = useProgress();

  const stats = getStats();

  const handleModeSelect = (direction: LearningDirection) => {
    onModeSelect(direction, selectedCategories);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 md:p-8 border-2 border-blue-200 dark:border-blue-800 shadow-lg" data-testid="mode-selection">
      {/* Hero Header */}
      <div className={`text-center ${MARGIN_BOTTOM.md} md:${MARGIN_BOTTOM.lg}`}>
        <Globe className={`w-12 h-12 md:w-16 md:h-16 text-blue-600 dark:text-blue-400 mx-auto ${MARGIN_BOTTOM.sm} md:${MARGIN_BOTTOM.md}`} />
        <h2 className={`text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 ${MARGIN_BOTTOM.xs}`}>
          {t('modeSelection.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg">
          {t('modeSelection.subtitle')}
        </p>
      </div>

      {/* Large Mode Selection Buttons */}
      <div className={`${VERTICAL_SPACING.sm} md:${VERTICAL_SPACING.md} max-w-2xl mx-auto`}>
        {/* Russian → Italian */}
        <Card
          variant="outlined"
          size="default"
          as={motion.button}
          data-testid="mode-ru-it"
          onClick={() => handleModeSelect('ru-it')}
          className="w-full !border-blue-300 dark:!border-blue-700 hover:!border-blue-500 dark:hover:!border-blue-500 hover:shadow-xl transition-all group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-3xl md:text-5xl">🇷🇺</span>
              <div className="text-left">
                <div className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {t('modeSelection.ruToIt.title')}
                </div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('modeSelection.ruToIt.words', { count: stats.totalWordsStudied })} · {t('modeSelection.accuracy', { accuracy: stats.accuracy })}
                </div>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
          </div>
        </Card>

        {/* Italian → Russian */}
        <Card
          variant="outlined"
          size="default"
          as={motion.button}
          data-testid="mode-it-ru"
          onClick={() => handleModeSelect('it-ru')}
          className="w-full !border-blue-300 dark:!border-blue-700 hover:!border-blue-500 dark:hover:!border-blue-500 hover:shadow-xl transition-all group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-3xl md:text-5xl">🇮🇹</span>
              <div className="text-left">
                <div className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {t('modeSelection.itToRu.title')}
                </div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('modeSelection.itToRu.words', { count: stats.totalWordsStudied })} · {t('modeSelection.accuracy', { accuracy: stats.accuracy })}
                </div>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
          </div>
        </Card>
      </div>
    </div>
  );
};