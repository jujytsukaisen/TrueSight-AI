import { useNavigate } from 'react-router-dom'
import { ArrowRight, Gauge, Tags, Sparkles, Languages } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import SignalStrip from '../components/SignalStrip'

function HeroDemo() {
  const { t, isRtl } = useLanguage()
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-3xl border border-alert/25 bg-white/60 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-alert">
            {t('home.heroBeforeLabel')}
          </span>
          <span className="font-mono text-2xl font-semibold text-alert">18</span>
        </div>
        <p className="text-sm leading-relaxed text-ink/80" dir={isRtl ? 'rtl' : 'ltr'}>
          {t('home.heroBefore')}
        </p>
        <SignalStrip score={14} height={36} barCount={20} className="mt-auto" />
      </div>

      <div className="rounded-3xl border border-signal/25 bg-signal-soft/70 p-6 flex flex-col gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-signal-dark">
          {t('home.heroAfterLabel')}
        </span>
        <p className="text-sm leading-relaxed text-ink/85" dir={isRtl ? 'rtl' : 'ltr'}>
          {t('home.heroAfter')}
        </p>
        <SignalStrip score={92} height={36} barCount={20} className="mt-auto" />
      </div>
    </div>
  )
}

export default function Home() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const steps = ['step1', 'step2', 'step3', 'step4']

  const stats = [
    { icon: Gauge, title: t('home.stat1Title'), body: t('home.stat1Body') },
    { icon: Tags, title: t('home.stat2Title'), body: t('home.stat2Body') },
    { icon: Sparkles, title: t('home.stat3Title'), body: t('home.stat3Body') },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-[1.1fr,1fr] gap-12 items-center">
          <div>
            <span className="inline-block rounded-full bg-ink text-paper text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5">
              {t('home.eyebrow')}
            </span>
            <h1 className="font-display mt-6 text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.08] tracking-tight text-ink text-balance">
              {t('meta.tagline')}
            </h1>
            <p className="mt-6 max-w-lg text-lg text-ink/70 leading-relaxed">
              {t('home.thesisBody')}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/analyze')}
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-paper hover:bg-signal-dark transition-colors"
              >
                {t('home.cta')}
                <ArrowRight size={16} className="rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3.5 text-sm font-semibold text-ink/80 hover:border-ink/40 hover:text-ink transition-colors"
              >
                {t('home.ctaSecondary')}
              </a>
            </div>
          </div>
          <HeroDemo />
        </div>
      </section>

      {/* Thesis */}
      <section className="border-y border-ink/10 bg-paper-raised">
        <div className="mx-auto max-w-4xl px-5 sm:px-8 py-16 sm:py-20 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-signal-dark">
            {t('home.thesisEyebrow')}
          </span>
          <h2 className="font-display mt-4 text-3xl sm:text-4xl font-semibold leading-tight text-ink text-balance">
            {t('home.thesisTitle')}
          </h2>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-xl mb-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">
            {t('home.howItWorksEyebrow')}
          </span>
          <h2 className="font-display mt-3 text-3xl sm:text-4xl font-semibold text-ink text-balance">
            {t('home.howItWorksTitle')}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-ink/10 rounded-3xl overflow-hidden border border-ink/10">
          {steps.map((step) => (
            <div key={step} className="bg-paper p-7 flex flex-col gap-3">
              <span className="font-display text-2xl font-semibold text-signal">
                {t(`home.${step}Title`)}
              </span>
              <p className="text-sm text-ink/65 leading-relaxed">{t(`home.${step}Body`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-ink/10 bg-paper-raised">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-28">
          <div className="max-w-xl mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">
              {t('home.statsEyebrow')}
            </span>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {stats.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-3xl bg-paper border border-ink/10 p-7">
                <div className="h-10 w-10 rounded-2xl bg-signal-soft flex items-center justify-center mb-5">
                  <Icon size={19} className="text-signal-dark" strokeWidth={2} />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink mb-2">{title}</h3>
                <p className="text-sm text-ink/65 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bilingual note + final CTA */}
      <section className="mx-auto max-w-4xl px-5 sm:px-8 py-20 sm:py-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/70 mb-8">
          <Languages size={15} />
          {t('home.bilingualNote')}
        </div>
        <div>
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-base font-semibold text-paper hover:bg-signal-dark transition-colors"
          >
            {t('home.cta')}
            <ArrowRight size={17} className="rtl:rotate-180" />
          </button>
        </div>
      </section>
    </div>
  )
}
