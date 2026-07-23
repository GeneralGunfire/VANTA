import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Upload, AlertTriangle, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

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
              className="border-l-4 border-vanta-navy bg-white p-5 rounded-r-sm border-t border-r border-b border-vanta-border shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-vanta-navy flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Needs review
                </div>
              </div>
              <p className="text-sm text-vanta-navy leading-relaxed mb-3">
                {item.description || item.raw_input || 'Could not confidently parse this transaction.'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-vanta-gray">
                {item.amount !== null && (
                  <span>
                    Best guess: <span className="font-mono font-bold text-vanta-navy">R{item.amount.toFixed(2)}</span>
                  </span>
                )}
                <span>
                  Category: <span className="font-semibold text-vanta-navy">{item.category}</span>
                </span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id ?? idx}
            className="border-l-4 border-vanta-navy bg-white p-6 border-t border-r border-b border-vanta-border shadow-sm rounded-r-md space-y-4"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1 font-bold">Category</div>
                <div className="text-lg font-serif font-bold text-vanta-navy">{item.category}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1 font-bold">Amount</div>
                <div className="text-xl font-mono font-bold text-vanta-navy flex items-center gap-1 justify-end">
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

  return (
    <div className="flex-1 flex flex-col h-full bg-vanta-bg relative overflow-hidden">
      <div className="px-6 md:px-12 py-6 border-b border-vanta-border bg-white shadow-xs">
        <h1 className="text-2xl lg:text-3xl font-serif text-vanta-navy font-bold">Chat</h1>
        <p className="text-xs uppercase tracking-widest text-vanta-gray mt-1 font-semibold">
          Tell Vanta what happened, in your own words
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-12 pt-4 pb-52">
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
                <div className="bg-vanta-navy text-white p-4 rounded-md max-w-xl shadow-sm">{msg.content}</div>
              )}

              {msg.role === 'error' && (
                <div className="flex gap-4 max-w-2xl w-full">
                  <div className="w-9 h-9 rounded-xs bg-white border-2 border-vanta-navy text-vanta-navy flex-shrink-0 flex items-center justify-center font-serif font-bold text-sm">
                    !
                  </div>
                  <div className="flex-1 bg-white p-5 border-2 border-vanta-navy rounded-md text-vanta-navy text-sm">
                    {msg.content}
                  </div>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="flex gap-4 max-w-2xl w-full">
                  <div className="w-9 h-9 rounded-xs bg-vanta-navy text-white flex-shrink-0 flex items-center justify-center font-serif font-bold text-sm">
                    V
                  </div>
                  <div className="flex-1 bg-white p-5 border border-vanta-border rounded-md shadow-sm">
                    <div className="text-vanta-navy text-sm leading-relaxed">{msg.content}</div>
                    {msg.transactions && renderTransactionCards(msg.transactions)}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex gap-4 max-w-2xl">
              <div className="w-9 h-9 rounded-xs bg-vanta-navy text-white flex-shrink-0 flex items-center justify-center animate-pulse">
                <RefreshCw size={15} className="animate-spin" />
              </div>
              <div className="flex-1 bg-white p-4 border border-vanta-border rounded-md text-vanta-gray text-sm italic flex items-center">
                Thinking…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-30">
        <div className="max-w-4xl mx-auto bg-white border border-vanta-border shadow-xl rounded-md p-4 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] uppercase tracking-widest text-vanta-navy font-bold flex-shrink-0">Try:</span>
            <button
              onClick={() => handleQuickPrompt('sold 20 loaves R400 cash')}
              className="bg-vanta-bg border border-vanta-border hover:border-vanta-navy px-3 py-1.5 text-vanta-navy text-xs font-medium truncate transition-colors rounded-xs flex-shrink-0"
            >
              "sold 20 loaves R400 cash"
            </button>
            <button
              onClick={() => handleQuickPrompt('bought flour for R180')}
              className="bg-vanta-bg border border-vanta-border hover:border-vanta-navy px-3 py-1.5 text-vanta-navy text-xs font-medium truncate transition-colors rounded-xs flex-shrink-0"
            >
              "bought flour for R180"
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative flex items-center">
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
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach Excel or CSV file"
              className="absolute left-3 p-2 text-vanta-gray hover:text-vanta-navy transition-colors rounded-xs hover:bg-vanta-bg"
            >
              <Upload size={18} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell Vanta about a sale or expense…"
              className="w-full bg-vanta-bg border border-vanta-border py-3.5 pl-12 pr-20 sm:pr-32 text-vanta-navy placeholder-gray-400 focus:outline-none focus:border-vanta-navy transition-all rounded-xs text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 bottom-2 bg-vanta-navy text-white px-3 sm:px-5 text-xs font-bold tracking-widest uppercase hover:bg-opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 rounded-xs"
            >
              <span className="hidden sm:inline">Send</span> <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
