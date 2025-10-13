import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Shuffle, RotateCcw, ArrowLeftRight } from 'lucide-react';
import { LearningDirection } from '../types';
import { UserProfile } from './auth/UserProfile';

interface HeaderProps {
  darkMode: boolean;
  shuffleMode: boolean;
  learningDirection: LearningDirection;
  onToggleDarkMode: () => void;
  onToggleShuffle: () => void;
  onToggleDirection: () => void;
  onRestart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  shuffleMode,
  learningDirection,
  onToggleDarkMode,
  onToggleShuffle,
  onToggleDirection,
  onRestart,
}) => {
  const directionText = learningDirection === 'ru-it' ? 'Русский → Italiano' : 'Italiano → Русский';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex justify-between items-center p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 relative z-50"
    >
      <div className="flex items-center space-x-4">
        <motion.h1
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          FlashCards
        </motion.h1>
        <motion.div
          className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium"
          whileHover={{ scale: 1.05 }}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>{directionText}</span>
        </motion.div>
      </div>

      <div className="flex items-center space-x-2">
        <motion.button
          onClick={onToggleDirection}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Toggle learning direction (Ctrl+T)"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </motion.button>

        <motion.button
          onClick={onToggleShuffle}
          className={`p-2 rounded-lg transition-colors ${
            shuffleMode
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Toggle shuffle mode (Ctrl+S)"
        >
          <Shuffle className="w-5 h-5" />
        </motion.button>

        <motion.button
          onClick={onRestart}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          title="Restart session (Ctrl+R)"
          data-testid="restart-button"
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>

        <motion.button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>

        {/* User Profile with Logout */}
        <div className="ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
          <UserProfile />
        </div>
      </div>
    </motion.header>
  );
};
