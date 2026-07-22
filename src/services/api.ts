// Data-access boundary. Every screen talks to this interface, never to storage
// directly. Swapping MockDataService for a SupabaseDataService (same interface,
// calls the Supabase client / edge functions) is the only change needed to go live.
import type { Asset, BusinessProfile, ComplianceItem, Invoice, Transaction } from '../types'
import { mockAssets, mockCompliance, mockInvoices, mockProfile, mockTransactions } from '../data/mock'
import { todayISO, uid } from '../lib/money'

export interface ParsedTransaction {
  parsed: Omit<Transaction, 'id'> | null
  reply: string
}

export interface DataService {
  fetchTransactions(): Promise<Transaction[]>
  fetchAssets(): Promise<Asset[]>
  fetchInvoices(): Promise<Invoice[]>
  fetchCompliance(): Promise<ComplianceItem[]>
  fetchProfile(): Promise<BusinessProfile>
  /** In production this calls the parse-transaction edge function (Groq). */
  parseMessage(text: string): Promise<ParsedTransaction>
}

const CATEGORY_HINTS: Array<[RegExp, string]> = [
  [/sold|sale|order|customer|paid me/i, 'Sales'],
  [/flour|stock|supplies|bought|ingredients|sugar|yeast|material/i, 'Stock'],
  [/taxi|transport|petrol|uber|lift/i, 'Transport'],
  [/airtime|data|phone/i, 'Airtime & data'],
  [/rent/i, 'Rent'],
  [/wage|salary|helper|paid \w+ for help/i, 'Wages'],
]

/** Local stand-in for the AI parsing pipeline: finds an amount and guesses direction/category. */
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
  const confident = /r\s?\d/i.test(text)
  return {
    parsed: {
      date: todayISO(),
      amount,
      direction,
      category,
      description: text.trim(),
      source: 'chat',
      confidence: confident ? 'high' : 'medium',
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
  async fetchAssets() {
    await delay(150)
    return [...mockAssets]
  }
  async fetchInvoices() {
    await delay(150)
    return [...mockInvoices]
  }
  async fetchCompliance() {
    await delay(150)
    return [...mockCompliance]
  }
  async fetchProfile() {
    await delay(150)
    return { ...mockProfile }
  }
  async parseMessage(text: string) {
    await delay(600)
    return localParse(text)
  }
}

export const api: DataService = new MockDataService()

export function newId(prefix: string): string {
  return uid(prefix)
}
