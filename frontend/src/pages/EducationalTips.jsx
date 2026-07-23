import { Lightbulb } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function EducationalTips() {
  const { t } = useLanguage()
  const items = t('tips.items')
  const list = Array.isArray(items) ? items : []

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-14 sm:py-20">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink text-balance">
        {t('tips.title')}
      </h1>
      <p className="mt-3 text-ink/65 max-w-xl">{t('tips.subtitle')}</p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {list.map((tip, i) => (
          <div key={i} className="rounded-3xl border border-ink/10 bg-paper-raised p-6">
            <div className="h-9 w-9 rounded-xl bg-amber-soft flex items-center justify-center mb-4">
              <Lightbulb size={16} className="text-ink/70" strokeWidth={2} />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink mb-2">{tip.title}</h3>
            <p className="text-sm text-ink/65 leading-relaxed">{tip.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
