import type { CorrectionRecord, Transaction } from '../types'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const NEEDS_REVIEW_THRESHOLD = 0.7

function tx(partial: Omit<Transaction, 'needsReview'>): Transaction {
  return { ...partial, needsReview: partial.confidenceScore < NEEDS_REVIEW_THRESHOLD }
}

export const mockTransactions: Transaction[] = [
  tx({ id: 't1', date: daysAgo(0), amount: 400, direction: 'in', category: 'Sales', description: 'Sold 20 loaves of bread', source: 'chat', confidenceScore: 0.96 }),
  tx({ id: 't2', date: daysAgo(0), amount: 180, direction: 'out', category: 'Stock', description: 'Flour and yeast from cash & carry', source: 'chat', confidenceScore: 0.93 }),
  tx({ id: 't3', date: daysAgo(1), amount: 650, direction: 'in', category: 'Sales', description: 'Birthday cake order — Thandi', source: 'chat', confidenceScore: 0.95 }),
  tx({ id: 't4', date: daysAgo(1), amount: 60, direction: 'out', category: 'Transport', description: 'Taxi to market', source: 'chat', confidenceScore: 0.9 }),
  tx({ id: 't5', date: daysAgo(2), amount: 320, direction: 'in', category: 'Sales', description: 'Vetkoek and scones, Saturday market', source: 'upload', confidenceScore: 0.58 }),
  tx({ id: 't6', date: daysAgo(3), amount: 250, direction: 'out', category: 'Stock', description: 'Sugar, margarine, eggs', source: 'chat', confidenceScore: 0.92 }),
  tx({ id: 't7', date: daysAgo(4), amount: 900, direction: 'in', category: 'Sales', description: 'Wedding order deposit — Mokoena family', source: 'chat', confidenceScore: 0.94 }),
  tx({ id: 't8', date: daysAgo(5), amount: 120, direction: 'out', category: 'Airtime & data', description: 'Data bundle', source: 'chat', confidenceScore: 0.91 }),
  tx({ id: 't9', date: daysAgo(6), amount: 480, direction: 'in', category: 'Sales', description: 'Daily bread sales', source: 'upload', confidenceScore: 0.42 }),
]

export const mockCorrections: CorrectionRecord[] = [
  { id: 'c1', transactionId: 't5', field: 'category', from: 'Other', to: 'Sales', date: daysAgo(2) },
  { id: 'c2', transactionId: 't9', field: 'amount', from: 'R48', to: 'R480', date: daysAgo(6) },
]
