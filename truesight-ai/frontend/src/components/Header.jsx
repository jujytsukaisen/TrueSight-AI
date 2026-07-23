import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, Languages } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

function LogoMark() {
  // A miniature signal reading — the same motif used for Trust Scores
  // throughout the product, doubling as the wordmark's icon.
  const heights = [40, 65, 30, 90, 55, 70, 45]
  return (
    <span className="flex items-end gap-[2px] h-5" aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-signal"
          style={{ height: `${h}%` }}
        />
      ))}
    </span>
  )
}

export default function Header() {
  const { t, toggleLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/analyze', label: t('nav.analyze') },
    { to: '/news', label: t('nav.news') },
    { to: '/tips', label: t('nav.tips') },
    { to: '/about', label: t('nav.about') },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <LogoMark />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            TrueSight <span className="text-signal">AI</span>
          </span>
        </NavLink>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-ink text-paper' : 'text-ink/70 hover:text-ink hover:bg-ink/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-2 text-sm font-medium text-ink/80 hover:border-ink/30 hover:text-ink transition-colors"
          >
            <Languages size={15} strokeWidth={2} />
            {t('header.languageToggle')}
          </button>
          <button
            onClick={() => navigate('/analyze')}
            className="rounded-full bg-signal px-4 py-2 text-sm font-semibold text-paper hover:bg-signal-dark transition-colors"
          >
            {t('header.cta')}
          </button>
        </div>

        <button
          className="lg:hidden rounded-full p-2 text-ink hover:bg-ink/5"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-ink/10 bg-paper px-5 py-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-ink text-paper' : 'text-ink/70'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={toggleLanguage}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-2.5 text-sm font-medium text-ink/80"
            >
              <Languages size={15} />
              {t('header.languageToggle')}
            </button>
            <button
              onClick={() => {
                setOpen(false)
                navigate('/analyze')
              }}
              className="flex-1 rounded-full bg-signal px-4 py-2.5 text-sm font-semibold text-paper"
            >
              {t('header.cta')}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
