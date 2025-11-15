import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Send, Check, X, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Word, LearningDirection, WordProgress, DifficultyRating } from '../types';
import { Card } from './ui/Card';
import { TextField } from './ui/TextField';
import { MARGIN_BOTTOM, GAP, SPACING_PATTERNS } from '../constants/spacing';
import { Container } from './layout';
import { WordImage } from './WordImage';

interface FlashCardProps {
  word: Word;
  learningDirection: LearningDirection;
  userInput: string;
  showAnswer: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  onPrevious: () => void;
  isCorrect: boolean | null;
  currentIndex: number;
  totalWords: number;
  wordProgress?: WordProgress;
  onDifficultyRating?: (rating: DifficultyRating) => void;
  difficultyRating?: DifficultyRating;
}

export const FlashCard: React.FC<FlashCardProps> = ({
  word,
  learningDirection,
  userInput,
  showAnswer,
  onInputChange,
  onSubmit,
  onNext,
  onPrevious,
  isCorrect,
  currentIndex,
  totalWords,
  wordProgress,
  onDifficultyRating,
  difficultyRating,
}) => {
  const { t } = useTranslation('learning');
  const sourceWord = learningDirection === 'ru-it' ? word.russian : word.italian;
  const targetWord = learningDirection === 'ru-it' ? word.italian : word.russian;
  const canGoNext = currentIndex < totalWords - 1;
  const canGoPrevious = currentIndex > 0;

  // Mastery level colors
  const getMasteryColor = (level: number) => {
    const colors = [
      'bg-gray-200 dark:bg-gray-700', // Level 0
      'bg-red-200 dark:bg-red-900/50', // Level 1
      'bg-orange-200 dark:bg-orange-900/50', // Level 2
      'bg-yellow-200 dark:bg-yellow-900/50', // Level 3
      'bg-green-200 dark:bg-green-900/50', // Level 4
      'bg-blue-200 dark:bg-blue-900/50', // Level 5
    ]
    return colors[Math.min(level, 5)]
  }

  const getMasteryLabel = (level: number) => {
    return t(`flashcard.mastery.levels.${Math.min(level, 5)}`)
  }

  const handleDifficultyRating = useCallback((rating: DifficultyRating) => {
    if (!onDifficultyRating) return;

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(rating === 4 ? 50 : 10);
    }

    // Confetti for "Easy" rating
    if (rating === 4) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      });
    }

    onDifficultyRating(rating);
  }, [onDifficultyRating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Container width="content">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
      {/* Main Card */}
      <Card variant="elevated" size="comfortable" as={motion.div} layout>
        {/* Word Display */}
        <div className={`text-center ${MARGIN_BOTTOM.xl}`}>
          <motion.div
            key={word.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={MARGIN_BOTTOM.md}
          >
            <p className={`text-sm font-medium text-gray-600 dark:text-gray-400 ${MARGIN_BOTTOM.xs}`}>
              {learningDirection === 'ru-it' ? t('flashcard.translateToItalian') : t('flashcard.translateToRussian')}
            </p>
            <h2
              className={`text-4xl md:text-5xl font-bold text-gray-900 dark:text-white ${MARGIN_BOTTOM.xs}`}
              data-testid="question-text"
            >
              {sourceWord}
            </h2>
            {word.category && (
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                {word.category}
              </span>
            )}

            {/* Word Image */}
            <div className="mt-4 flex justify-center">
              <WordImage
                wordId={word.id}
                wordText={learningDirection === 'ru-it' ? word.italian : word.russian}
                hasAnswered={showAnswer}
                className="transition-all duration-300"
              />
            </div>

            {/* Mastery Level Indicator */}
            {wordProgress && (
              <div className={`mt-4 flex items-center justify-center ${SPACING_PATTERNS.iconText}`} data-testid="mastery-indicator">
                <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`w-2 h-6 rounded ${
                        level <= wordProgress.mastery_level
                          ? getMasteryColor(wordProgress.mastery_level)
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      title={`${t('flashcard.mastery.title')}: ${getMasteryLabel(wordProgress.mastery_level)}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                  {getMasteryLabel(wordProgress.mastery_level)}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className={MARGIN_BOTTOM.lg} data-testid="answer-form">
          <div className={`flex flex-col sm:flex-row ${GAP.sm}`}>
            <TextField
              type="text"
              value={userInput}
              onChange={(e) => onInputChange(e.target.value)}
              disabled={showAnswer}
              label={t('flashcard.inputPlaceholder')}
              variant="filled"
              size="large"
              autoFocus
              data-testid="answer-input"
              fullWidth
            />
            {!showAnswer && (
              <motion.button
                type="submit"
                disabled={!userInput.trim()}
                className="flex-shrink-0 w-full sm:w-auto px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-xl transition-colors disabled:cursor-not-allowed font-medium text-base min-h-[64px] flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="answer-submit-button"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">{t('flashcard.submit', 'Submit')}</span>
              </motion.button>
            )}
          </div>
        </form>

        {/* Answer Display */}
        {showAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={MARGIN_BOTTOM.lg}
            data-testid="answer-feedback"
          >
            <div className={`p-6 rounded-2xl border-2 ${
              isCorrect
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600'
                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600'
            }`}>
              <div className={`flex items-center justify-center ${MARGIN_BOTTOM.md}`}>
                {isCorrect ? (
                  <div className="flex items-center text-green-700 dark:text-green-300">
                    <Check className="w-6 h-6 mr-2" />
                    <span className="text-lg font-semibold">
                      {t('flashcard.feedback.correct', 'Correct!')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-700 dark:text-red-300">
                    <X className="w-6 h-6 mr-2" />
                    <span className="text-lg font-semibold">
                      {t('flashcard.feedback.incorrect', 'Not quite')}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className={`text-sm text-gray-600 dark:text-gray-400 ${SPACING_PATTERNS.listItem}`}>
                  {t('flashcard.correctAnswer', 'Correct answer')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="correct-answer">
                  {targetWord}
                </p>
                {!isCorrect && userInput.trim() && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {t('flashcard.yourAnswer', 'Your answer')}: <span className="font-medium">{userInput}</span>
                  </p>
                )}
              </div>

              {/* Phase 3: Difficulty Rating Buttons */}
              {onDifficultyRating && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <p className={`text-sm text-gray-600 dark:text-gray-400 ${MARGIN_BOTTOM.sm} text-center`}>
                    {t('flashcard.difficulty.prompt', 'How well did you know this?')}
                  </p>
                  <div className={`grid grid-cols-2 md:grid-cols-4 ${GAP.sm}`} data-testid="difficulty-buttons">
                    {/* Again Button */}
                    <motion.button
                      onClick={() => handleDifficultyRating(1)}
                      disabled={difficultyRating !== undefined}
                      title={t('flashcard.difficulty.tooltip.again', 'Review this card soon (same session)')}
                      className={`flex flex-col items-center justify-center min-h-[56px] px-4 py-3 rounded-xl font-semibold transition-all ${
                        difficultyRating === 1
                          ? 'bg-red-500 text-white ring-2 ring-red-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      whileHover={difficultyRating === undefined ? { scale: 1.05 } : {}}
                      whileTap={difficultyRating === undefined ? { scale: 0.9, rotate: [-2, 2, -2, 2, 0] } : {}}
                      data-testid="difficulty-again"
                    >
                      <span className="text-2xl mb-1">👎</span>
                      <span className="text-sm">{t('flashcard.difficulty.again', 'Again')}</span>
                    </motion.button>

                    {/* Hard Button */}
                    <motion.button
                      onClick={() => handleDifficultyRating(2)}
                      disabled={difficultyRating !== undefined}
                      title={t('flashcard.difficulty.tooltip.hard', 'Show again in a few minutes')}
                      className={`flex flex-col items-center justify-center min-h-[56px] px-4 py-3 rounded-xl font-semibold transition-all ${
                        difficultyRating === 2
                          ? 'bg-orange-500 text-white ring-2 ring-orange-400'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      whileHover={difficultyRating === undefined ? { scale: 1.05 } : {}}
                      whileTap={difficultyRating === undefined ? { scale: 0.9 } : {}}
                      data-testid="difficulty-hard"
                    >
                      <span className="text-2xl mb-1">🤔</span>
                      <span className="text-sm">{t('flashcard.difficulty.hard', 'Hard')}</span>
                    </motion.button>

                    {/* Good Button */}
                    <motion.button
                      onClick={() => handleDifficultyRating(3)}
                      disabled={difficultyRating !== undefined}
                      title={t('flashcard.difficulty.tooltip.good', 'Show again in ~1 day')}
                      className={`flex flex-col items-center justify-center min-h-[56px] px-4 py-3 rounded-xl font-semibold transition-all ${
                        difficultyRating === 3
                          ? 'bg-blue-500 text-white ring-2 ring-blue-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      whileHover={difficultyRating === undefined ? { scale: 1.05 } : {}}
                      whileTap={difficultyRating === undefined ? { scale: 0.9 } : {}}
                      data-testid="difficulty-good"
                    >
                      <span className="text-2xl mb-1">🙂</span>
                      <span className="text-sm">{t('flashcard.difficulty.good', 'Good')}</span>
                    </motion.button>

                    {/* Easy Button */}
                    <motion.button
                      onClick={() => handleDifficultyRating(4)}
                      disabled={difficultyRating !== undefined}
                      title={t('flashcard.difficulty.tooltip.easy', 'Show again in several days')}
                      className={`flex flex-col items-center justify-center min-h-[56px] px-4 py-3 rounded-xl font-semibold transition-all ${
                        difficultyRating === 4
                          ? 'bg-green-500 text-white ring-2 ring-green-400'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      whileHover={difficultyRating === undefined ? { scale: 1.05 } : {}}
                      whileTap={difficultyRating === undefined ? { scale: 0.9 } : {}}
                      data-testid="difficulty-easy"
                    >
                      <span className="text-2xl mb-1">😊</span>
                      <span className="text-sm">{t('flashcard.difficulty.easy', 'Easy')}</span>
                    </motion.button>
                  </div>
                  {difficultyRating && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2"
                    >
                      {t('flashcard.difficulty.saved', 'Rating saved! You can continue to the next word.')}
                    </motion.p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <motion.button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
            whileHover={canGoPrevious ? { scale: 1.05 } : {}}
            whileTap={canGoPrevious ? { scale: 0.95 } : {}}
            data-testid="previous-button"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            {t('flashcard.navigation.previous')}
          </motion.button>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('flashcard.navigation.progress', { current: currentIndex + 1, total: totalWords })}
            </p>
          </div>

          <motion.button
            onClick={onNext}
            disabled={!canGoNext}
            className="flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
            whileHover={canGoNext ? { scale: 1.05 } : {}}
            whileTap={canGoNext ? { scale: 0.95 } : {}}
            data-testid="next-button"
          >
            {t('flashcard.navigation.next')}
            <ChevronRight className="w-5 h-5 ml-2" />
          </motion.button>
        </div>
      </Card>

      {/* Keyboard Shortcuts Help */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={`${MARGIN_BOTTOM.lg} text-center text-sm text-gray-500 dark:text-gray-400`}
      >
        <p>{t('flashcard.shortcuts')}</p>
      </motion.div>
      </motion.div>
    </Container>
  );
};
