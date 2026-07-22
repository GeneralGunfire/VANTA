import type { Asset, ComplianceItem, Invoice, Transaction, BusinessProfile } from '../types'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const mockProfile: BusinessProfile = {
  ownerName: 'Nomsa Dlamini',
  businessName: "Nomsa's Bakery",
  businessType: 'Bakery / food',
  phone: '072 555 0134',
  location: 'Soweto, Gauteng',
  whatSells: 'Bread, vetkoek, scones and cakes for orders',
}

export const mockTransactions: Transaction[] = [
  { id: 't1', date: daysAgo(0), amount: 400, direction: 'in', category: 'Sales', description: 'Sold 20 loaves of bread', source: 'chat', confidence: 'high' },
  { id: 't2', date: daysAgo(0), amount: 180, direction: 'out', category: 'Stock', description: 'Flour and yeast from cash & carry', source: 'chat', confidence: 'high' },
  { id: 't3', date: daysAgo(1), amount: 650, direction: 'in', category: 'Sales', description: 'Birthday cake order — Thandi', source: 'chat', confidence: 'high' },
  { id: 't4', date: daysAgo(1), amount: 60, direction: 'out', category: 'Transport', description: 'Taxi to market', source: 'chat', confidence: 'high' },
  { id: 't5', date: daysAgo(2), amount: 320, direction: 'in', category: 'Sales', description: 'Vetkoek and scones, Saturday market', source: 'upload', confidence: 'medium', needsReview: true },
  { id: 't6', date: daysAgo(3), amount: 250, direction: 'out', category: 'Stock', description: 'Sugar, margarine, eggs', source: 'chat', confidence: 'high' },
  { id: 't7', date: daysAgo(4), amount: 900, direction: 'in', category: 'Sales', description: 'Wedding order deposit — Mokoena family', source: 'chat', confidence: 'high' },
  { id: 't8', date: daysAgo(5), amount: 120, direction: 'out', category: 'Airtime & data', description: 'Data bundle', source: 'chat', confidence: 'high' },
  { id: 't9', date: daysAgo(6), amount: 480, direction: 'in', category: 'Sales', description: 'Daily bread sales', source: 'upload', confidence: 'low', needsReview: true },
]

export const mockAssets: Asset[] = [
  { id: 'a1', name: 'Industrial oven', purchaseDate: '2024-03-12', cost: 8500, note: 'Second-hand, from Cash Converters' },
  { id: 'a2', name: 'Dough mixer', purchaseDate: '2024-08-02', cost: 3200 },
  { id: 'a3', name: 'Display fridge', purchaseDate: '2025-01-20', cost: 4750, note: 'On layby, paid off' },
]

export const mockInvoices: Invoice[] = [
  { id: 'i1', kind: 'owed_to_me', who: 'Mokoena family (wedding order)', amount: 1800, dueDate: daysAgo(-7), status: 'unpaid', note: 'Balance due on collection' },
  { id: 'i2', kind: 'owed_to_me', who: 'Spaza shop — corner of Vilakazi St', amount: 560, dueDate: daysAgo(3), status: 'overdue', note: 'Weekly bread delivery, two weeks behind' },
  { id: 'i3', kind: 'i_owe', who: 'Makro (flour account)', amount: 950, dueDate: daysAgo(-14), status: 'unpaid' },
  { id: 'i4', kind: 'owed_to_me', who: 'Thandi (birthday cake)', amount: 650, dueDate: daysAgo(1), status: 'paid' },
]

export const mockCompliance: ComplianceItem[] = [
  {
    id: 'c1',
    title: 'Keep records of every sale and expense',
    body: 'SARS expects any business, even informal ones, to keep basic records. Your Vanta ledger already does this — keep logging everything and you are covered.',
    done: true,
  },
  {
    id: 'c2',
    title: 'Register your business (CIPC) when you are ready',
    body: 'Registration is not required to trade informally, but a registered business can open a business bank account, apply for funding, and tender for contracts. It costs from R125 on the CIPC website.',
    done: false,
  },
  {
    id: 'c3',
    title: 'Income tax: register with SARS if you earn above the threshold',
    body: 'If your profit for the year is above the tax threshold (R95,750 for under-65s in 2025), you must register for income tax. Below that, you owe nothing but registering is still free and useful.',
    done: false,
  },
  {
    id: 'c4',
    title: 'VAT only matters past R1 million turnover',
    body: 'You only have to register for VAT once your turnover passes R1 million in 12 months. You can ignore VAT until then — Vanta will warn you if your sales start getting close.',
    done: false,
  },
  {
    id: 'c5',
    title: 'Consider turnover tax if you register',
    body: 'Small businesses with turnover under R1 million can use SARS turnover tax — a simpler, cheaper alternative to normal income tax, with one simple return a year.',
    done: false,
  },
]
