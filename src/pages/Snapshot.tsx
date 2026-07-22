import { useMemo } from 'react'
import { useApp } from '../state/AppState'
import { PageHeader } from '../components/ui'
import { formatRands } from '../lib/money'

export default function Snapshot() {
  const { transactions, invoices } = useApp()

  const summary = useMemo(() => {
    const last7 = transactions // mock data is already recent; treat all as "this week"
    const totalIn = last7.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0)
    const totalOut = last7.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0)
    const profit = totalIn - totalOut

    const byCategory = new Map<string, number>()
    last7
      .filter((t) => t.direction === 'in')
      .forEach((t) => byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount))
    const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0]

    const owedToMe = invoices
      .filter((i) => i.kind === 'owed_to_me' && i.status !== 'paid')
      .reduce((s, i) => s + i.amount, 0)
    const iOwe = invoices
      .filter((i) => i.kind === 'i_owe' && i.status !== 'paid')
      .reduce((s, i) => s + i.amount, 0)

    return { totalIn, totalOut, profit, topCategory, owedToMe, iOwe }
  }, [transactions, invoices])

  return (
    <div className="page">
      <PageHeader title="Snapshot" sub="A plain-English look at how business is going — no charts, just the story." />

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="snap-big">
          You made {formatRands(summary.totalIn)} and spent {formatRands(summary.totalOut)} recently,
          {summary.profit >= 0
            ? ` leaving you ${formatRands(summary.profit)} ahead.`
            : ` which is ${formatRands(Math.abs(summary.profit))} more than you brought in.`}
        </p>
      </div>

      {summary.topCategory && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="snap-line">
            Most of your money came from <strong>{summary.topCategory[0]}</strong> —{' '}
            {formatRands(summary.topCategory[1])} of it.
          </p>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="snap-line">
          {summary.owedToMe > 0 ? (
            <>
              People owe you <strong>{formatRands(summary.owedToMe)}</strong> right now.
            </>
          ) : (
            'Nobody currently owes you money — nice and clean.'
          )}
          {summary.iOwe > 0 && (
            <>
              {' '}
              You owe suppliers <strong>{formatRands(summary.iOwe)}</strong>.
            </>
          )}
        </p>
      </div>

      <div className="card">
        <p className="snap-line muted">
          Want more detail? Head to the <strong>Ledger</strong> to see every transaction, or{' '}
          <strong>Invoices &amp; debts</strong> to see who owes what.
        </p>
      </div>
    </div>
  )
}
