import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BrainCircuit, BarChart3, Smartphone, Waves, Quote, Star, LucideIcon } from 'lucide-react'
import { changeLanguage, supportedLanguages } from '../../lib/i18n'

type FeatureCardConfig = {
  titleKey: string
  descriptionKey: string
  Icon: LucideIcon
  accent: string
}

const featureCardContent: FeatureCardConfig[] = [
  {
    titleKey: 'features.cards.0.title',
    descriptionKey: 'features.cards.0.description',
    Icon: BrainCircuit,
    accent: 'from-blue-500/20 to-violet-500/30'
  },
  {
    titleKey: 'features.cards.1.title',
    descriptionKey: 'features.cards.1.description',
    Icon: BarChart3,
    accent: 'from-purple-500/20 to-rose-500/30'
  },
  {
    titleKey: 'features.cards.2.title',
    descriptionKey: 'features.cards.2.description',
    Icon: Smartphone,
    accent: 'from-sky-500/20 to-emerald-500/30'
  }
]

const learningStatKeys = [
  { labelKey: 'learning.stats.0.label', valueKey: 'learning.stats.0.value' },
  { labelKey: 'learning.stats.1.label', valueKey: 'learning.stats.1.value' },
  { labelKey: 'learning.stats.2.label', valueKey: 'learning.stats.2.value' }
]

const learningPhaseKeys = [
  { titleKey: 'learning.timeline.0.title', descriptionKey: 'learning.timeline.0.description' },
  { titleKey: 'learning.timeline.1.title', descriptionKey: 'learning.timeline.1.description' },
  { titleKey: 'learning.timeline.2.title', descriptionKey: 'learning.timeline.2.description' }
]

const testimonialKeys = [
  { quoteKey: 'social.testimonials.0.quote', authorKey: 'social.testimonials.0.author' },
  { quoteKey: 'social.testimonials.1.quote', authorKey: 'social.testimonials.1.author' }
]

const trustBadgeKeys = ['social.badges.0', 'social.badges.1', 'social.badges.2']

interface SecondaryCtaSectionProps {
  onSignIn: () => void
  onTryDemo: () => void
}

export const FeatureHighlights: React.FC = () => {
  const { t } = useTranslation('landing')

  return (
    <section id="features" className="py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{t('features.kicker')}</p>
        <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{t('features.heading')}</h2>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">{t('features.description')}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureCardContent.map(({ titleKey, descriptionKey, Icon, accent }) => (
            <div
              key={titleKey}
              className="group relative rounded-2xl border border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg shadow-lg p-6"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative flex flex-col gap-4">
                <span className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-300">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </span>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t(titleKey)}</h3>
                <p className="text-gray-600 dark:text-gray-300">{t(descriptionKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export const LearningScienceSection: React.FC = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-12 lg:grid-cols-[2fr,1fr] items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">{t('learning.kicker')}</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{t('learning.heading')}</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{t('learning.body')}</p>
          <dl className="mt-8 grid gap-6 sm:grid-cols-3" aria-label={t('learning.statsAria')}>
            {learningStatKeys.map(({ labelKey, valueKey }) => (
              <div key={labelKey} className="rounded-2xl border border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg p-5 text-center">
                <dt className="text-sm text-gray-500 dark:text-gray-400">{t(labelKey)}</dt>
                <dd className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{t(valueKey)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div
          className="rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/30 border border-blue-500/30 dark:border-purple-500/40 p-6"
          aria-label={t('learning.timelineAria')}
        >
          <p className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <Waves className="w-4 h-4" aria-hidden="true" /> {t('learning.timelineBadge')}
          </p>
          <ul className="mt-6 space-y-4" role="list">
            {learningPhaseKeys.map((phase, index) => (
              <li key={phase.titleKey} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="w-8 h-8 rounded-full border border-white/60 flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </span>
                  {index < learningPhaseKeys.length - 1 && <span className="flex-1 w-px bg-white/40 mt-1" />}
                </div>
                <div className="text-white">
                  <h3 className="font-semibold">{t(phase.titleKey)}</h3>
                  <p className="text-sm text-white/80">{t(phase.descriptionKey)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export const SocialProofSection: React.FC = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="rounded-3xl bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-white/60 dark:border-gray-800 p-8 shadow-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">{t('social.kicker')}</p>
            <div className="mt-6 space-y-6" aria-live="polite">
              {testimonialKeys.map(({ quoteKey, authorKey }) => (
                <blockquote key={authorKey} className="space-y-3">
                  <Quote className="w-8 h-8 text-blue-500" aria-hidden="true" />
                  <p className="text-xl text-gray-900 dark:text-white">{t(quoteKey)}</p>
                  <cite className="not-italic text-sm text-gray-600 dark:text-gray-300">{t(authorKey)}</cite>
                </blockquote>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white shadow-2xl">
            <p className="text-sm font-semibold tracking-[0.3em] uppercase text-white/80">{t('social.trustTitle')}</p>
            <ul className="mt-6 space-y-4">
              {trustBadgeKeys.map((badgeKey) => (
                <li key={badgeKey} className="flex items-center gap-3 text-lg">
                  <Star className="w-5 h-5 text-yellow-300" aria-hidden="true" />
                  <span>{t(badgeKey)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export const SecondaryCtaSection: React.FC<SecondaryCtaSectionProps> = ({ onSignIn, onTryDemo }) => {
  const { t } = useTranslation('landing')

  return (
    <section className="py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-violet-700 p-10 text-white shadow-2xl">
          <div className="absolute inset-y-0 -right-40 w-80 bg-white/10 blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">{t('ctaBand.kicker')}</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight">{t('ctaBand.heading')}</h2>
              <p className="mt-2 text-white/80 max-w-2xl">{t('ctaBand.body')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onSignIn}
                className="px-5 py-3 rounded-full bg-white text-blue-700 font-semibold shadow-lg hover:translate-y-0.5 transition"
              >
                {t('ctaBand.primaryCta')}
              </button>
              <button
                type="button"
                onClick={onTryDemo}
                className="px-5 py-3 rounded-full border border-white/70 text-white font-semibold hover:bg-white/10 transition"
              >
                {t('ctaBand.secondaryCta')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const LandingFooter: React.FC = () => {
  const { t, i18n } = useTranslation('landing')

  const normalizedLanguage =
    supportedLanguages.find((lang) => i18n.language?.startsWith(lang.code))?.code ?? 'en'

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value
    try {
      await changeLanguage(nextLanguage)
    } catch (error) {
      console.error('Failed to switch language', error)
    }
  }

  return (
    <footer className="border-t border-white/40 dark:border-gray-800 bg-white/70 dark:bg-gray-950/60 backdrop-blur-lg py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-600 dark:text-gray-300">
        <div className="text-center md:text-left">
          <p className="font-semibold text-gray-900 dark:text-white">{t('footer.tagline')}</p>
          <p className="text-gray-500 dark:text-gray-400">{t('footer.powered')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">
            {t('footer.links.privacy')}
          </Link>
          <a href="https://docs.italianflashcards.app/imprint" className="hover:text-blue-600 dark:hover:text-blue-400">
            {t('footer.links.imprint')}
          </a>
          <a href="mailto:hello@italianflashcards.app" className="hover:text-blue-600 dark:hover:text-blue-400">
            {t('footer.links.contact')}
          </a>
          <a href="https://status.italianflashcards.app" className="hover:text-blue-600 dark:hover:text-blue-400">
            {t('footer.links.status')}
          </a>
          <label className="flex items-center gap-2 text-gray-500 dark:text-gray-300">
            <span>{t('footer.languageLabel')}</span>
            <select
              aria-label={t('footer.languageLabel')}
              className="bg-transparent border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={normalizedLanguage}
              onChange={handleLanguageChange}
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </footer>
  )
}
