import type { Transaction } from '../types'

export function transactionsToCsv(transactions: Transaction[]): string {
  const header = ['Date', 'Description', 'Category', 'Direction', 'Amount', 'Needs review']
  const rows = transactions.map((t) => [
    t.date,
    t.description.replace(/"/g, '""'),
    t.category,
    t.direction === 'in' ? 'In' : 'Out',
    t.amount.toFixed(2),
    t.needsReview ? 'Yes' : 'No',
  ])
  return [header, ...rows].map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n')
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
