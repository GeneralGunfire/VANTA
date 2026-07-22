export function formatRands(amount: number): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0
  return (
    'R' +
    amount.toLocaleString('en-ZA', {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0,
    })
  )
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function friendlyDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

let counter = 0
export function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter}`
}
