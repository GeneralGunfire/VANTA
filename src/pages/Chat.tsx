import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useApp } from '../state/AppState'
import { Money, ReviewFlag } from '../components/ui'
import QuickActions from '../components/chat/QuickActions'
import { api, newId } from '../services/api'
import type { ChatMessage, QuickActionId } from '../types'

export default function Chat() {
  const { messages, sendMessage, confirmPending, dismissPending } = useApp()
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const allMessages = [...messages, ...localMessages]

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, localMessages])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    const value = text.trim()
    setText('')
    setSending(true)
    await sendMessage(value)
    setSending(false)
  }

  async function onQuickAction(id: QuickActionId) {
    setSending(true)
    const reply = await api.runQuickAction(id)
    setLocalMessages((prev) => [...prev, { id: newId('qa'), role: 'vanta', text: reply }])
    setSending(false)
  }

  return (
    <div className="chat-wrap">
      <div className="chat-scroll" ref={scrollRef}>
        {allMessages.map((m) => (
          <div key={m.id}>
            {m.role === 'user' ? (
              <div className="bubble user">{m.text}</div>
            ) : (
              <div className="stack" style={{ alignItems: 'flex-start' }}>
                {m.text && <div className="bubble vanta">{m.text}</div>}
                {m.pendingTransaction && !m.confirmed && (
                  <div className="tx-card">
                    <div className="spread" style={{ marginBottom: 8 }}>
                      <span className="pill accent">{m.pendingTransaction.category}</span>
                      <Money amount={m.pendingTransaction.amount} direction={m.pendingTransaction.direction} />
                    </div>
                    <p className="muted" style={{ fontSize: 14, marginBottom: 8 }}>
                      {m.pendingTransaction.description}
                    </p>
                    {m.pendingTransaction.confidenceScore < 0.7 && <ReviewFlag />}
                    <div className="row" style={{ marginTop: 12 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => confirmPending(m.id)}>
                        Confirm
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => dismissPending(m.id)}>
                        Not quite
                      </button>
                    </div>
                  </div>
                )}
                {m.confirmed && (
                  <div className="pill" style={{ marginLeft: 4 }}>
                    Added to your ledger
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="bubble vanta" aria-live="polite">
            Thinking…
          </div>
        )}
      </div>

      <QuickActions onSelect={onQuickAction} disabled={sending} />

      <form className="chat-input" onSubmit={onSubmit}>
        <input
          placeholder="Tell Vanta about a sale or expense…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={!text.trim() || sending}>
          Send
        </button>
      </form>
    </div>
  )
}
