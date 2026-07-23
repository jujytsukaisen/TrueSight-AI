import { useLanguage } from '../i18n/LanguageContext'

export default function About() {
  const { t } = useLanguage()
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-14 sm:py-20">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink text-balance">
        {t('about.title')}
      </h1>
      <p className="mt-3 text-ink/65">{t('about.subtitle')}</p>

      <div className="mt-12 space-y-10">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-3">
            {t('about.missionTitle')}
          </h2>
          <p className="text-ink/70 leading-relaxed">{t('about.missionBody')}</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-3">
            {t('about.teamTitle')}
          </h2>
          <p className="text-ink/70 leading-relaxed">{t('about.teamBody')}</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-3">
            {t('about.techTitle')}
          </h2>
          <p className="text-ink/70 leading-relaxed">{t('about.techBody')}</p>
        </section>
      </div>
    </div>
  )
}
