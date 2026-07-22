import type { QuickAction, QuickActionId } from '../../types'

const ACTIONS: QuickAction[] = [
  { id: 'summary', label: 'How am I doing?' },
  { id: 'top_category', label: "What's my top category?" },
  { id: 'needs_review', label: 'What needs review?' },
  { id: 'money_owed', label: 'Who owes me money?' },
]

export default function QuickActions({
  onSelect,
  disabled,
}: {
  onSelect: (id: QuickActionId) => void
  disabled?: boolean
}) {
  return (
    <div className="chip-row">
      {ACTIONS.map((a) => (
        <button key={a.id} className="chip" disabled={disabled} onClick={() => onSelect(a.id)}>
          {a.label}
        </button>
      ))}
    </div>
  )
}
