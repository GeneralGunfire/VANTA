import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppState'
import { Field } from '../components/ui'

const STEPS = ['business', 'sells', 'ready'] as const
type Step = (typeof STEPS)[number]

export default function Onboarding() {
  const { completeOnboarding } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('business')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [whatSells, setWhatSells] = useState('')

  const idx = STEPS.indexOf(step)

  function next() {
    if (step === 'business') setStep('sells')
    else if (step === 'sells') setStep('ready')
    else {
      completeOnboarding({ businessName, businessType, whatSells })
      navigate('/app/chat')
    }
  }

  return (
    <div className="onboard-wrap">
      <div className="progress-dots">
        {STEPS.map((s, i) => (
          <span key={s} className={i <= idx ? 'done' : ''} />
        ))}
      </div>

      {step === 'business' && (
        <>
          <h1 className="page-title">Tell us about your business</h1>
          <p className="page-sub">This helps Vanta understand your records from day one.</p>
          <div className="stack">
            <Field label="Business name">
              <input
                autoFocus
                placeholder="e.g. Nomsa's Bakery"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </Field>
            <Field label="What kind of business is it?">
              <input
                placeholder="e.g. Bakery, spaza shop, hair salon"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              />
            </Field>
            <button className="btn btn-primary" onClick={next} disabled={!businessName}>
              Continue
            </button>
          </div>
        </>
      )}

      {step === 'sells' && (
        <>
          <h1 className="page-title">What do you sell?</h1>
          <p className="page-sub">A quick description — this helps Vanta guess categories correctly.</p>
          <div className="stack">
            <Field label="What you sell or offer">
              <textarea
                autoFocus
                rows={4}
                placeholder="e.g. Bread, vetkoek, scones and cakes for orders"
                value={whatSells}
                onChange={(e) => setWhatSells(e.target.value)}
              />
            </Field>
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setStep('business')}>
                Back
              </button>
              <button className="btn btn-primary" onClick={next} disabled={!whatSells}>
                Continue
              </button>
            </div>
          </div>
        </>
      )}

      {step === 'ready' && (
        <>
          <h1 className="page-title">You're all set, {businessName || 'friend'}</h1>
          <p className="page-sub">
            Start by telling Vanta about a sale or expense — just type it like you'd say it out loud.
          </p>
          <div className="card" style={{ marginBottom: 24 }}>
            <p className="muted" style={{ fontSize: 14, marginBottom: 8 }}>Try something like:</p>
            <p style={{ fontStyle: 'italic' }}>"sold 20 loaves R400 cash"</p>
          </div>
          <button className="btn btn-primary" onClick={next}>
            Go to Vanta
          </button>
        </>
      )}
    </div>
  )
}
