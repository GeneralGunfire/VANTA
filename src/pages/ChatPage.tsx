import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Upload, AlertTriangle, ArrowUpRight, ArrowDownLeft, RefreshCw, ImagePlus, Globe, Mic } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { MagicCard } from '../components/ui/magic-card';
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);

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

  // Templates and Explore hand a phrase over via router state. Load it into the
  // composer (never auto-send — the amounts are examples the owner must correct)
  // and clear the state so a refresh or back-navigation doesn't re-apply it.
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
              className="border-l-4 border-l-amber-500 bg-amber-50 p-5 rounded-r-xl border-t border-r border-b border-amber-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Needs review
                </div>
              </div>
              <p className="text-sm text-[#26282B] leading-relaxed mb-3">
                {item.description || item.raw_input || 'Could not confidently parse this transaction.'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B6E73]">
                {item.amount !== null && (
                  <span>
                    Best guess: <span className="font-mono font-semibold text-amber-700">R{item.amount.toFixed(2)}</span>
                  </span>
                )}
                <span>
                  Category: <span className="font-medium text-[#26282B]">{item.category}</span>
                </span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id ?? idx}
            className="border-l-4 border-l-[#26282B] bg-white p-6 border-t border-r border-b border-[#E5E6E8] rounded-r-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)] space-y-4"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#8A8D92] mb-1 font-semibold">Category</div>
                <div className="text-lg font-serif text-[#1B1C1E]">{item.category}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-[#8A8D92] mb-1 font-semibold">Amount</div>
                <div className="text-xl font-mono font-semibold text-[#1B1C1E] flex items-center gap-1 justify-end">
                  {item.direction === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  R{(item.amount ?? 0).toFixed(2)}
                </div>
              </div>
            </div>
            {item.description && <p className="text-sm text-[#6B6E73]">{item.description}</p>}
          </div>
        );
      })}
    </div>
  );

  const isEmpty = messages.length === 1 && messages[0].id === 'welcome';

  const suggestionCards = [
    {
      title: 'Smart Budget',
      body: 'A budget that fits your lifestyle, not the other way around',
      prompt: 'sold 20 loaves R400 cash',
    },
    {
      title: 'Analytics',
      body: 'Analytics empowers individuals and businesses to make smarter decisions',
      prompt: "how's business this week?",
    },
    {
      title: 'Spending',
      body: 'Spending is the way individuals and businesses use their financial resources',
      prompt: 'bought flour for R180',
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

      <div className="relative rounded-2xl bg-white border border-[#E5E6E8] shadow-[0_24px_60px_-24px_rgba(20,20,22,0.45),0_2px_8px_-2px_rgba(20,20,22,0.08)] group-focus-within:border-[#B8BABD] group-focus-within:shadow-[0_28px_70px_-24px_rgba(20,20,22,0.5),0_2px_8px_-2px_rgba(20,20,22,0.1)] transition-all">
        <input
          ref={composerRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setComposerFocused(true)}
          onBlur={() => setComposerFocused(false)}
          placeholder="Message AI Chat…"
          className="w-full bg-transparent pt-4.5 pb-12 px-4.5 text-[#26282B] placeholder-[#9B9EA2] focus:outline-none text-[15px]"
        />
        <div className="absolute left-3 bottom-2.5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a file"
            className="p-2 text-[#8A8D92] hover:text-[#26282B] transition-colors rounded-lg hover:bg-black/5"
          >
            <Upload size={16} />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#6B6E73] hover:text-[#26282B] hover:bg-black/5 rounded-lg transition-colors"
          >
            <ImagePlus size={15} />
            Create an image
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#6B6E73] hover:text-[#26282B] hover:bg-black/5 rounded-lg transition-colors"
          >
            <Globe size={15} />
            Search the web
          </button>
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2.5 bottom-2.5 w-8 h-8 rounded-full bg-[#26282B] text-white flex items-center justify-center hover:bg-[#1B1C1E] transition-all disabled:opacity-30 active:scale-[0.95]"
        >
          <Mic size={14} />
        </button>
      </div>
    </form>
  );

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto overflow-x-hidden">
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 min-h-full">
          {/* Ink-toned energy orb — woven wireframe rings, tuned dark so they read against the light marble canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{
              opacity: { duration: 0.7 },
              scale: { duration: 0.7 },
              y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="relative w-72 h-72 mb-6"
          >
            {/* Soft core shadow, grounds the orb against the light canvas */}
            <motion.div
              animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.9, 1.05, 0.9] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-8 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(38,40,43,0.4) 0%, rgba(38,40,43,0.12) 55%, transparent 75%)' }}
            />

            {/* Four counter-rotating ring layers, charcoal ink on white/pale-stone gradient */}
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
                style={{ filter: 'drop-shadow(0 3px 8px rgba(20,20,22,0.3))' }}
              >
                <defs>
                  <linearGradient id={`ringGrad${li}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1B1C1E" stopOpacity="0.95" />
                    <stop offset="45%" stopColor="#5A5D62" stopOpacity="0.75" />
                    <stop offset="75%" stopColor="#9B9EA2" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#C7CACD" stopOpacity="0.12" />
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
                    opacity={0.95 - ri * 0.2}
                  />
                ))}
              </motion.svg>
            ))}
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-serif text-[#1B1C1E] text-center mb-3 leading-tight">
            <TextGenerateEffect words="What happened in your business today?" />
          </h1>
          <p className="text-base text-[#6B6E73] text-center mb-10">
            <TextGenerateEffect words="Tell me in plain language — I'll keep the books." />
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full max-w-2xl"
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
              <MagicCard
                key={card.title}
                spotlightColor="rgba(20,20,22,0.08)"
                onClick={() => (card.prompt ? handleQuickPrompt(card.prompt) : fileInputRef.current?.click())}
                className="bg-white border-[#E5E6E8] hover:border-[#C7CACD] shadow-[0_10px_28px_-14px_rgba(20,20,22,0.22)] hover:shadow-[0_16px_36px_-14px_rgba(20,20,22,0.3)] hover:-translate-y-0.5 transition-transform p-5"
              >
                <div className="text-[15px] font-medium text-[#1B1C1E] mb-1.5">{card.title}</div>
                <div className="text-[13px] text-[#8A8D92] leading-relaxed">{card.body}</div>
              </MagicCard>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <div className="relative flex-1 overflow-y-auto px-6 md:px-12 pt-8 pb-52">
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
                <div className="bg-[#26282B] text-white p-4 rounded-2xl rounded-br-md max-w-xl shadow-[0_10px_24px_-12px_rgba(20,20,22,0.4)]">
                  {msg.content}
                </div>
              )}

              {msg.role === 'error' && (
                <div className="flex gap-4 max-w-2xl w-full">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-300 text-amber-600 shrink-0 flex items-center justify-center font-serif font-semibold text-sm">
                    !
                  </div>
                  <div className="flex-1 bg-amber-50 p-5 border border-amber-200 rounded-2xl rounded-tl-md text-amber-800 text-sm">
                    {msg.content}
                  </div>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="flex gap-4 max-w-2xl w-full">
                  <div className="w-9 h-9 rounded-lg bg-[#26282B] text-white shrink-0 flex items-center justify-center font-serif font-semibold text-sm shadow-[0_6px_16px_-6px_rgba(20,20,22,0.4)]">
                    V
                  </div>
                  <div className="flex-1 bg-white p-5 border border-[#E5E6E8] rounded-2xl rounded-tl-md shadow-[0_2px_12px_-6px_rgba(0,0,0,0.08)]">
                    <div className="text-[#26282B] text-sm leading-relaxed">{msg.content}</div>
                    {msg.transactions && renderTransactionCards(msg.transactions)}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex gap-4 max-w-2xl">
              <div className="w-9 h-9 rounded-lg bg-[#26282B] text-white shrink-0 flex items-center justify-center animate-pulse">
                <RefreshCw size={15} className="animate-spin" />
              </div>
              <div className="flex-1 bg-white p-4 border border-[#E5E6E8] rounded-2xl rounded-tl-md text-[#8A8D92] text-sm italic flex items-center shadow-[0_2px_12px_-6px_rgba(0,0,0,0.08)]">
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
