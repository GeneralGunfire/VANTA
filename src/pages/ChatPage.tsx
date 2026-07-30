import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Upload, AlertTriangle, ArrowUpRight, ArrowDownLeft, RefreshCw, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';
import { cn } from '../lib/utils';
import { SHADOW_MD } from '../lib/surfaces';
import type { AppShellContext } from '../layouts/AppLayout';
import { useTransactions } from '../hooks/useTransactions';
import { MetricStrip } from '../components/dashboard/MetricStrip';
import { BusinessTrendChart } from '../components/dashboard/BusinessTrendChart';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { QuickActions } from '../components/dashboard/QuickActions';
import TransactionDetailModal, { Transaction } from '../components/TransactionDetailModal';

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);

  const { transactions, isLoading: dashboardLoading, loadError: dashboardError } = useTransactions();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Collapses the sidebar while the composer is active. Blurring restores it,
  // so the nav is always one click (or Escape) away.
  const { setComposerFocused } = useOutletContext<AppShellContext>();

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
    const prefill = (location.state as { prefill?: string } | null)?.prefill;
    if (!prefill) return;
    setInput(prefill);
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
        headers: { 'x-vanta-anon-id': getAnonId() },
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

  /** Supplementary business context beside the composer — never the hero. */
  const dashboardRail = (
    <div className="w-full lg:w-80 shrink-0 space-y-4">
      {dashboardError && (
        <div role="alert" className="flex items-center gap-2 text-xs text-vanta-black px-1">
          <AlertTriangle size={13} className="shrink-0" />
          Couldn't load transactions: {dashboardError}
        </div>
      )}
      <MetricStrip transactions={transactions} isLoading={dashboardLoading} />
      <BusinessTrendChart transactions={transactions} isLoading={dashboardLoading} />
      <ActivityFeed transactions={transactions} isLoading={dashboardLoading} onSelect={setSelectedTx} />
    </div>
  );

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

      <div
        className="relative flex items-center rounded-2xl border border-vanta-border bg-white transition-shadow duration-150 group-focus-within:border-vanta-navy/40 group-focus-within:ring-4 group-focus-within:ring-vanta-navy/8"
        style={{ boxShadow: SHADOW_MD }}
      >
        <span className="pl-4.5 pr-1 text-vanta-gray-light text-[15px] font-medium select-none" aria-hidden="true">
          R
        </span>
        <input
          ref={composerRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setComposerFocused(true)}
          onBlur={() => setComposerFocused(false)}
          placeholder="Tell me what happened…"
          className="w-full bg-transparent py-4.5 pr-28 text-vanta-black placeholder-vanta-gray-light focus:outline-none text-[15px]"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach an Excel or CSV file"
            className="p-2 text-vanta-gray hover:text-vanta-black transition-colors duration-150 rounded-lg hover:bg-muted"
          >
            <Upload size={16} />
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            title="Send"
            className="w-8 h-8 rounded-full bg-vanta-navy text-white flex items-center justify-center transition-all duration-150 disabled:opacity-30 hover:bg-vanta-navy-dark active:scale-[0.95]"
          >
            <Send size={14} />
          </button>
        </div>
        {!input && (
          <span className="absolute right-28 top-1/2 -translate-y-1/2 text-[11px] font-mono text-vanta-gray-light bg-muted border border-vanta-border rounded px-1.5 py-0.5 pointer-events-none hidden sm:inline-block">
            Enter
          </span>
        )}
      </div>
    </form>
  );

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto overflow-x-hidden">
        <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
        <div className="relative flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-10 px-6 py-16 min-h-full max-w-6xl mx-auto w-full">
        <div className="flex-1 flex flex-col items-center min-w-0">
          {/* Woven wireframe rings — decorative, tuned to the two brand colors (near-black + accent blue) so it reads as Vanta, not generic AI-demo flavor */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{
              opacity: { duration: 0.7 },
              scale: { duration: 0.7 },
              y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="relative w-64 h-64 mb-4"
          >
            {/* Wide ambient glow — the hero moment behind the orb, tuned brighter so the canvas doesn't read as flat white */}
            <motion.div
              animate={{ opacity: [0.35, 0.55, 0.35], scale: [0.95, 1.1, 0.95] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-16 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(46,110,191,0.28) 0%, rgba(30,90,168,0.14) 45%, transparent 70%)' }}
            />
            {/* Tighter core shadow, grounds the orb */}
            <motion.div
              animate={{ opacity: [0.25, 0.4, 0.25], scale: [0.9, 1.05, 0.9] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-8 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(30,90,168,0.28) 0%, rgba(28,28,28,0.1) 55%, transparent 75%)' }}
            />

            {/* Four counter-rotating ring layers, near-black fading to accent blue */}
            {[
              { dur: 16, dir: 360, tilt: 0, delayRings: [0, 30, 60] },
              { dur: 22, dir: -360, tilt: 45, delayRings: [15, 50, 80] },
              { dur: 28, dir: 360, tilt: 90, delayRings: [10, 40, 70] },
              { dur: 34, dir: -360, tilt: 135, delayRings: [5, 55, 95] },
            ].map((layer, li) => (
              <motion.svg
                key={li}
                viewBox="0 0 200 200"
                className="absolute inset-0 w-full h-full"
                animate={{ rotate: layer.dir }}
                transition={{ duration: layer.dur, repeat: Infinity, ease: 'linear' }}
                style={{ filter: 'drop-shadow(0 3px 8px rgba(28,28,28,0.18))' }}
              >
                <defs>
                  <linearGradient id={`ringGrad${li}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1C1C1C" stopOpacity="0.9" />
                    <stop offset="45%" stopColor="#1E5AA8" stopOpacity="0.65" />
                    <stop offset="75%" stopColor="#1E5AA8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#1E5AA8" stopOpacity="0.08" />
                  </linearGradient>
                </defs>
                {layer.delayRings.map((rot, ri) => (
                  <ellipse
                    key={ri}
                    cx="100"
                    cy="100"
                    rx="82"
                    ry={32 + ri * 11}
                    fill="none"
                    stroke={`url(#ringGrad${li})`}
                    strokeWidth={ri === 0 ? 2 : 1.1}
                    transform={`rotate(${layer.tilt + rot} 100 100)`}
                    opacity={0.9 - ri * 0.18}
                  />
                ))}
              </motion.svg>
            ))}
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-serif text-vanta-black text-center mb-3 leading-tight max-w-xl">
            What happened in your business today?
          </h1>
          <p className="text-base text-vanta-gray text-center mb-10">
            Tell me in plain language — I'll keep the books.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full max-w-2xl"
          >
            {inputBar}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="w-full max-w-2xl mt-6"
          >
            <QuickActions onSelect={handleQuickPrompt} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
        >
          {dashboardRail}
        </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      <div className="relative flex-1 overflow-y-auto px-6 md:px-12 pt-8 pb-40">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0 space-y-6">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}
            >
              {msg.role === 'user' && (
                <div className="text-white p-4 rounded-2xl rounded-br-md max-w-xl shadow-[0_6px_18px_-8px_rgba(30,90,168,0.5)]" style={{ background: 'linear-gradient(155deg, #2E6EBF 0%, #1E5AA8 60%, #153F78 100%)' }}>
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
                  <div className="w-9 h-9 rounded-lg text-white shrink-0 flex items-center justify-center font-serif font-semibold text-sm shadow-[0_4px_12px_-4px_rgba(30,90,168,0.6)]" style={{ background: 'linear-gradient(155deg, #2E6EBF 0%, #1E5AA8 60%, #153F78 100%)' }}>
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
              <div className="w-9 h-9 rounded-lg text-white shrink-0 flex items-center justify-center animate-pulse shadow-[0_4px_12px_-4px_rgba(30,90,168,0.6)]" style={{ background: 'linear-gradient(155deg, #2E6EBF 0%, #1E5AA8 60%, #153F78 100%)' }}>
                <RefreshCw size={15} className="animate-spin" />
              </div>
              <div className="flex-1 bg-white p-4 border border-vanta-border rounded-2xl rounded-tl-md text-vanta-gray text-sm italic flex items-center">
                Thinking…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="hidden lg:block">{dashboardRail}</div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-30">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 space-y-3">
            {inputBar}
            <QuickActions onSelect={handleQuickPrompt} />
          </div>
          <div className="hidden lg:block w-80 shrink-0" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
