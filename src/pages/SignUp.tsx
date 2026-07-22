import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppState'
import { Field } from '../components/ui'

/** Mock auth only — no Supabase call. Any input signs the user in locally. */
export default function SignUp() {
  const { signIn } = useApp()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      signIn()
      navigate('/onboarding')
    }, 400)
  }

  return (
    <div className="onboard-wrap">
      <Link to="/" className="brand" style={{ display: 'inline-block', marginBottom: 32 }}>
        Vanta
      </Link>
      <h1 className="page-title">Create your account</h1>
      <p className="page-sub">Just your phone number to start. No card, no fees to sign up.</p>

      <form className="stack" onSubmit={onSubmit}>
        <Field label="Cellphone number" hint="We'll send a one-time code to this number">
          <input
            type="tel"
            required
            placeholder="082 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Sending code…' : 'Continue'}
        </button>
      </form>

      <p className="faint" style={{ marginTop: 20 }}>
        Already have an account?{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            signIn()
            navigate('/onboarding')
          }}
        >
          Sign in
        </a>
      </p>
    </div>
  )
}
