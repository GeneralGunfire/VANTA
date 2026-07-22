import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppState'
import type { Language } from '../types'

const TABS = [
  { to: '/app/chat', label: 'Chat' },
  { to: '/app/ledger', label: 'Ledger' },
  { to: '/app/corrections', label: 'Correction history' },
  { to: '/app/help', label: 'Help' },
]

const LANGS: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'zu', label: 'ZU' },
  { code: 'af', label: 'AF' },
]

export default function Shell() {
  const { needsReviewCount, language, setLanguage, signOut } = useApp()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/app/chat" className="brand">
          Vanta
        </NavLink>
        <nav className="nav">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to}>
              {t.label}
              {t.to === '/app/ledger' && needsReviewCount > 0 && (
                <span className="review-badge">{needsReviewCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="row">
          {/* Visual-only placeholder — no translation is applied yet. */}
          <div className="lang-toggle" role="group" aria-label="Language (not yet translated)">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                className={language === l.code ? 'active' : ''}
                onClick={() => setLanguage(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm menu-btn" onClick={() => setMenuOpen((v) => !v)}>
            Menu
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              signOut()
              navigate('/')
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="nav" style={{ flexDirection: 'column', padding: '10px 20px', borderBottom: '1px solid var(--line)' }}>
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} onClick={() => setMenuOpen(false)}>
              {t.label}
              {t.to === '/app/ledger' && needsReviewCount > 0 && (
                <span className="review-badge">{needsReviewCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
      )}

      <Outlet />
    </div>
  )
}
