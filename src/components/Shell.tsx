import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppState'

const TABS = [
  { to: '/app/chat', label: 'Chat' },
  { to: '/app/ledger', label: 'Ledger' },
  { to: '/app/snapshot', label: 'Snapshot' },
  { to: '/app/invoices', label: 'Invoices & debts' },
  { to: '/app/assets', label: 'Assets' },
  { to: '/app/compliance', label: 'Compliance' },
  { to: '/app/help', label: 'Help' },
]

const MOBILE_TABS = [
  { to: '/app/chat', label: 'Chat' },
  { to: '/app/ledger', label: 'Ledger' },
  { to: '/app/snapshot', label: 'Snapshot' },
  { to: '/app/invoices', label: 'Invoices' },
  { to: '/app/more', label: 'More' },
]

export default function Shell() {
  const { profile, signOut } = useApp()
  const navigate = useNavigate()
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
            </NavLink>
          ))}
        </nav>
        <div className="row">
          <NavLink to="/app/profile" className="btn btn-quiet btn-sm" title="Business profile">
            {profile.businessName || 'Profile'}
          </NavLink>
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
      <Outlet />
      <nav className="bottom-nav">
        {MOBILE_TABS.map((t) => (
          <NavLink key={t.to} to={t.to}>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
