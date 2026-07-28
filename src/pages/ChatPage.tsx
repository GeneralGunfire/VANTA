import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Upload, AlertTriangle, ArrowUpRight, ArrowDownLeft, RefreshCw, Sparkles, Banknote, Receipt, MessageCircleQuestion } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { APP_SURFACE, RAISED_SURFACE } from '../lib/surfaces';

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

/**
 * Light-beam treatment for the composer. Every stop is a tint or shade of the
 * single blue accent (#1E5AA8) — no second hue is introduced.
 */
const BEAM_GRADIENT =
  'linear-gradient(90deg, transparent 0%, #6FA3DE 22%, #1E5AA8 50%, #6FA3DE 78%, transparent 100%)';
const BORDER_GRADIENT =
  'linear-gradient(90deg, #E8F0FA 0%, #6FA3DE 25%, #1E5AA8 50%, #6FA3DE 75%, #E8F0FA 100%)';



export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function addMessage(msg: DistributiveOmit<Message, 'id' | 'timestamp'> & { id?: string }) {
    const timeStr = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { ...msg, id: msg.id ?? Date.now().toString(), timestamp: timeStr }]);
  }

  const handleQuickPrompt = (promptText: string) => setInput(promptText);

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
              className="border-l-4 border-l-[#6FA3DE] bg-white/4 p-5 rounded-r-xl border-t border-r border-b border-white/10 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#8FBCEA] flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Needs review
                </div>
              </div>
              <p className="text-sm text-zinc-100 leading-relaxed mb-3">
                {item.description || item.raw_input || 'Could not confidently parse this transaction.'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                {item.amount !== null && (
                  <span>
                    Best guess: <span className="font-mono font-bold text-[#8FBCEA]">R{item.amount.toFixed(2)}</span>
                  </span>
                )}
                <span>
                  Category: <span className="font-semibold text-zinc-200">{item.category}</span>
                </span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id ?? idx}
            className="border-l-4 border-l-vanta-navy bg-white/4 p-6 border-t border-r border-b border-white/10 backdrop-blur-sm rounded-r-xl space-y-4"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/45 mb-1 font-bold">Category</div>
                <div className="text-lg font-serif font-bold text-zinc-100">{item.category}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-white/45 mb-1 font-bold">Amount</div>
                <div className="text-xl font-mono font-bold text-[#8FBCEA] flex items-center gap-1 justify-end">
                  {item.direction === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  R{(item.amount ?? 0).toFixed(2)}
                </div>
              </div>
            </div>
            {item.description && <p className="text-sm text-white/55">{item.description}</p>}
          </div>
        );
      })}
    </div>
  );

  const isEmpty = messages.length === 1 && messages[0].id === 'welcome';

  const quickPrompts = [
    { icon: Banknote, label: 'Log a sale', prompt: 'sold 20 loaves R400 cash' },
    { icon: Receipt, label: 'Log an expense', prompt: 'bought flour for R180' },
    { icon: MessageCircleQuestion, label: "Ask how you're doing", prompt: "how's business this week?" },
  ];

  const suggestionCards = [
    {
      icon: Banknote,
      tag: 'Try it',
      title: 'Log a sale',
      body: 'Tell Vanta what you sold and for how much — it\'ll file it under Sales automatically.',
      prompt: 'sold 20 loaves R400 cash',
    },
    {
      icon: Receipt,
      tag: 'Try it',
      title: 'Log an expense',
      body: 'Describe what you bought for the business and Vanta will categorize it for you.',
      prompt: 'bought flour for R180',
    },
    {
      icon: Upload,
      tag: 'Beta',
      title: 'Upload your records',
      body: 'Attach an Excel or CSV file instead of typing each transaction out.',
      prompt: null,
    },
  ];

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

      {/* Light beam — wide halo, tight streak and filament, all in the single blue accent */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-3xl opacity-25 transition-opacity duration-500 group-focus-within:opacity-60"
        style={{ background: BEAM_GRADIENT }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-7 w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-xl opacity-30 transition-opacity duration-500 group-focus-within:opacity-70"
        style={{ background: BEAM_GRADIENT }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-px w-[108%] -translate-x-1/2 -translate-y-1/2 opacity-0 blur-[1px] transition-opacity duration-500 group-focus-within:opacity-80"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #6FA3DE 40%, #6FA3DE 60%, transparent 100%)',
        }}
      />

      {/* Gradient-bordered pill */}
      <div
        className="relative rounded-full p-px transition-shadow duration-500 group-focus-within:shadow-[0_0_30px_-8px_rgba(30,90,168,0.55)]"
        style={{ background: BORDER_GRADIENT }}
      >
        <div className="relative flex items-center rounded-full bg-[#0E131A]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Excel or CSV file"
            className="absolute left-3 p-2 text-white/45 hover:text-[#8FBCEA] transition-colors rounded-full hover:bg-white/10"
          >
            <Upload size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell Vanta about a sale or expense…"
            className="w-full bg-transparent py-4 pl-12 pr-24 sm:pr-32 text-zinc-100 placeholder-white/35 focus:outline-none rounded-full text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="group/send absolute right-2 top-2 bottom-2 bg-vanta-navy text-white px-4 sm:px-6 text-xs font-semibold hover:bg-[#2A6DC4] transition-all disabled:opacity-40 flex items-center gap-1.5 sm:gap-2 rounded-full active:scale-[0.97]"
          >
            <span className="hidden sm:inline">Send</span>
            <ArrowRight size={14} className="transition-transform group-hover/send:translate-x-0.5" />
          </button>
        </div>
      </div>
    </form>
  );

  if (isEmpty) {
    return (
      <div
        className="flex-1 flex flex-col h-full relative overflow-y-auto overflow-x-hidden"
        style={{ background: APP_SURFACE }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 45% at 50% 8%, rgba(30,90,168,0.16), transparent 70%)',
          }}
        />
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 min-h-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-20 h-20 mb-8"
          >
            <div className="absolute inset-0 rounded-full bg-vanta-navy/25 blur-2xl" />
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(30,90,168,0.35)]"
              style={{ background: 'radial-gradient(circle at 32% 28%, #6FA3DE, #1E5AA8 55%, #153F78 100%)' }}
            >
              <Sparkles size={28} className="text-white/90" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-2xl md:text-3xl font-serif font-bold text-zinc-50 text-center mb-2"
          >
            What happened in your business today?
          </motion.h1>
          <p className="text-white/55 text-sm text-center max-w-md mb-8">
            Tell Vanta about a sale or expense in plain language — no forms, no spreadsheets.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-6"
          >
            {quickPrompts.map((q) => (
              <button
                key={q.label}
                onClick={() => handleQuickPrompt(q.prompt)}
                className="inline-flex items-center gap-1.5 bg-white/6 border border-white/12 hover:border-white/25 hover:bg-white/10 px-4 py-2 rounded-full text-xs font-semibold text-zinc-100 transition-colors backdrop-blur-sm"
              >
                <q.icon size={14} className="text-[#8FBCEA]" />
                {q.label}
              </button>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full max-w-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] rounded-3xl p-3"
          >
            {inputBar}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-8"
          >
            {suggestionCards.map((card) => (
              <button
                key={card.title}
                onClick={() => (card.prompt ? handleQuickPrompt(card.prompt) : fileInputRef.current?.click())}
                style={{ background: RAISED_SURFACE }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_22px_44px_-18px_rgba(0,0,0,0.65),0_0_34px_-12px_rgba(30,90,168,0.7)]"
              >
                {/* Blue bloom bleeding in from the corner */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-vanta-navy opacity-30 blur-2xl transition-opacity duration-300 group-hover:opacity-55"
                />

                <div className="relative flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[#8FBCEA] group-hover:bg-vanta-navy group-hover:border-transparent group-hover:text-white transition-colors">
                    <card.icon size={16} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                    {card.tag}
                  </span>
                </div>
                <div className="relative text-sm font-bold text-white mb-1">{card.title}</div>
                <div className="relative text-xs text-white/55 leading-relaxed">{card.body}</div>
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden" style={{ background: APP_SURFACE }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 55% 40% at 50% 0%, rgba(30,90,168,0.14), transparent 70%)',
        }}
      />

      <div className="relative px-6 md:px-12 py-6 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <h1 className="text-2xl lg:text-3xl font-serif text-zinc-50 font-bold">Chat</h1>
        <p className="text-xs uppercase tracking-widest text-white/45 mt-1 font-semibold">
          Tell Vanta what happened, in your own words
        </p>
      </div>

      <div className="relative flex-1 overflow-y-auto px-6 md:px-12 pt-4 pb-52">
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
                <div className="bg-vanta-navy text-white p-4 rounded-2xl rounded-br-md max-w-xl shadow-[0_10px_24px_-12px_rgba(30,90,168,0.8)]">
                  {msg.content}
                </div>
              )}

              {msg.role === 'error' && (
                <div className="flex gap-4 max-w-2xl w-full">
                  <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/40 text-amber-300 shrink-0 flex items-center justify-center font-serif font-bold text-sm">
                    !
                  </div>
                  <div className="flex-1 bg-amber-400/5 p-5 border border-amber-400/30 rounded-2xl rounded-tl-md text-amber-200 text-sm">
                    {msg.content}
                  </div>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="flex gap-4 max-w-2xl w-full">
                  <div className="w-9 h-9 rounded-lg bg-vanta-navy text-white shrink-0 flex items-center justify-center font-serif font-bold text-sm shadow-[0_6px_16px_-6px_rgba(30,90,168,0.9)]">
                    V
                  </div>
                  <div className="flex-1 bg-white/5 p-5 border border-white/10 rounded-2xl rounded-tl-md backdrop-blur-sm">
                    <div className="text-zinc-100 text-sm leading-relaxed">{msg.content}</div>
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
              <div className="flex-1 bg-white/5 p-4 border border-white/10 rounded-2xl rounded-tl-md text-white/50 text-sm italic flex items-center backdrop-blur-sm">
                Thinking…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-30">
        <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] rounded-3xl p-3 space-y-2.5">
          <div className="flex items-center gap-2 overflow-x-auto px-1 pt-1">
            {quickPrompts.map((q) => (
              <button
                key={q.label}
                onClick={() => handleQuickPrompt(q.prompt)}
                className="inline-flex items-center gap-1.5 bg-white/6 border border-white/10 hover:bg-white/12 hover:border-white/20 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-100 transition-colors shrink-0"
              >
                <q.icon size={13} className="text-[#8FBCEA]" />
                {q.label}
              </button>
            ))}
          </div>

          {inputBar}
        </div>
      </div>
    </div>
  );
}
