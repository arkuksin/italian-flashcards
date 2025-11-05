import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LearningDirection } from '../types';

interface ModeSelectionProps {
  onModeSelect: (direction: LearningDirection) => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onModeSelect }) => {
  const { t } = useTranslation('learning');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center space-y-12"
      >
        {/* Header */}
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
          >
            <BookOpen className="w-12 h-12 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
          >
            {t('modeSelection.title')}
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            {t('modeSelection.subtitle')}
          </motion.p>
        </div>

        {/* Mode Selection */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-8">
            {t('modeSelection.chooseDirection')}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.button
              data-testid="mode-ru-it"
              onClick={() => onModeSelect('ru-it')}
              className="group relative p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="space-y-4">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  Русский
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mx-auto transition-colors" />
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  Italiano
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('modeSelection.modes.ruToIt.description')}
                </p>
              </div>
            </motion.button>

            <motion.button
              data-testid="mode-it-ru"
              onClick={() => onModeSelect('it-ru')}
              className="group relative p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500"
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="space-y-4">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  Italiano
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-purple-500 mx-auto transition-colors" />
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  Русский
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('modeSelection.modes.itToRu.description')}
                </p>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center"
        >
          <div className="space-y-2">
            <div className="text-2xl">⌨️</div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('modeSelection.features.keyboard.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('modeSelection.features.keyboard.description')}</p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">📊</div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('modeSelection.features.progress.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('modeSelection.features.progress.description')}</p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">🎨</div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('modeSelection.features.design.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('modeSelection.features.design.description')}</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};