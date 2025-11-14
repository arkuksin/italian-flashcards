import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { Container } from '../components/layout'

interface DemoCardContent {
  term: string
  translation: string
  context: string
  tip: string
}

interface DemoTimelineStep {
  title: string
  description: string
}

export const DemoDeck: React.FC = () => {
  const { t } = useTranslation('landing')
  const navigate = useNavigate()

  const cards = useMemo(
    () => (t('demo.cards', { returnObjects: true }) as DemoCardContent[]) ?? [],
    [t]
  )
  const highlights = useMemo(() => (t('demo.highlights', { returnObjects: true }) as string[]) ?? [], [t])
  const timeline = useMemo(
    () => (t('demo.timeline', { returnObjects: true }) as DemoTimelineStep[]) ?? [],
    [t]
  )

  const [activeIndex, setActiveIndex] = useState(0)
  const cardCount = cards.length
  const currentCard = cardCount > 0 ? cards[activeIndex] : undefined

  const handlePrev = () => {
    if (!cardCount) return
    setActiveIndex((prev) => (prev - 1 + cardCount) % cardCount)
  }

  const handleNext = () => {
    if (!cardCount) return
    setActiveIndex((prev) => (prev + 1) % cardCount)
  }

  const handleBackToLanding = () => navigate('/login')
  const handleSignUp = () => navigate('/login', { state: { mode: 'signup' } })

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 -right-20 w-96 h-96 bg-purple-300/40 dark:bg-purple-600/30 blur-3xl rounded-full" />
        <div className="absolute bottom-0 -left-24 w-[28rem] h-[28rem] bg-blue-200/60 dark:bg-blue-500/30 blur-3xl rounded-full" />
      </div>

      <main className="relative z-10 py-12 sm:py-16">
        <Container width="dashboard">
          <button
            type="button"
            onClick={handleBackToLanding}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-300 hover:text-blue-500 transition"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('demo.backLink')}
          </button>

          <div className="mt-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 dark:border-blue-500/40 bg-white/70 dark:bg-gray-900/70 px-4 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 w-fit">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {t('demo.hero.kicker')}
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-gray-900 dark:text-white">{t('demo.hero.heading')}</h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{t('demo.hero.body')}</p>
          </div>

          <section className="mt-12 grid gap-10 lg:grid-cols-[1.4fr,1fr]">
            <div className="rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/60 dark:border-gray-800 shadow-2xl p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{t('demo.cardsTitle')}</p>
                  <p className="text-gray-600 dark:text-gray-300">{t('demo.cardsCaption')}</p>
                </div>
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {cardCount > 0 && (
                    <span>
                      {activeIndex + 1}/{cardCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-8 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50/80 dark:from-gray-900 dark:to-gray-800 p-6 shadow-inner min-h-[240px]" aria-live="polite">
                {currentCard ? (
                  <>
                    <p className="text-sm uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">{t('demo.cardsTitle')}</p>
                    <h2 className="mt-3 text-4xl font-bold text-gray-900 dark:text-white">{currentCard.term}</h2>
                    <p className="text-lg text-blue-700 dark:text-blue-300">{currentCard.translation}</p>
                    <div className="mt-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                        {t('demo.labels.context')}
                      </p>
                      <p className="text-base text-gray-700 dark:text-gray-200">{currentCard.context}</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                        {t('demo.labels.tip')}
                      </p>
                      <p className="text-base text-gray-700 dark:text-gray-200">{currentCard.tip}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">{t('demo.cardsCaption')}</p>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!cardCount}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-300 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  {t('demo.cardNav.previous')}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!cardCount}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-300 disabled:opacity-50"
                >
                  {t('demo.cardNav.next')}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 text-white p-8 shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">{t('demo.highlightsTitle')}</p>
              <ul className="mt-6 space-y-4">
                {highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" aria-hidden="true" />
                    <span className="text-white/90">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-12 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/60 dark:border-gray-800 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{t('demo.timelineTitle')}</p>
            <ol className="mt-6 grid gap-6 sm:grid-cols-3">
              {timeline.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 font-semibold">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{step.description}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleBackToLanding}
                className="px-5 py-3 rounded-full border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:border-blue-400 dark:hover:border-blue-300"
              >
                {t('demo.backLink')}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                className="px-5 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-500 transition"
              >
                {t('demo.ctaPrimary')}
              </button>
            </div>
          </section>
        </Container>
      </main>
    </div>
  )
}
