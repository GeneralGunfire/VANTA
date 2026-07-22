import { useMemo, useState } from 'react'
import { useApp } from '../state/AppState'
import { Money, PageHeader, EmptyState } from '../components/ui'
import { friendlyDate } from '../lib/money'

type Filter = 'all' | 'in' | 'out' | 'review'

export default function Ledger() {
  const { transactions } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

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

  return (
    <div className="page">
      <PageHeader title="Ledger" sub="Every sale and expense you've recorded, in one place." />

      <div className="row" style={{ gap: 24, marginBottom: 20 }}>
        <div>
          <div className="faint">Money in</div>
          <Money amount={totalIn} direction="in" />
        </div>
        <div>
          <div className="faint">Money out</div>
          <Money amount={totalOut} direction="out" />
        </div>
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
          <button
            key={key}
            className={`chip ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState>No transactions match. Try a different filter or search.</EmptyState>
      ) : (
        <div>
          {filtered.map((t) => (
            <div className="ledger-row" key={t.id}>
              <div className="date faint">{friendlyDate(t.date)}</div>
              <div className="desc">
                <div>{t.description}</div>
                <div className="cat">
                  {t.category}
                  {t.needsReview && (
                    <>
                      {' '}
                      · <span className="pill warn">Needs review</span>
                    </>
                  )}
                </div>
              </div>
              <Money amount={t.amount} direction={t.direction} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
