import { useLanguage } from '../i18n/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="border-t border-ink/10 mt-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-display text-base text-ink/80">{t('footer.tagline')}</p>
        <p className="text-xs uppercase tracking-wider text-ink/40">{t('footer.builtFor')}</p>
      </div>
    </footer>
  )
}
