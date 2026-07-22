import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">Vanta</span>
        <Link to="/signin" className="btn btn-primary btn-sm">
          Get started
        </Link>
      </header>

      <section className="landing-hero">
        <h1>Bookkeeping for the way you actually run your business</h1>
        <p className="lede">
          Tell Vanta what happened in plain language. It keeps your books and tells you how business is
          going — no spreadsheets, no charts, no jargon.
        </p>
        <Link to="/signin" className="btn btn-primary">
          Get started
        </Link>
      </section>
    </div>
  )
}
