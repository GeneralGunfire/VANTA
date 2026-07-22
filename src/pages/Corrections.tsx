import { useApp } from '../state/AppState'
import { PageHeader, EmptyState } from '../components/ui'
import { friendlyDate } from '../lib/money'

const FIELD_LABEL: Record<string, string> = {
  category: 'Category',
  amount: 'Amount',
  direction: 'Direction',
  description: 'Description',
}

export default function Corrections() {
  const { corrections, transactions } = useApp()

  return (
    <div className="page">
      <PageHeader
        title="Correction history"
        sub="Every time you've corrected something Vanta got wrong. This is placeholder data for now — it isn't persisted to your account yet."
      />
      {corrections.length === 0 ? (
        <EmptyState>No corrections yet.</EmptyState>
      ) : (
        <div className="stack">
          {corrections.map((c) => {
            const tx = transactions.find((t) => t.id === c.transactionId)
            return (
              <div className="card" key={c.id}>
                <div className="spread" style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{FIELD_LABEL[c.field]} corrected</span>
                  <span className="faint">{friendlyDate(c.date)}</span>
                </div>
                <p className="muted" style={{ fontSize: 14 }}>
                  Changed from <strong>{c.from}</strong> to <strong>{c.to}</strong>
                  {tx && <> on "{tx.description}"</>}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
