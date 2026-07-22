import { useState, type FormEvent } from 'react'
import { useApp } from '../state/AppState'
import { Money, PageHeader, EmptyState, Field } from '../components/ui'
import { friendlyDate, todayISO } from '../lib/money'

export default function Assets() {
  const { assets, addAsset, deleteAsset } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [note, setNote] = useState('')

  const total = assets.reduce((s, a) => s + a.cost, 0)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name || !cost) return
    addAsset({ name, cost: parseFloat(cost), purchaseDate: todayISO(), note: note || undefined })
    setName('')
    setCost('')
    setNote('')
    setShowForm(false)
  }

  return (
    <div className="page">
      <PageHeader title="Assets" sub="Equipment and big purchases your business owns." />

      <div className="spread" style={{ marginBottom: 20 }}>
        <div>
          <div className="faint">Total value</div>
          <Money amount={total} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add asset'}
        </button>
      </div>

      {showForm && (
        <form className="card stack" onSubmit={onSubmit} style={{ marginBottom: 20 }}>
          <Field label="What is it?">
            <input autoFocus placeholder="e.g. Industrial oven" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="What did it cost?">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </Field>
          <Field label="Note (optional)">
            <input placeholder="e.g. Second-hand, from Cash Converters" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <button className="btn btn-primary" type="submit" disabled={!name || !cost}>
            Save asset
          </button>
        </form>
      )}

      {assets.length === 0 ? (
        <EmptyState>No assets recorded yet.</EmptyState>
      ) : (
        <div className="stack">
          {assets.map((a) => (
            <div className="card spread" key={a.id}>
              <div>
                <div style={{ fontWeight: 600 }}>{a.name}</div>
                <div className="faint">Bought {friendlyDate(a.purchaseDate)}</div>
                {a.note && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{a.note}</div>}
              </div>
              <div className="row">
                <Money amount={a.cost} />
                <button className="btn btn-quiet btn-sm" onClick={() => deleteAsset(a.id)} aria-label="Remove asset">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
