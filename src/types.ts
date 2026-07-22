export type Direction = 'in' | 'out'

export interface Transaction {
  id: string
  date: string // ISO yyyy-mm-dd
  amount: number // rands
  direction: Direction
  category: string
  description: string
  source: 'chat' | 'upload' | 'manual'
  confidence: 'high' | 'medium' | 'low'
  needsReview?: boolean
}

export interface Asset {
  id: string
  name: string
  purchaseDate: string
  cost: number
  note?: string
}

export type InvoiceStatus = 'unpaid' | 'paid' | 'overdue'

export interface Invoice {
  id: string
  /** 'owed_to_me' = customer owes the business; 'i_owe' = business owes a supplier */
  kind: 'owed_to_me' | 'i_owe'
  who: string
  amount: number
  dueDate: string
  status: InvoiceStatus
  note?: string
}

export interface ComplianceItem {
  id: string
  title: string
  body: string
  done: boolean
}

export interface BusinessProfile {
  ownerName: string
  businessName: string
  businessType: string
  phone: string
  location: string
  whatSells: string
}

export type ChatRole = 'user' | 'vanta'

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  /** present when Vanta parsed the user's text into a transaction awaiting confirmation */
  pendingTransaction?: Omit<Transaction, 'id'>
  confirmed?: boolean
}
