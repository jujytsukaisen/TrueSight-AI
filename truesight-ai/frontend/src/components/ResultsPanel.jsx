import { useLanguage } from '../i18n/LanguageContext'
import { getTrustBand, bandStyles } from '../lib/trust'
import SignalStrip from './SignalStrip'
import IndicatorCard from './IndicatorCard'

export default function ResultsPanel({ result }) {
  const { t } = useLanguage()
  const band = getTrustBand(result.trust_score)
  const style = bandStyles[band]
  const bandLabel = {
    high: t('results.bandHigh'),
    mid: t('results.bandMid'),
    low: t('results.bandLow'),
  }[band]
  const contentTypeLabel = {
    news: t('results.contentTypeNews'),
    advertisement: t('results.contentTypeAdvertisement'),
    social_post: t('results.contentTypeSocialPost'),
    other: t('results.contentTypeOther'),
  }[result.content_type]

  return (
    <div className="space-y-6 animate-rise">
      <div className={`rounded-3xl border border-ink/10 ${style.soft} p-6 sm:p-8`}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">
              {contentTypeLabel}
            </span>
            <div className="mt-1.5 flex items-baseline gap-3">
              <span className="font-mono text-5xl font-semibold text-ink">
                {result.trust_score}
              </span>
              <span className={`text-sm font-bold uppercase tracking-wide ${style.label}`}>
                {bandLabel}
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm text-ink/70 leading-relaxed">
              {result.score_reasoning}
            </p>
          </div>
          <SignalStrip score={result.trust_score} height={70} barCount={22} className="shrink-0" />
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl font-semibold text-ink mb-3">
          {t('results.indicatorsTitle')}
        </h3>
        {result.indicators.length === 0 ? (
          <p className="text-sm text-ink/60 italic">{t('results.indicatorsEmpty')}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {result.indicators.map((ind, i) => (
              <IndicatorCard key={i} indicator={ind} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-signal/25 bg-signal-soft p-6">
        <h3 className="font-display text-lg font-semibold text-signal-dark mb-2">
          {t('results.neutralTitle')}
        </h3>
        <p className="text-ink/85 leading-relaxed">{result.neutral_rephrasing}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-3">
            {t('results.sourcesTitle')}
          </h4>
          <ul className="space-y-1.5 text-sm text-ink/80 list-disc ps-4">
            {result.suggested_sources.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber/30 bg-amber-soft/50 p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-3">
            {t('results.tipTitle')}
          </h4>
          <p className="text-sm text-ink/80 leading-relaxed">{result.literacy_tip}</p>
        </div>
      </div>
    </div>
  )
}
