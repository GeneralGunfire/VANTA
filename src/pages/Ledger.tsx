import { useMemo, useState } from 'react'
import { useApp } from '../state/AppState'
import { Money, PageHeader, EmptyState, ReviewFlag } from '../components/ui'
import { friendlyDate, todayISO } from '../lib/money'
import { downloadCsv, transactionsToCsv } from '../lib/csv'
import type { Transaction } from '../types'

type Filter = 'all' | 'in' | 'out' | 'review'

export default function Ledger() {
  const { transactions, updateTransaction, deleteTransaction } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        if (filter === 'in') return t.direction === 'in'
        if (filter === 'out') return t.direction === 'out'
        if (filter === 'review') return t.needsReview
        return true
      })
      .filter((t) => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      })
  }, [transactions, filter, query])

  const totalIn = transactions.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0)

  function exportCsv() {
    downloadCsv(`vanta-ledger-${todayISO()}.csv`, transactionsToCsv(filtered))
  }

  return (
    <div className="page">
      <PageHeader title="Ledger" sub="Every sale and expense you've recorded, in one place." />

      <div className="spread" style={{ marginBottom: 20 }}>
        <div className="row" style={{ gap: 24 }}>
          <div>
            <div className="faint">Money in</div>
            <Money amount={totalIn} direction="in" />
          </div>
          <div>
            <div className="faint">Money out</div>
            <Money amount={totalOut} direction="out" />
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <div className="field" style={{ marginBottom: 16 }}>
        <input placeholder="Search by description or category…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="filters">
        {(
          [
            ['all', 'All'],
            ['in', 'Money in'],
            ['out', 'Money out'],
            ['review', 'Needs review'],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button key={key} className={`chip ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState>No transactions match. Try a different filter or search.</EmptyState>
      ) : (
        <div>
          {filtered.map((t) =>
            editingId === t.id ? (
              <EditRow
                key={t.id}
                transaction={t}
                onSave={(patch) => {
                  updateTransaction(t.id, patch)
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="ledger-row" key={t.id}>
                <div className="date faint">{friendlyDate(t.date)}</div>
                <div className="desc">
                  <div>{t.description}</div>
                  <div className="cat">
                    {t.category}
                    {t.needsReview && (
                      <>
                        {' '}
                        · <ReviewFlag />
                      </>
                    )}
                  </div>
                </div>
                <Money amount={t.amount} direction={t.direction} />
                <div className="actions row">
                  <button className="btn btn-quiet btn-sm" onClick={() => setEditingId(t.id)}>
                    Edit
                  </button>
                  <button className="btn btn-quiet btn-sm" onClick={() => deleteTransaction(t.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
      <p className="faint" style={{ marginTop: 20 }}>
        Edits and deletes here update this view only — they aren't saved to your account yet.
      </p>
    </div>
  )
}

function EditRow({
  transaction,
  onSave,
  onCancel,
}: {
  transaction: Transaction
  onSave: (patch: Partial<Transaction>) => void
  onCancel: () => void
}) {
  const [description, setDescription] = useState(transaction.description)
  const [category, setCategory] = useState(transaction.category)
  const [amount, setAmount] = useState(String(transaction.amount))

  return (
    <div className="card stack" style={{ marginBottom: 12 }}>
      <div className="field">
        <label>Description</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="field" style={{ width: 140 }}>
          <label>Amount</label>
          <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <div className="row">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onSave({ description, category, amount: parseFloat(amount) || transaction.amount })}
        >
          Save
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
