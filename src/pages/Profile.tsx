import { useState, type FormEvent } from 'react'
import { useApp } from '../state/AppState'
import { PageHeader, Field } from '../components/ui'

export default function Profile() {
  const { profile, updateProfile } = useApp()
  const [form, setForm] = useState(profile)
  const [saved, setSaved] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    updateProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page">
      <PageHeader title="Business profile" sub="Keep these details up to date — Vanta uses them to help categorise your records." />

      <form className="stack" onSubmit={onSubmit} style={{ maxWidth: 440 }}>
        <Field label="Owner name">
          <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
        </Field>
        <Field label="Business name">
          <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
        </Field>
        <Field label="Business type">
          <input value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
        </Field>
        <Field label="Phone number">
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Location">
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </Field>
        <Field label="What you sell">
          <textarea rows={3} value={form.whatSells} onChange={(e) => setForm({ ...form, whatSells: e.target.value })} />
        </Field>
        <div className="row">
          <button className="btn btn-primary" type="submit">
            Save changes
          </button>
          {saved && <span className="pill ok">Saved</span>}
        </div>
      </form>
    </div>
  )
}
