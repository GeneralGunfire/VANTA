import { useApp } from '../state/AppState'
import { PageHeader, Toggle } from '../components/ui'

export default function Compliance() {
  const { compliance, toggleCompliance } = useApp()
  const doneCount = compliance.filter((c) => c.done).length

  return (
    <div className="page">
      <PageHeader
        title="Compliance corner"
        sub="Plain-English guidance on what South African rules apply to your business, and when."
      />

      <p className="faint" style={{ marginBottom: 20 }}>
        {doneCount} of {compliance.length} sorted
      </p>

      <div className="stack">
        {compliance.map((c) => (
          <div className="card" key={c.id}>
            <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{c.title}</div>
                <p className="muted" style={{ fontSize: 14 }}>
                  {c.body}
                </p>
              </div>
              <Toggle on={c.done} onChange={() => toggleCompliance(c.id)} label={`Mark "${c.title}" as done`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
