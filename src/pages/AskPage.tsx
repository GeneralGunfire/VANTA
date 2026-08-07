import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircleQuestion, Send, ArrowRight } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useDebts } from '../hooks/useDebts';
import { askVanta, type AskResult } from '../lib/askVanta';

const EXAMPLE_QUESTIONS = [
  'How much did I spend on stock this month?',
  'Who owes me money?',
  'What were my biggest expenses?',
  'How much money came in this week?',
];

interface AskEntry {
  id: string;
  question: string;
  result: AskResult;
}

/**
 * Ask Vanta — free-text questions about real recorded history. The point
 * isn't just answering; every answer shows its own working ("Based on 14
 * recorded purchases") and a direct link to the exact rows behind it, so
 * the answer is checkable, not just stated. See lib/askVanta.ts — every
 * case there is deterministic arithmetic, never a model guessing a figure.
 */
export default function AskPage() {
  const { transactions, isLoading: txLoading } = useTransactions();
  const { debts, isLoading: debtsLoading } = useDebts();
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<AskEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const isLoading = txLoading || debtsLoading;

  const ask = (question: string) => {
    if (!question.trim() || isLoading) return;
    const result = askVanta(question, transactions, debts);
    setEntries((prev) => [...prev, { id: `${Date.now()}`, question, result }]);
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-6 md:px-8 py-16 md:py-20">
        <div className="inline-flex items-center gap-2 text-vanta-navy mb-8">
          <MessageCircleQuestion size={16} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">Ask Vanta</span>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl text-vanta-black leading-tight mb-3">
          Ask about your business.
        </h1>
        <p className="text-vanta-gray text-base leading-relaxed mb-8">
          Questions about what's actually happened — every answer shows where it came from.
        </p>

        <form onSubmit={handleSubmit} className="relative mb-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. How much did I spend on stock this month?"
            disabled={isLoading}
            className="w-full bg-vanta-sidebar border border-vanta-border rounded-full py-3.5 pl-5 pr-12 text-[15px] text-vanta-black placeholder-vanta-gray-light focus:outline-none focus:border-vanta-navy/50 focus:bg-white transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            title="Ask"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-vanta-navy text-white flex items-center justify-center hover:bg-vanta-navy-dark transition-all disabled:opacity-30 active:scale-[0.95]"
          >
            <Send size={14} />
          </button>
        </form>

        {entries.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                disabled={isLoading}
                className="text-[13px] px-3.5 py-2 rounded-full border border-vanta-border text-vanta-gray hover:text-vanta-black hover:border-vanta-border-strong transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-6">
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="pt-6 border-t border-vanta-border first:border-t-0 first:pt-0"
              >
                <div className="text-[13px] text-vanta-gray-light mb-2">{entry.question}</div>
                <p className="text-lg text-vanta-black leading-relaxed font-serif">{entry.result.answer}</p>

                {entry.result.basis && (
                  <p className="text-[13px] text-vanta-gray mt-2">{entry.result.basis}</p>
                )}

                {entry.result.viewFilter && (
                  <button
                    onClick={() => navigate('/app/ledger', { state: entry.result.viewFilter })}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-vanta-navy hover:text-vanta-navy-dark transition-colors mt-3"
                  >
                    View transactions
                    <ArrowRight size={13} />
                  </button>
                )}

                {entry.result.redirect && (
                  <Link
                    to={entry.result.redirect.path}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-vanta-navy hover:text-vanta-navy-dark transition-colors mt-3"
                  >
                    {entry.result.redirect.label}
                    <ArrowRight size={13} />
                  </Link>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
