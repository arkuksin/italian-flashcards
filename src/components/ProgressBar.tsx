import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Target, Flame, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProgress } from '../hooks/useProgress';
import { MARGIN_BOTTOM, GAP } from '../constants/spacing';

interface ProgressBarProps {
  totalWords: number;
  currentIndex: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalWords,
  currentIndex,
}) => {
  const { t } = useTranslation('learning');

  // Get database statistics for persistent progress tracking
  const { getStats } = useProgress();
  const dbStats = getStats();

  // Use database values for display (persistent across sessions)
  const correct = dbStats.correctAnswers;
  const wrong = dbStats.totalAttempts - dbStats.correctAnswers;
  const accuracy = dbStats.accuracy;
  const streak = dbStats.currentStreak;
  const completed = dbStats.totalWordsStudied;

  const completionRate = Math.round((completed / totalWords) * 100);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg"
      data-testid="progress-bar"
    >
      {/* Progress Bar */}
      <div className={MARGIN_BOTTOM.lg}>
        <div className={`flex justify-between items-center ${MARGIN_BOTTOM.xs}`}>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {t('progress.title')}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {currentIndex + 1} / {totalWords}
          </span>
        </div>
        <div
          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"
          role="progressbar"
          aria-label={t('progress.title')}
          aria-valuenow={currentIndex + 1}
          aria-valuemin={0}
          aria-valuemax={totalWords}
        >
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-2 md:grid-cols-4 ${GAP.md}`}>
        <motion.div
          className="text-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          role="status"
          aria-label={`${correct} ${t('progress.correct')}`}
        >
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-6 h-6 text-green-500 mr-1" aria-hidden="true" />
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {correct}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('progress.correct')}</p>
        </motion.div>

        <motion.div
          className="text-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          role="status"
          aria-label={`${wrong} ${t('progress.wrong')}`}
        >
          <div className="flex items-center justify-center mb-2">
            <XCircle className="w-6 h-6 text-red-500 mr-1" aria-hidden="true" />
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {wrong}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('progress.wrong')}</p>
        </motion.div>

        <motion.div
          className="text-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          role="status"
          aria-label={`${accuracy}% ${t('progress.accuracy')}`}
        >
          <div className="flex items-center justify-center mb-2">
            <Target className="w-6 h-6 text-blue-500 mr-1" aria-hidden="true" />
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {accuracy}%
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('progress.accuracy')}</p>
        </motion.div>

        <motion.div
          className="text-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          role="status"
          aria-label={`${streak} ${t('progress.streak')}`}
        >
          <div className="flex items-center justify-center mb-2">
            <Flame className="w-6 h-6 text-orange-500 mr-1" aria-hidden="true" />
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {streak}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('progress.streak')}</p>
        </motion.div>
      </div>

      {/* Completion Rate */}
      <motion.div
        className="mt-6 text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        role="status"
        aria-label={`${completionRate}% ${t('progress.wordsCompletedLabel')}: ${completed} of ${totalWords}`}
      >
        <div className="flex items-center justify-center mb-2">
          <TrendingUp className="w-5 h-5 text-purple-500 mr-2" aria-hidden="true" />
          <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
            {completionRate}%
          </span>
        </div>
        <p className="text-sm text-purple-600 dark:text-purple-400">
          {t('progress.wordsCompletedLabel')}: {completed} / {totalWords}
        </p>
      </motion.div>
    </motion.div>
  );
};
