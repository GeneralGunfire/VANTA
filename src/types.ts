export type Direction = 'in' | 'out'
export type Confidence = 'high' | 'medium' | 'low'

export interface Transaction {
  id: string
  date: string // ISO yyyy-mm-dd
  amount: number // rands
  direction: Direction
  category: string
  description: string
  source: 'chat' | 'upload' | 'manual'
  confidenceScore: number // 0..1, mirrors the parse-transaction Edge Function's score
  needsReview: boolean // true when confidenceScore < 0.7
}

export interface CorrectionRecord {
  id: string
  transactionId: string
  field: 'category' | 'amount' | 'direction' | 'description'
  from: string
  to: string
  date: string
}

export type ChatRole = 'user' | 'vanta'

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  pendingTransaction?: Omit<Transaction, 'id' | 'needsReview'>
  confirmed?: boolean
}

export type QuickActionId = 'summary' | 'top_category' | 'needs_review' | 'money_owed'

export interface QuickAction {
  id: QuickActionId
  label: string
}

export type Language = 'en' | 'zu' | 'af'
