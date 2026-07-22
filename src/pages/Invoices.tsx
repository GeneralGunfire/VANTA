import { useMemo, useState, type FormEvent } from 'react'
import { useApp } from '../state/AppState'
import { Money, PageHeader, EmptyState, Field } from '../components/ui'
import { friendlyDate, todayISO } from '../lib/money'
import type { Invoice } from '../types'

type Tab = 'owed_to_me' | 'i_owe'

export default function Invoices() {
  const { invoices, addInvoice, setInvoiceStatus, deleteInvoice } = useApp()
  const [tab, setTab] = useState<Tab>('owed_to_me')
  const [showForm, setShowForm] = useState(false)
  const [who, setWho] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(todayISO())

  const list = useMemo(() => invoices.filter((i) => i.kind === tab), [invoices, tab])
  const outstanding = list.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!who || !amount) return
    addInvoice({ kind: tab, who, amount: parseFloat(amount), dueDate, status: 'unpaid' })
    setWho('')
    setAmount('')
    setDueDate(todayISO())
    setShowForm(false)
  }

  return (
    <div className="page">
      <PageHeader title="Invoices & debts" sub="Track who owes you, and what you owe others." />

      <div className="filters">
        <button className={`chip ${tab === 'owed_to_me' ? 'active' : ''}`} onClick={() => setTab('owed_to_me')}>
          Owed to me
        </button>
        <button className={`chip ${tab === 'i_owe' ? 'active' : ''}`} onClick={() => setTab('i_owe')}>
          I owe
        </button>
      </div>

      <div className="spread" style={{ marginBottom: 20 }}>
        <div>
          <div className="faint">Outstanding</div>
          <Money amount={outstanding} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add entry'}
        </button>
      </div>

      {showForm && (
        <form className="card stack" onSubmit={onSubmit} style={{ marginBottom: 20 }}>
          <Field label={tab === 'owed_to_me' ? 'Who owes you?' : 'Who do you owe?'}>
            <input autoFocus placeholder="Name" value={who} onChange={(e) => setWho(e.target.value)} />
          </Field>
          <Field label="Amount">
            <input type="number" min="0" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Due date">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <button className="btn btn-primary" type="submit" disabled={!who || !amount}>
            Save
          </button>
        </form>
      )}

      {list.length === 0 ? (
        <EmptyState>Nothing here yet.</EmptyState>
      ) : (
        <div className="stack">
          {list.map((i) => (
            <InvoiceRow key={i.id} invoice={i} onStatus={setInvoiceStatus} onDelete={deleteInvoice} />
          ))}
        </div>
      )}
    </div>
  )
}

function InvoiceRow({
  invoice,
  onStatus,
  onDelete,
}: {
  invoice: Invoice
  onStatus: (id: string, status: Invoice['status']) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="card">
      <div className="spread">
        <div>
          <div style={{ fontWeight: 600 }}>{invoice.who}</div>
          <div className="faint">Due {friendlyDate(invoice.dueDate)}</div>
          {invoice.note && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{invoice.note}</div>}
        </div>
        <Money amount={invoice.amount} />
      </div>
      <div className="spread" style={{ marginTop: 12 }}>
        <span className={`pill ${invoice.status === 'paid' ? 'ok' : invoice.status === 'overdue' ? 'warn' : ''}`}>
          {invoice.status === 'paid' ? 'Paid' : invoice.status === 'overdue' ? 'Overdue' : 'Unpaid'}
        </span>
        <div className="row">
          {invoice.status !== 'paid' && (
            <button className="btn btn-ghost btn-sm" onClick={() => onStatus(invoice.id, 'paid')}>
              Mark paid
            </button>
          )}
          <button className="btn btn-quiet btn-sm" onClick={() => onDelete(invoice.id)}>
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
