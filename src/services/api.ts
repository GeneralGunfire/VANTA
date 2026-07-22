// Data-access boundary. Screens call this interface only, never storage
// directly. Swapping MockDataService for a SupabaseDataService (calling the
// parse-transaction Edge Function and real tables) is a one-file change.
import type { CorrectionRecord, QuickActionId, Transaction } from '../types'
import { mockCorrections, mockTransactions } from '../data/mock'
import { todayISO, uid } from '../lib/money'

export interface ParsedTransaction {
  parsed: Omit<Transaction, 'id' | 'needsReview'> | null
  reply: string
}

export interface DataService {
  fetchTransactions(): Promise<Transaction[]>
  fetchCorrections(): Promise<CorrectionRecord[]>
  /** In production this calls the parse-transaction edge function (Groq, Llama 3.1 8B Instant). */
  parseMessage(text: string): Promise<ParsedTransaction>
  /** Placeholder — not yet wired to real ledger aggregation. Never fabricates a number. */
  runQuickAction(id: QuickActionId): Promise<string>
}

const NEEDS_REVIEW_THRESHOLD = 0.7

const CATEGORY_HINTS: Array<[RegExp, string]> = [
  [/sold|sale|order|customer|paid me/i, 'Sales'],
  [/flour|stock|supplies|bought|ingredients|sugar|yeast|material/i, 'Stock'],
  [/taxi|transport|petrol|uber|lift/i, 'Transport'],
  [/airtime|data|phone/i, 'Airtime & data'],
  [/rent/i, 'Rent'],
  [/wage|salary|helper|paid \w+ for help/i, 'Wages'],
]

/** Local stand-in for the parse-transaction Edge Function's parsing + scoring. */
function localParse(text: string): ParsedTransaction {
  const amountMatch = text.match(/r\s?(\d[\d\s,]*(?:\.\d{1,2})?)/i) ?? text.match(/(\d[\d\s,]*(?:\.\d{1,2})?)/)
  if (!amountMatch) {
    return {
      parsed: null,
      reply:
        "I couldn't find an amount in that. Try something like \"sold 20 loaves R400 cash\" or \"bought flour for R180\".",
    }
  }
  const amount = parseFloat(amountMatch[1].replace(/[\s,]/g, ''))
  const isOut = /bought|paid|spent|expense|cost|owe/i.test(text)
  const direction = isOut ? 'out' : 'in'
  const category = CATEGORY_HINTS.find(([re]) => re.test(text))?.[1] ?? (isOut ? 'Other expense' : 'Sales')
  const hasCurrencyMark = /r\s?\d/i.test(text)
  const hasCategoryHint = CATEGORY_HINTS.some(([re]) => re.test(text))
  const confidenceScore = hasCurrencyMark && hasCategoryHint ? 0.92 : hasCurrencyMark ? 0.75 : 0.5
  return {
    parsed: {
      date: todayISO(),
      amount,
      direction,
      category,
      description: text.trim(),
      source: 'chat',
      confidenceScore,
    },
    reply: '',
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class MockDataService implements DataService {
  async fetchTransactions() {
    await delay(150)
    return [...mockTransactions]
  }
  async fetchCorrections() {
    await delay(150)
    return [...mockCorrections]
  }
  async parseMessage(text: string) {
    await delay(600)
    return localParse(text)
  }
  async runQuickAction(_id: QuickActionId): Promise<string> {
    await delay(300)
    // Honest placeholder: this must never invent a number. Real aggregation
    // logic against the ledger is an open item, not built yet.
    return "This isn't wired up to your real numbers yet — coming soon."
  }
}

export const api: DataService = new MockDataService()

export function newId(prefix: string): string {
  return uid(prefix)
}

export { NEEDS_REVIEW_THRESHOLD }
