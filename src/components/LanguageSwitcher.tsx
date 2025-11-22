import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, SupportedLanguage } from '../lib/i18n';
import { useLanguagePreference } from '../hooks/useLanguagePreference';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = i18n.language as SupportedLanguage;
  const { saveLanguagePreference } = useLanguagePreference();

  const handleLanguageChange = async (langCode: string) => {
    try {
      await saveLanguagePreference(langCode as SupportedLanguage);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const currentLangName = supportedLanguages.find(
    (lang) => lang.code === currentLanguage
  )?.nativeName || 'EN';
  const currentLangCode = supportedLanguages.find(
    (lang) => lang.code === currentLanguage
  )?.code?.toUpperCase?.() || 'EN';

  if (compact) {
    return (
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Change language"
          aria-label="Change language"
          aria-expanded={isOpen}
        >
          <Globe className="w-5 h-5" />
          <span className="text-sm font-semibold">{currentLangCode}</span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />

              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
              >
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      currentLanguage === lang.code
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFlagEmoji(lang.code)}</span>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {lang.nativeName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {lang.name}
                        </div>
                      </div>
                    </div>
                    {currentLanguage === lang.code && (
                      <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full version (not compact)
  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Globe className="w-5 h-5" />
        <span className="font-medium">{currentLangName}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            >
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-3 py-2">
                  Select Language
                </h3>
              </div>

              <div className="p-2">
                {supportedLanguages.map((lang) => (
                  <motion.button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    whileHover={{ x: 4 }}
                    className={`w-full px-4 py-3 flex items-center justify-between rounded-lg transition-colors ${
                      currentLanguage === lang.code
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getFlagEmoji(lang.code)}</span>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {lang.nativeName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {lang.name}
                        </div>
                      </div>
                    </div>
                    {currentLanguage === lang.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <Check className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to get flag emoji for language code
function getFlagEmoji(langCode: string): string {
  const flags: Record<string, string> = {
    en: '🇬🇧', // UK flag for English
    ru: '🇷🇺', // Russian flag
    it: '🇮🇹', // Italian flag
    de: '🇩🇪', // German flag
  };
  return flags[langCode] || '🌐';
}
