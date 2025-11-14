import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Shuffle, RotateCcw, ArrowLeftRight, Check, X, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LearningDirection } from '../types';
import { UserProfile } from './auth/UserProfile';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileDrawer } from './MobileDrawer';
import { GAP, SPACING_PATTERNS } from '../constants/spacing';

interface HeaderProps {
  darkMode: boolean;
  shuffleMode: boolean;
  learningDirection: LearningDirection;
  accentSensitive: boolean;
  onToggleDarkMode: () => void;
  onToggleShuffle: () => void;
  onToggleDirection: () => void;
  onToggleAccent: () => void;
  onRestart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  shuffleMode,
  learningDirection,
  accentSensitive,
  onToggleDarkMode,
  onToggleShuffle,
  onToggleDirection,
  onToggleAccent,
  onRestart,
}) => {
  const { t } = useTranslation('common');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const directionText = learningDirection === 'ru-it' ? t('direction.ruToIt') : t('direction.itToRu');
  const accentLabel = accentSensitive ? t('labels.accentCheckOn') : t('labels.accentCheckOff');

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center p-4 md:p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 relative z-50"
      >
        {/* Left side: Logo and direction indicator */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <motion.h1
            className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {t('app.shortTitle')}
          </motion.h1>
          <motion.div
            className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs md:text-sm font-medium"
            whileHover={{ scale: 1.05 }}
          >
            <ArrowLeftRight className="w-3 h-3 md:w-4 md:h-4" />
            <span>{directionText}</span>
          </motion.div>
        </div>

        {/* Right side: Desktop actions and mobile hamburger */}
        <div className={`flex items-center ${GAP.xs}`}>
          {/* Desktop: All buttons visible (≥768px) */}
          <div className={`hidden md:flex items-center ${GAP.xs}`}>
            {/* Session controls group */}
            <div className="flex items-center gap-1 px-1 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <motion.button
                onClick={onToggleDirection}
                className={`p-3 lg:px-3 lg:py-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center ${SPACING_PATTERNS.iconText}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={t('tooltips.toggleDirection')}
              >
                <ArrowLeftRight className="w-5 h-5" />
                <span className="hidden lg:inline text-sm">{t('direction.toggle')}</span>
              </motion.button>

              <motion.button
                onClick={onToggleShuffle}
                className={`p-3 lg:px-3 lg:py-3 rounded-lg transition-colors flex items-center ${SPACING_PATTERNS.iconText} ${
                  shuffleMode
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={t('tooltips.toggleShuffle')}
              >
                <Shuffle className="w-5 h-5" />
                <span className="hidden lg:inline text-sm">{t('tooltips.toggleShuffle').split(' (')[0]}</span>
              </motion.button>

              <motion.button
                onClick={onToggleAccent}
                className={`p-3 lg:px-3 lg:py-3 rounded-lg transition-colors flex items-center ${SPACING_PATTERNS.iconText} ${
                  accentSensitive
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={`${t('tooltips.toggleAccentCheck')} - ${accentLabel}`}
                aria-pressed={accentSensitive}
                aria-label={`${t('tooltips.toggleAccentCheck')} - ${accentLabel}`}
              >
                {accentSensitive ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                <span className="hidden lg:inline text-sm">{accentLabel}</span>
              </motion.button>

              <motion.button
                onClick={onRestart}
                className={`p-3 lg:px-3 lg:py-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center ${SPACING_PATTERNS.iconText}`}
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                title={t('tooltips.restartSession')}
                data-testid="restart-button"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="hidden lg:inline text-sm">{t('actions.restart')}</span>
              </motion.button>
            </div>

            {/* Settings group */}
            <div className="flex items-center gap-1 px-1 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <motion.button
                onClick={onToggleDarkMode}
                className={`p-3 lg:px-3 lg:py-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center ${SPACING_PATTERNS.iconText}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={t('tooltips.toggleDarkMode')}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span className="hidden lg:inline text-sm">
                  {darkMode ? t('labels.lightMode') : t('labels.darkMode')}
                </span>
              </motion.button>

              <LanguageSwitcher compact />
            </div>

            {/* User profile */}
            <div className="pl-2 border-l border-gray-300 dark:border-gray-600">
              <UserProfile />
            </div>
          </div>

          {/* Mobile: Hamburger menu (<768px) */}
          <div className={`flex md:hidden items-center ${GAP.xs}`}>
            {/* Keep user profile visible on mobile */}
            <UserProfile />

            <motion.button
              onClick={() => setDrawerOpen(true)}
              className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={t('labels.menu')}
            >
              <Menu className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        darkMode={darkMode}
        shuffleMode={shuffleMode}
        learningDirection={learningDirection}
        accentSensitive={accentSensitive}
        onToggleDarkMode={onToggleDarkMode}
        onToggleShuffle={onToggleShuffle}
        onToggleDirection={onToggleDirection}
        onToggleAccent={onToggleAccent}
        onRestart={onRestart}
      />
    </>
  );
};
