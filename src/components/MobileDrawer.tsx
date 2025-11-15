import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Shuffle, RotateCcw, ArrowLeftRight, Check, X as XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LearningDirection } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';
import { VERTICAL_SPACING, GAP, MARGIN_BOTTOM } from '../constants/spacing';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
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
  const directionText = learningDirection === 'ru-it' ? t('direction.ruToIt') : t('direction.itToRu');
  const accentLabel = accentSensitive ? t('labels.accentCheckOn') : t('labels.accentCheckOff');

  const menuItems = [
    {
      id: 'direction',
      icon: ArrowLeftRight,
      label: t('tooltips.toggleDirection'),
      sublabel: directionText,
      onClick: onToggleDirection,
      isActive: false,
    },
    {
      id: 'shuffle',
      icon: Shuffle,
      label: t('tooltips.toggleShuffle'),
      sublabel: shuffleMode ? t('labels.on') : t('labels.off'),
      onClick: onToggleShuffle,
      isActive: shuffleMode,
    },
    {
      id: 'accent',
      icon: accentSensitive ? Check : XIcon,
      label: t('tooltips.toggleAccentCheck'),
      sublabel: accentLabel,
      onClick: onToggleAccent,
      isActive: accentSensitive,
    },
    {
      id: 'restart',
      icon: RotateCcw,
      label: t('tooltips.restartSession'),
      onClick: onRestart,
      isActive: false,
    },
    {
      id: 'darkMode',
      icon: darkMode ? Sun : Moon,
      label: t('tooltips.toggleDarkMode'),
      sublabel: darkMode ? t('labels.lightMode') : t('labels.darkMode'),
      onClick: onToggleDarkMode,
      isActive: false,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl z-[70] overflow-y-auto md:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('labels.menu')}
              </h2>
              <button
                onClick={onClose}
                className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={t('labels.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className={`p-4 ${VERTICAL_SPACING.xs}`}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.onClick();
                      // Don't close drawer immediately to allow seeing state change
                    }}
                    className={`w-full flex items-center ${GAP.md} p-4 rounded-lg transition-colors ${
                      item.isActive
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={{ minHeight: '60px' }} // Meets 44px accessibility guideline with padding
                  >
                    <div className="flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.label}</div>
                      {item.sublabel && (
                        <div className={`text-sm ${
                          item.isActive ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Language Switcher */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${MARGIN_BOTTOM.xs} px-1`}>
                  {t('labels.language')}
                </div>
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
