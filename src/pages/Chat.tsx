import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useApp } from '../state/AppState'
import { Money } from '../components/ui'

export default function Chat() {
  const { messages, sendMessage, confirmPending, dismissPending } = useApp()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    const value = text.trim()
    setText('')
    setSending(true)
    await sendMessage(value)
    setSending(false)
  }

  return (
    <div className="chat-wrap">
      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m) => (
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
                    <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
                      {m.pendingTransaction.description}
                    </p>
                    <div className="row">
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
                  <div className="pill ok" style={{ marginLeft: 4 }}>
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
