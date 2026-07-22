import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppState'
import { Field } from '../components/ui'

/**
 * Mock sign-in only. Real phone-OTP auth exists in the codebase but is
 * disabled behind a flag (parked on SMS provider issues) — this screen
 * does not call it and must not be wired up without being asked.
 */
export default function SignIn() {
  const { signIn } = useApp()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      signIn()
      navigate('/app/chat')
    }, 300)
  }

  return (
    <div className="page" style={{ maxWidth: 420 }}>
      <Link to="/" className="brand" style={{ display: 'inline-block', marginBottom: 32 }}>
        Vanta
      </Link>
      <h1 className="page-title">Sign in</h1>
      <p className="page-sub">
        Phone-based sign-in is still being set up — this is a placeholder screen for now.
      </p>

      <form className="stack" onSubmit={onSubmit}>
        <Field label="Cellphone number">
          <input type="tel" required placeholder="082 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Continuing…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
