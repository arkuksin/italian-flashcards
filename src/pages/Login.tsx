import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoginForm } from '../components/auth/LoginForm'
import {
  FeatureHighlights,
  LearningScienceSection,
  SocialProofSection,
  SecondaryCtaSection,
  LandingFooter
} from '../components/landing/LandingSections'
import { CheckCircle2, Compass, Sparkles } from 'lucide-react'

const heroChecklistKeys = [
  'hero.checklist.ai',
  'hero.checklist.sessions',
  'hero.checklist.progress'
] as const

const heroPillKeys = [
  'hero.pills.studyPlans',
  'hero.pills.nativeAudio',
  'hero.pills.offline'
] as const

export const Login: React.FC = () => {
  const { t } = useTranslation('landing')
  const navigate = useNavigate()
  const location = useLocation()
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const authPanelRef = useRef<HTMLDivElement | null>(null)

  const scrollToAuth = useCallback(() => {
    if (authPanelRef.current) {
      authPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const handlePrimaryCta = () => {
    setAuthMode('signup')
    scrollToAuth()
  }

  const handleDemoCta = () => {
    navigate('/demo')
  }

  const handleSignInCta = () => {
    setAuthMode('login')
    scrollToAuth()
  }

  useEffect(() => {
    const maybeState = location.state as { mode?: 'login' | 'signup' } | null
    if (maybeState?.mode) {
      setAuthMode(maybeState.mode)
      if (maybeState.mode === 'signup') {
        scrollToAuth()
      }
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate, scrollToAuth])

  const floatingGradients = useMemo(
    () => [
      'absolute -top-10 -right-10 w-72 h-72 bg-purple-300/50 dark:bg-purple-500/30 blur-3xl rounded-full',
      'absolute -bottom-16 -left-10 w-80 h-80 bg-blue-200/70 dark:bg-blue-400/40 blur-3xl rounded-full',
      'absolute top-1/3 right-1/3 w-48 h-48 bg-violet-200/40 dark:bg-violet-500/20 blur-3xl rounded-full'
    ],
    []
  )

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white">
      <div className="absolute inset-0 pointer-events-none">
        {floatingGradients.map((className, index) => (
          <div key={className} className={className} style={{ animationDelay: `${index * 2}s` }} aria-hidden="true" />
        ))}
      </div>

      <main className="relative z-10 space-y-20 pb-16">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 flex flex-col gap-12 lg:gap-16 lg:flex-row items-stretch">
          <div className="flex-1 flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 dark:border-blue-500/40 bg-white/70 dark:bg-gray-900/70 px-4 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 w-fit">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {t('hero.badge')}
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold leading-tight text-gray-900 dark:text-white">
              {t('hero.headline')}
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              {t('hero.subheadline')}
            </p>
            <ul className="mt-8 space-y-4" aria-label={t('hero.ariaBenefits')}>
              {heroChecklistKeys.map((itemKey) => (
                <li key={itemKey} className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span>{t(itemKey)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="rounded-full bg-blue-600 text-white font-semibold px-6 py-3 shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('hero.primaryCta')}
              </button>
              <button
                type="button"
                onClick={handleDemoCta}
                className="rounded-full border border-gray-300 dark:border-gray-600 px-6 py-3 font-semibold text-gray-800 dark:text-gray-100 hover:border-blue-400 dark:hover:border-blue-400 transition"
              >
                {t('hero.secondaryCta')}
              </button>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
              {heroPillKeys.map((pillKey) => (
                <div key={pillKey} className="flex items-center gap-2">
                  <Compass className="w-4 h-4" aria-hidden="true" />
                  {t(pillKey)}
                </div>
              ))}
            </div>
          </div>

          <div
            ref={authPanelRef}
            id="auth-panel"
            className="flex-1 relative rounded-3xl bg-white/50 dark:bg-gray-900/60 backdrop-blur-xl border border-white/60 dark:border-gray-800 shadow-2xl p-6"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 to-purple-200/40 dark:from-gray-900/40 dark:to-purple-900/20 pointer-events-none" />
            <div className="relative">
              <div className="text-center mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{t('authPanel.kicker')}</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{t('authPanel.heading')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('authPanel.body')}</p>
              </div>
              <LoginForm variant="embedded" initialMode={authMode} />
            </div>
          </div>
        </section>

        <FeatureHighlights />
        <LearningScienceSection />
        <SocialProofSection />

        <SecondaryCtaSection onSignIn={handleSignInCta} onTryDemo={handleDemoCta} />
      </main>

      <LandingFooter />
    </div>
  )
}
