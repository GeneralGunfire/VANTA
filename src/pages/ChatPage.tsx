import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Upload, AlertTriangle, ArrowUpRight, ArrowDownLeft, RefreshCw, Send, Banknote, Receipt, MessageCircleQuestion, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn, getBusinessName } from '../lib/utils';
import type { AppShellContext } from '../layouts/AppLayout';

interface ParsedTransaction {
  id?: string;
  raw_input?: string;
  source?: 'text' | 'excel';
  amount: number | null;
  direction: 'in' | 'out' | null;
  category: string;
  description: string | null;
  confidence: number;
  needs_review: boolean;
}

type Message =
  | { id: string; role: 'user'; content: string; timestamp: string }
  | { id: string; role: 'assistant'; content: string; timestamp: string; transactions?: ParsedTransaction[] }
  | { id: string; role: 'error'; content: string; timestamp: string };

/** Omit that distributes over a union instead of collapsing it to the common shape. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Tell me about a sale or expense in your own words — for example \"sold 20 loaves R400 cash\" — and I'll add it to your books.",
  timestamp: '',
};

/** Real Vanta usage — not generic finance-app suggestions. "Refresh" cycles this pool four at a time. */
const EXAMPLE_PROMPTS: { icon: typeof Banknote; label: string; prompt: string }[] = [
  { icon: Banknote, label: 'Log a sale', prompt: 'sold 20 loaves, R400 cash' },
  { icon: Receipt, label: 'Log an expense', prompt: 'bought flour for R180' },
  { icon: MessageCircleQuestion, label: "Ask how you're doing", prompt: "how's business this week?" },
  { icon: Banknote, label: 'Log a sale', prompt: 'sold 3 haircuts for R450 total' },
  { icon: Receipt, label: 'Log an expense', prompt: 'paid R650 for airtime and data' },
  { icon: MessageCircleQuestion, label: 'Ask about spending', prompt: 'how much did I spend on stock this month?' },
  { icon: Banknote, label: 'Log a sale', prompt: 'sold airtime R120 cash' },
  { icon: Receipt, label: 'Log an expense', prompt: 'paid R2000 rent for the shop' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);
  const businessName = getBusinessName();

  // Collapses the sidebar while the composer is active. Blurring restores it,
  // so the nav is always one click (or Escape) away.
  const { setComposerFocused } = useOutletContext<AppShellContext>();

  // "Refresh prompts" pages through the example pool four at a time, wrapping around.
  const [promptPage, setPromptPage] = useState(0);
  const visiblePrompts = useMemo(() => {
    const start = (promptPage * 4) % EXAMPLE_PROMPTS.length;
    return Array.from({ length: 4 }, (_, i) => EXAMPLE_PROMPTS[(start + i) % EXAMPLE_PROMPTS.length]);
  }, [promptPage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Leaving focus mode should never require hunting for somewhere safe to click.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') composerRef.current?.blur();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // A route change while focused would otherwise strand the sidebar collapsed.
  useEffect(() => () => setComposerFocused(false), [setComposerFocused]);

  // A future entry point (e.g. a "try this" link) can hand a phrase over via
  // router state. Load it into the composer (never auto-send — the owner
  // must confirm) and clear the state so a refresh doesn't re-apply it.
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const state = location.state as { prefill?: string; focusComposer?: boolean } | null;
    if (!state?.prefill && !state?.focusComposer) return;
    if (state.prefill) setInput(state.prefill);
    composerRef.current?.focus();
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  function addMessage(msg: DistributiveOmit<Message, 'id' | 'timestamp'> & { id?: string }) {
    const timeStr = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { ...msg, id: msg.id ?? Date.now().toString(), timestamp: timeStr }]);
  }

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
    composerRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    addMessage({ role: 'user', content: input });
    const currentQuery = input;
    setInput('');
    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
      }

      // Real parse-transaction contract: { raw_input, source }, returns
      // { transactions: [...] } (always an array, one item per parsed
      // transaction — a single free-text message can yield several rows
      // when it describes multiple transactions at once).
      const { data, error } = await supabase.functions.invoke('parse-transaction', {
        body: { raw_input: currentQuery, source: 'text' },
      });

      if (error) throw error;

      const transactions: ParsedTransaction[] = Array.isArray(data?.transactions) ? data.transactions : [];

      if (transactions.length === 0) {
        addMessage({ role: 'error', content: "Something went wrong — no transaction came back from that. Try rephrasing it." });
      } else {
        addMessage({
          role: 'assistant',
          content:
            transactions.length === 1
              ? "Here's what I understood:"
              : `I found ${transactions.length} separate transactions in that — here's what I understood:`,
          transactions,
        });
      }
    } catch (err: any) {
      console.error('Error parsing transaction:', err);
      // Honest failure — never invent a transaction to show in its place.
      addMessage({ role: 'error', content: `Couldn't parse that: ${err?.message ?? String(err)}` });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTransactionCards = (items: ParsedTransaction[]) => (
    <div className="mt-4 space-y-3">
      {items.map((item, idx) => {
        if (item.needs_review) {
          return (
            <div
              key={item.id ?? idx}
              className="border-l-4 border-l-vanta-black bg-white p-5 rounded-r-xl border-t border-r border-b border-vanta-border"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-vanta-black flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Needs review
                </div>
              </div>
              <p className="text-sm text-vanta-black leading-relaxed mb-3">
                {item.description || item.raw_input || 'Could not confidently parse this transaction.'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-vanta-gray">
                {item.amount !== null && (
                  <span>
                    Best guess: <span className="font-mono font-semibold text-vanta-black">R{item.amount.toFixed(2)}</span>
                  </span>
                )}
                <span>
                  Category: <span className="font-medium text-vanta-black">{item.category}</span>
                </span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id ?? idx}
            className="border-l-2 border-l-vanta-navy bg-white p-6 border-t border-r border-b border-vanta-border rounded-r-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.06)] space-y-4"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1 font-semibold">Category</div>
                <div className="text-lg font-serif text-vanta-black">{item.category}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1 font-semibold">Amount</div>
                <div className="text-xl font-mono font-semibold text-vanta-black flex items-center gap-1 justify-end">
                  {item.direction === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  R{(item.amount ?? 0).toFixed(2)}
                </div>
              </div>
            </div>
            {item.description && <p className="text-sm text-vanta-gray">{item.description}</p>}
          </div>
        );
      })}
    </div>
  );

  const isEmpty = messages.length === 1 && messages[0].id === 'welcome';
  const MAX_INPUT_LENGTH = 500;

  const inputBar = (
    <form onSubmit={handleSubmit} className="group relative">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setInput(`Uploaded file: ${e.target.files[0].name} — file parsing isn't wired up yet, describe it in words instead.`);
          }
        }}
      />

      <div className="rounded-2xl bg-white border border-vanta-border shadow-[0_16px_40px_-20px_rgba(28,28,28,0.25)] group-focus-within:border-vanta-navy/50 group-focus-within:shadow-[0_20px_48px_-20px_rgba(30,90,168,0.25)] transition-all overflow-hidden">
        <input
          ref={composerRef}
          type="text"
          value={input}
          maxLength={MAX_INPUT_LENGTH}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setComposerFocused(true)}
          onBlur={() => setComposerFocused(false)}
          placeholder="Tell me what happened…"
          className="w-full bg-transparent pt-4.5 pb-3 px-4.5 text-vanta-black placeholder-vanta-gray focus:outline-none text-[15px]"
        />
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach an Excel or CSV file"
            className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-vanta-gray hover:text-vanta-black transition-colors rounded-lg hover:bg-black/5"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Attach file</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-vanta-gray/70 tabular-nums">
              {input.length}/{MAX_INPUT_LENGTH}
            </span>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              title="Send"
              className="w-8 h-8 rounded-full bg-vanta-navy text-white flex items-center justify-center hover:bg-vanta-navy-dark transition-all disabled:opacity-30 active:scale-[0.95]"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </form>
  );

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto overflow-x-hidden bg-white">
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 min-h-full">
          <div className="w-full max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-2xl md:text-[2rem] font-sans font-extrabold tracking-tight leading-tight"
            >
              {businessName ? (
                <>
                  <span className="text-vanta-black">Hi there, </span>
                  <span className="bg-clip-text text-transparent bg-linear-to-r from-vanta-navy to-[#5B9BE0]">{businessName}</span>
                </>
              ) : (
                <span className="text-vanta-black">Hi there</span>
              )}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.04 }}
              className="text-2xl md:text-[2rem] font-sans font-extrabold tracking-tight leading-tight mb-3"
            >
              <span className="text-vanta-black">What </span>
              <span className="bg-clip-text text-transparent bg-linear-to-r from-vanta-navy to-[#5B9BE0]">would you like to log?</span>
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="text-sm text-vanta-gray mb-6"
            >
              Use one of the prompts below, or describe it your own way to begin.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={promptPage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  {visiblePrompts.map((p, i) => (
                    <button
                      key={`${promptPage}-${i}`}
                      type="button"
                      onClick={() => handleQuickPrompt(p.prompt)}
                      className="text-left bg-white border border-vanta-border rounded-2xl p-4 hover:border-vanta-navy/30 hover:-translate-y-0.5 transition-all"
                    >
                      <div className="text-[13px] font-medium text-vanta-black leading-snug mb-6 line-clamp-2">
                        "{p.prompt}"
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#E8F0FA] flex items-center justify-center text-vanta-navy">
                        <p.icon size={14} />
                      </div>
                    </button>
                  ))}
                </motion.div>
              </AnimatePresence>

              <button
                type="button"
                onClick={() => setPromptPage((n) => n + 1)}
                className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-vanta-gray hover:text-vanta-navy transition-colors"
              >
                <RefreshCcw size={12} />
                Refresh prompts
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="mt-8"
            >
              {inputBar}
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white">
      <div className="relative flex-1 overflow-y-auto px-6 md:px-12 pt-8 pb-40">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}
            >
              {msg.role === 'user' && (
                <div className="bg-vanta-navy text-white p-4 rounded-2xl rounded-br-md max-w-xl">
                  {msg.content}
                </div>
              )}

              {msg.role === 'error' && (
                <div className="flex gap-4 max-w-2xl w-full">
                  <div className="w-9 h-9 rounded-lg bg-white border-2 border-vanta-black text-vanta-black shrink-0 flex items-center justify-center font-serif font-semibold text-sm">
                    !
                  </div>
                  <div className="flex-1 bg-white p-5 border-2 border-vanta-black rounded-2xl rounded-tl-md text-vanta-black text-sm">
                    {msg.content}
                  </div>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="flex gap-4 max-w-2xl w-full">
                  <div className="w-9 h-9 rounded-lg bg-vanta-navy text-white shrink-0 flex items-center justify-center font-serif font-semibold text-sm">
                    V
                  </div>
                  <div className="flex-1 bg-white p-5 border border-vanta-border rounded-2xl rounded-tl-md">
                    <div className="text-vanta-black text-sm leading-relaxed">{msg.content}</div>
                    {msg.transactions && renderTransactionCards(msg.transactions)}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex gap-4 max-w-2xl">
              <div className="w-9 h-9 rounded-lg bg-vanta-navy text-white shrink-0 flex items-center justify-center animate-pulse">
                <RefreshCw size={15} className="animate-spin" />
              </div>
              <div className="flex-1 bg-white p-4 border border-vanta-border rounded-2xl rounded-tl-md text-vanta-gray text-sm italic flex items-center">
                Thinking…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-30">
        <div className="max-w-4xl mx-auto">{inputBar}</div>
      </div>
    </div>
  );
}
