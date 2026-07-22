import { Link } from 'react-router-dom'

const FEATURES = [
  { title: 'Talk, don’t type', body: 'Describe a sale or expense the way you’d tell a friend. Vanta turns it into a clean record.' },
  { title: 'Plain-English answers', body: 'No dashboards or charts. Ask "how am I doing?" and get a real sentence back.' },
  { title: 'Never guesses silently', body: 'If Vanta isn’t sure, it asks you — and remembers your correction next time.' },
  { title: 'Built for WhatsApp-first businesses', body: 'Works from your phone, with messy records — photos, screenshots, Excel — not spreadsheets.' },
]

export default function Landing() {
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">Vanta</span>
        <div className="row">
          <Link to="/signup" className="btn btn-primary btn-sm">
            Get started
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <h1>Bookkeeping for the way you actually run your business</h1>
        <p className="lede">
          Tell Vanta what happened in plain language. It keeps your books, tracks who owes you,
          and tells you how business is going — no spreadsheets, no charts, no jargon.
        </p>
        <Link to="/signup" className="btn btn-primary">
          Get started free
        </Link>

        <div className="landing-example">
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="pill accent">Example</span>
          </div>
          <div className="stack">
            <div className="bubble user" style={{ alignSelf: 'flex-end' }}>
              sold 20 loaves R400 cash
            </div>
            <div className="bubble vanta" style={{ alignSelf: 'flex-start' }}>
              Got it — money in of R400 for Sales. Look right?
            </div>
          </div>
        </div>
      </section>

      <section className="landing-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <h3 style={{ fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
            <p className="muted" style={{ fontSize: 14 }}>
              {f.body}
            </p>
          </div>
        ))}
      </section>
    </div>
  )
}
