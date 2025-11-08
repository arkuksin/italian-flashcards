import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Language resources - dynamically imported
const resources = {
  en: {
    common: () => import('../../public/locales/en/common.json'),
    auth: () => import('../../public/locales/en/auth.json'),
    learning: () => import('../../public/locales/en/learning.json'),
    dashboard: () => import('../../public/locales/en/dashboard.json'),
    settings: () => import('../../public/locales/en/settings.json'),
    landing: () => import('../../public/locales/en/landing.json'),
  },
  ru: {
    common: () => import('../../public/locales/ru/common.json'),
    auth: () => import('../../public/locales/ru/auth.json'),
    learning: () => import('../../public/locales/ru/learning.json'),
    dashboard: () => import('../../public/locales/ru/dashboard.json'),
    settings: () => import('../../public/locales/ru/settings.json'),
    landing: () => import('../../public/locales/ru/landing.json'),
  },
  it: {
    common: () => import('../../public/locales/it/common.json'),
    auth: () => import('../../public/locales/it/auth.json'),
    learning: () => import('../../public/locales/it/learning.json'),
    dashboard: () => import('../../public/locales/it/dashboard.json'),
    settings: () => import('../../public/locales/it/settings.json'),
    landing: () => import('../../public/locales/it/landing.json'),
  },
  de: {
    common: () => import('../../public/locales/de/common.json'),
    auth: () => import('../../public/locales/de/auth.json'),
    learning: () => import('../../public/locales/de/learning.json'),
    dashboard: () => import('../../public/locales/de/dashboard.json'),
    settings: () => import('../../public/locales/de/settings.json'),
    landing: () => import('../../public/locales/de/landing.json'),
  },
};

// Load all translations for a language
async function loadLanguageResources(language: string) {
  const langResources = resources[language as keyof typeof resources];
  if (!langResources) return {};

  const loadedResources: Record<string, unknown> = {};

  for (const [namespace, loader] of Object.entries(langResources)) {
    try {
      const mod = await loader();
      const messages = (mod as { default?: unknown }).default ?? mod;
      loadedResources[namespace] = messages;
    } catch (error) {
      console.error(`Failed to load ${language}/${namespace}:`, error);
    }
  }

  return loadedResources;
}

// Initialize i18next
export async function initI18n() {
  // Preload English as fallback
  const enResources = await loadLanguageResources('en');

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: enResources,
      },
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: ['common', 'auth', 'learning', 'dashboard', 'settings', 'landing'],

      // Language detection options
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },

      interpolation: {
        escapeValue: false, // React already escapes values
      },

      react: {
        useSuspense: false,
      },
    });

  // Load resources for detected language (if not English)
  const detectedLang = i18n.language;
  if (detectedLang && detectedLang !== 'en' && detectedLang in resources) {
    const langResources = await loadLanguageResources(detectedLang);
    Object.entries(langResources).forEach(([namespace, resource]) => {
      i18n.addResourceBundle(detectedLang, namespace, resource, true, true);
    });
  }

  return i18n;
}

// Function to change language dynamically
export async function changeLanguage(language: string) {
  // Load resources if not already loaded
  if (!i18n.hasResourceBundle(language, 'common')) {
    const langResources = await loadLanguageResources(language);
    Object.entries(langResources).forEach(([namespace, resource]) => {
      i18n.addResourceBundle(language, namespace, resource, true, true);
    });
  }

  await i18n.changeLanguage(language);
  localStorage.setItem('i18nextLng', language);

  // Update HTML lang attribute for accessibility
  document.documentElement.lang = language;
}

// Supported languages
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
] as const;

export type SupportedLanguage = typeof supportedLanguages[number]['code'];

export default i18n;
