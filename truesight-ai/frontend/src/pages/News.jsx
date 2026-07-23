import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { getTrustBand, bandStyles } from '../lib/trust'
import SignalStrip from '../components/SignalStrip'
import ResultsPanel from '../components/ResultsPanel'
import { exampleAnalyses } from '../data/exampleAnalyses'

function NewsCard({ item }) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const { result, original } = item
  const band = getTrustBand(result.trust_score)
  const style = bandStyles[band]
  const contentTypeLabel = {
    news: t('results.contentTypeNews'),
    advertisement: t('results.contentTypeAdvertisement'),
    social_post: t('results.contentTypeSocialPost'),
    other: t('results.contentTypeOther'),
  }[result.content_type]

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper-raised overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-5 p-6 text-start"
      >
        <div className={`shrink-0 rounded-2xl ${style.soft} px-3.5 py-2 text-center`}>
          <div className="font-mono text-xl font-semibold text-ink">{result.trust_score}</div>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/45">
            {contentTypeLabel}
          </span>
          <p className="mt-1 text-sm text-ink/75 line-clamp-2" dir={result.language === 'ar' ? 'rtl' : 'ltr'}>
            {original}
          </p>
        </div>
        <SignalStrip score={result.trust_score} height={32} barCount={14} className="hidden sm:flex shrink-0" />
        <ChevronDown
          size={18}
          className={`shrink-0 text-ink/40 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && (
        <div className="border-t border-ink/10 p-6 pt-7">
          <ResultsPanel result={result} />
        </div>
      )}
    </div>
  )
}

export default function News() {
  const { t } = useLanguage()
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-14 sm:py-20">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink text-balance">
        {t('news.title')}
      </h1>
      <p className="mt-3 text-ink/65 max-w-xl">{t('news.subtitle')}</p>

      <div className="mt-12 space-y-4">
        {exampleAnalyses.map((item, i) => (
          <NewsCard key={i} item={item} />
        ))}
      </div>
    </div>
  )
}
