import { Link } from 'react-router-dom'
import { useApp } from '../state/AppState'
import { PageHeader } from '../components/ui'

const LINKS = [
  { to: '/app/assets', label: 'Assets' },
  { to: '/app/compliance', label: 'Compliance corner' },
  { to: '/app/profile', label: 'Business profile' },
  { to: '/app/help', label: 'Help' },
]

export default function More() {
  const { signOut } = useApp()
  return (
    <div className="page">
      <PageHeader title="More" />
      <div className="stack">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="card row" style={{ justifyContent: 'space-between' }}>
            <span>{l.label}</span>
            <span className="faint">›</span>
          </Link>
        ))}
        <button className="btn btn-ghost" onClick={signOut} style={{ marginTop: 12 }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
