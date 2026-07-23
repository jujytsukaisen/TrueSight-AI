import { useLanguage } from '../i18n/LanguageContext'
import { severityStyles } from '../lib/trust'

function categoryLabel(category) {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function IndicatorCard({ indicator }) {
  const { t } = useLanguage()
  const severityLabel = {
    low: t('results.severityLow'),
    medium: t('results.severityMedium'),
    high: t('results.severityHigh'),
  }[indicator.severity]

  return (
    <div className="rounded-2xl border border-ink/10 bg-paper-raised p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-sm font-semibold text-ink">{categoryLabel(indicator.category)}</span>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityStyles[indicator.severity]}`}
        >
          {severityLabel}
        </span>
      </div>
      <p className="text-sm text-ink/70 leading-relaxed">{indicator.description}</p>
    </div>
  )
}
