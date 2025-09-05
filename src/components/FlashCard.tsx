import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, RotateCcw, Check, X } from 'lucide-react';
import { Word, LearningDirection } from '../types';

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
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const sourceText = learningDirection === 'ru-it' ? word.russian : word.italian;
  const targetText = learningDirection === 'ru-it' ? word.italian : word.russian;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="flex flex-col items-center space-y-6 max-w-2xl mx-auto">
      {/* Card Counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm font-medium text-gray-500 dark:text-gray-400"
      >
        Card {currentIndex + 1} of {totalWords}
      </motion.div>

      {/* Main Card */}
      <motion.div
        className="relative w-full h-80 perspective-1000"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.div
          className="w-full h-full relative preserve-3d cursor-pointer"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onClick={handleFlip}
        >
          {/* Front of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center p-8 text-white">
              <div className="text-center">
                <motion.h2
                  className="text-4xl md:text-6xl font-bold mb-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {sourceText}
                </motion.h2>
                <motion.p
                  className="text-lg opacity-80"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Click to flip or type your answer below
                </motion.p>
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl shadow-2xl flex items-center justify-center p-8 text-white">
              <div className="text-center">
                <motion.h2
                  className="text-4xl md:text-6xl font-bold mb-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {targetText}
                </motion.h2>
                <motion.p
                  className="text-lg opacity-80"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Answer revealed!
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Input Section */}
      <motion.div
        className="w-full space-y-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={`Type the ${learningDirection === 'ru-it' ? 'Italian' : 'Russian'} translation...`}
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
              disabled={showAnswer}
              autoFocus
            />
          </div>

          {!showAnswer && (
            <motion.button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!userInput.trim()}
            >
              Check Answer (Enter)
            </motion.button>
          )}
        </form>

        {/* Answer Feedback */}
        <AnimatePresence>
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className={`p-6 rounded-2xl ${
                isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  {isCorrect ? (
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`font-semibold text-lg ${
                    isCorrect
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <p className="mb-2">
                    <strong>Your answer:</strong> {userInput}
                  </p>
                  <p>
                    <strong>Correct answer:</strong> {targetText}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Navigation */}
      <motion.div
        className="flex justify-center space-x-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          onClick={onPrevious}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Previous</span>
        </motion.button>

        <motion.button
          onClick={() => setIsFlipped(false)}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw className="w-5 h-5" />
          <span>Reset Card</span>
        </motion.button>

        <motion.button
          onClick={onNext}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={currentIndex === totalWords - 1}
        >
          <span>Next</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Keyboard Shortcuts */}
      <motion.div
        className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p>Keyboard: ← → (navigate) • Enter (submit) • Ctrl+T (toggle direction)</p>
        <p>Ctrl+R (restart) • Ctrl+S (shuffle)</p>
      </motion.div>
    </div>
  );
};