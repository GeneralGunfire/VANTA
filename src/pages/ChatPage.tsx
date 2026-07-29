import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
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

  const suggestionCards = [
    {
      title: 'Smart Budget',
      body: 'A budget that fits your lifestyle, not the other way around',
      prompt: 'sold 20 loaves R400 cash',
    },
    {
      title: 'Analytics',
      body: 'Analytics empowers individuals and businesses to make smarter',
      prompt: "how's business this week?",
    },
    {
      title: 'Spending',
      body: 'Spending is the way individuals and businesses use their financial',
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

      <div className="relative rounded-2xl">
        {/* Animated glow ring, brightens on focus */}
        <div
          aria-hidden="true"
          className="absolute -inset-px rounded-2xl opacity-40 blur-[2px] transition-opacity duration-300 group-focus-within:opacity-90"
          style={{
            background: 'linear-gradient(120deg, rgba(110,168,255,0.5), rgba(255,255,255,0.08) 30%, rgba(110,168,255,0.5) 60%, rgba(255,255,255,0.08))',
          }}
        />
        <div className="relative rounded-2xl bg-[#0B0F1A]/90 border border-white/10 group-focus-within:border-white/20 transition-colors backdrop-blur-sm">
        <input
          ref={composerRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setComposerFocused(true)}
          onBlur={() => setComposerFocused(false)}
          placeholder="Message AI Chat…"
          className="w-full bg-transparent pt-4 pb-12 px-4 text-zinc-100 placeholder-white/35 focus:outline-none text-sm"
        />
        <div className="absolute left-3 bottom-2.5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a file"
            className="p-2 text-white/45 hover:text-white/80 transition-colors rounded-lg hover:bg-white/10"
          >
            <Upload size={16} />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white/60 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ImagePlus size={15} />
            Create an image
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white/60 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Globe size={15} />
            Search the web
          </button>
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2.5 bottom-2.5 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/85 transition-all disabled:opacity-30 active:scale-[0.95]"
        >
          <Mic size={14} />
        </button>
        </div>
      </div>
    </form>
  );

  if (isEmpty) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

    return (
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto overflow-x-hidden">
        {/* Faint blue haze drifting across the whole canvas */}
        <motion.div
          aria-hidden="true"
          animate={{ opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 45% 35% at 50% 32%, rgba(45,120,255,0.16), transparent 70%)',
          }}
        />
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 min-h-full">
          {/* Blue energy orb — woven glowing wireframe rings, like the reference */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.7 },
              scale: { duration: 0.7 },
              y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="relative w-52 h-52 mb-4"
          >
            {/* Core glow */}
            <motion.div
              animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.9, 1.08, 0.9] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-6 rounded-full blur-2xl"
              style={{ background: 'radial-gradient(circle, rgba(64,140,255,0.9) 0%, rgba(20,80,200,0.4) 55%, transparent 75%)' }}
            />

            {/* Three counter-rotating ring layers */}
            {[
              { dur: 16, dir: 360, tilt: 0, delayRings: [0, 30, 60] },
              { dur: 22, dir: -360, tilt: 45, delayRings: [15, 50, 80] },
              { dur: 28, dir: 360, tilt: 90, delayRings: [10, 40, 70] },
            ].map((layer, li) => (
              <motion.svg
                key={li}
                viewBox="0 0 200 200"
                className="absolute inset-0 w-full h-full"
                animate={{ rotate: layer.dir }}
                transition={{ duration: layer.dur, repeat: Infinity, ease: 'linear' }}
                style={{ filter: 'drop-shadow(0 0 6px rgba(64,140,255,0.9)) drop-shadow(0 0 18px rgba(30,100,240,0.5))' }}
              >
                <defs>
                  <linearGradient id={`ringGrad${li}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EAF4FF" stopOpacity="0.95" />
                    <stop offset="35%" stopColor="#5CA8FF" stopOpacity="0.9" />
                    <stop offset="70%" stopColor="#1E5AC8" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#0A2C6E" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                {layer.delayRings.map((rot, ri) => (
                  <ellipse
                    key={ri}
                    cx="100"
                    cy="100"
                    rx="78"
                    ry={34 + ri * 10}
                    fill="none"
                    stroke={`url(#ringGrad${li})`}
                    strokeWidth={ri === 0 ? 1.6 : 0.9}
                    transform={`rotate(${layer.tilt + rot} 100 100)`}
                    opacity={0.9 - ri * 0.25}
                  />
                ))}
              </motion.svg>
            ))}

            {/* Fine particle shimmer */}
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-10 rounded-full"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(140,190,255,0.8) 0.5px, transparent 0.5px), radial-gradient(rgba(90,150,255,0.6) 0.5px, transparent 0.5px)',
                backgroundSize: '14px 14px, 9px 9px',
                backgroundPosition: '0 0, 5px 7px',
                maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
              }}
            />
          </motion.div>

          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-50 text-center mb-10">
            <TextGenerateEffect words={`${greeting}, User.`} />
            <br />
            <TextGenerateEffect words="Can I help you with anything?" className="text-white/70" />
          </h1>

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
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-6"
          >
            {suggestionCards.map((card) => (
              <MagicCard
                key={card.title}
                onClick={() => (card.prompt ? handleQuickPrompt(card.prompt) : fileInputRef.current?.click())}
              >
                <div className="text-sm font-semibold text-white mb-1">{card.title}</div>
                <div className="text-xs text-white/50 leading-relaxed">{card.body}</div>
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
        <div className="max-w-4xl mx-auto">{inputBar}</div>
      </div>
    </div>
  );
}
