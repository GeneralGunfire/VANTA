import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ChatMessage, CorrectionRecord, Language, Transaction } from '../types'
import { api, newId, NEEDS_REVIEW_THRESHOLD } from '../services/api'

interface AppState {
  signedIn: boolean
  loading: boolean
  language: Language
  transactions: Transaction[]
  corrections: CorrectionRecord[]
  messages: ChatMessage[]
  needsReviewCount: number

  signIn: () => void
  signOut: () => void
  setLanguage: (l: Language) => void

  sendMessage: (text: string) => Promise<void>
  confirmPending: (messageId: string) => void
  dismissPending: (messageId: string) => void

  /** Not yet persisted — updates local state only. See services/api.ts. */
  updateTransaction: (id: string, patch: Partial<Transaction>) => void
  /** Not yet persisted — updates local state only. See services/api.ts. */
  deleteTransaction: (id: string) => void
}

const Ctx = createContext<AppState | null>(null)

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'vanta',
  text: "Hi! Tell me about a sale or expense in your own words — for example \"sold 20 loaves R400 cash\" — and I'll add it to your books.",
}

function fmt(n: number): string {
  return 'R' + n.toLocaleString('en-ZA')
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState<Language>('en')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [corrections, setCorrections] = useState<CorrectionRecord[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])

  useEffect(() => {
    let cancelled = false
    Promise.all([api.fetchTransactions(), api.fetchCorrections()]).then(([t, c]) => {
      if (cancelled) return
      setTransactions(t)
      setCorrections(c)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const needsReviewCount = useMemo(() => transactions.filter((t) => t.needsReview).length, [transactions])

  const value = useMemo<AppState>(
    () => ({
      signedIn,
      loading,
      language,
      transactions,
      corrections,
      messages,
      needsReviewCount,

      signIn: () => setSignedIn(true),
      signOut: () => setSignedIn(false),
      setLanguage,

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
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, confirmed: true } : m)))
        setMessages((current) => {
          const msg = current.find((m) => m.id === messageId)
          if (msg?.pendingTransaction) {
            const p = msg.pendingTransaction
            setTransactions((prevT) => [
              { ...p, id: newId('t'), needsReview: p.confidenceScore < NEEDS_REVIEW_THRESHOLD },
              ...prevT,
            ])
          }
          return current
        })
      },
      dismissPending: (messageId) =>
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, pendingTransaction: undefined, text: 'No problem — tell me again in your own words.' }
              : m,
          ),
        ),

      updateTransaction: (id, patch) =>
        setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      deleteTransaction: (id) => setTransactions((prev) => prev.filter((t) => t.id !== id)),
    }),
    [signedIn, loading, language, transactions, corrections, messages, needsReviewCount],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider')
  return ctx
}
