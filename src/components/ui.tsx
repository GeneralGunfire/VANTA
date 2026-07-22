import type { ReactNode } from 'react'
import { formatRands } from '../lib/money'

export function Money({ amount, direction }: { amount: number; direction?: 'in' | 'out' }) {
  const sign = direction === 'out' ? '−' : direction === 'in' ? '+' : ''
  return (
    <span className="money">
      {sign}
      {formatRands(amount)}
    </span>
  )
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <>
      <h1 className="page-title">{title}</h1>
      {sub && <p className="page-sub">{sub}</p>}
    </>
  )
}

/** Needs-review indicator: icon + heavier border, deliberately not a second color. */
export function ReviewFlag() {
  return (
    <span className="pill flagged" title="Needs review">
      ⚑ Needs review
    </span>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}
