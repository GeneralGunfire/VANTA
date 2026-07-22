import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  Asset,
  BusinessProfile,
  ChatMessage,
  ComplianceItem,
  Invoice,
  Transaction,
} from '../types'
import { api, newId } from '../services/api'

interface AppState {
  signedIn: boolean
  onboarded: boolean
  loading: boolean
  profile: BusinessProfile
  transactions: Transaction[]
  assets: Asset[]
  invoices: Invoice[]
  compliance: ComplianceItem[]
  messages: ChatMessage[]

  signIn: () => void
  signOut: () => void
  completeOnboarding: (p: Partial<BusinessProfile>) => void
  updateProfile: (p: Partial<BusinessProfile>) => void
  addTransaction: (t: Omit<Transaction, 'id'>) => void
  updateTransaction: (id: string, patch: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  addAsset: (a: Omit<Asset, 'id'>) => void
  deleteAsset: (id: string) => void
  addInvoice: (i: Omit<Invoice, 'id'>) => void
  setInvoiceStatus: (id: string, status: Invoice['status']) => void
  deleteInvoice: (id: string) => void
  toggleCompliance: (id: string) => void
  sendMessage: (text: string) => Promise<void>
  confirmPending: (messageId: string) => void
  dismissPending: (messageId: string) => void
}

const Ctx = createContext<AppState | null>(null)

const emptyProfile: BusinessProfile = {
  ownerName: '',
  businessName: '',
  businessType: '',
  phone: '',
  location: '',
  whatSells: '',
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'vanta',
  text: "Hi! Tell me about a sale or expense in your own words — for example \"sold 20 loaves R400 cash\" — and I'll add it to your books.",
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false)
  const [onboarded, setOnboarded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<BusinessProfile>(emptyProfile)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [compliance, setCompliance] = useState<ComplianceItem[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.fetchTransactions(),
      api.fetchAssets(),
      api.fetchInvoices(),
      api.fetchCompliance(),
      api.fetchProfile(),
    ]).then(([t, a, i, c, p]) => {
      if (cancelled) return
      setTransactions(t)
      setAssets(a)
      setInvoices(i)
      setCompliance(c)
      setProfile(p)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AppState>(
    () => ({
      signedIn,
      onboarded,
      loading,
      profile,
      transactions,
      assets,
      invoices,
      compliance,
      messages,

      signIn: () => setSignedIn(true),
      signOut: () => {
        setSignedIn(false)
        setOnboarded(false)
      },
      completeOnboarding: (p) => {
        setProfile((prev) => ({ ...prev, ...p }))
        setOnboarded(true)
      },
      updateProfile: (p) => setProfile((prev) => ({ ...prev, ...p })),

      addTransaction: (t) => setTransactions((prev) => [{ ...t, id: newId('t') }, ...prev]),
      updateTransaction: (id, patch) =>
        setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      deleteTransaction: (id) => setTransactions((prev) => prev.filter((t) => t.id !== id)),

      addAsset: (a) => setAssets((prev) => [{ ...a, id: newId('a') }, ...prev]),
      deleteAsset: (id) => setAssets((prev) => prev.filter((a) => a.id !== id)),

      addInvoice: (i) => setInvoices((prev) => [{ ...i, id: newId('i') }, ...prev]),
      setInvoiceStatus: (id, status) =>
        setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i))),
      deleteInvoice: (id) => setInvoices((prev) => prev.filter((i) => i.id !== id)),

      toggleCompliance: (id) =>
        setCompliance((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))),

      sendMessage: async (text) => {
        const userMsg: ChatMessage = { id: newId('m'), role: 'user', text }
        setMessages((prev) => [...prev, userMsg])
        const result = await api.parseMessage(text)
        if (result.parsed) {
          const p = result.parsed
          setMessages((prev) => [
            ...prev,
            {
              id: newId('m'),
              role: 'vanta',
              text:
                p.direction === 'in'
                  ? `Got it — money in of ${fmt(p.amount)} for ${p.category}. Look right?`
                  : `Got it — you spent ${fmt(p.amount)} on ${p.category}. Look right?`,
              pendingTransaction: p,
            },
          ])
        } else {
          setMessages((prev) => [...prev, { id: newId('m'), role: 'vanta', text: result.reply }])
        }
      },
      confirmPending: (messageId) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, confirmed: true } : m)),
        )
        const msg = messages.find((m) => m.id === messageId)
        if (msg?.pendingTransaction) {
          setTransactions((prev) => [{ ...msg.pendingTransaction!, id: newId('t') }, ...prev])
        }
      },
      dismissPending: (messageId) =>
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, pendingTransaction: undefined, text: 'No problem — I left that out. Tell me again in your own words.' } : m,
          ),
        ),
    }),
    [signedIn, onboarded, loading, profile, transactions, assets, invoices, compliance, messages],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function fmt(n: number): string {
  return 'R' + n.toLocaleString('en-ZA')
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider')
  return ctx
}
