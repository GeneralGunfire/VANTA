import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollText, ArrowRight } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useDebts } from '../hooks/useDebts';
import { buildBrief, answerFollowUp, type FollowUpAnswer } from '../lib/brief';
import { cn } from '../lib/utils';

type FollowUpKey = 'why' | 'biggest-expense' | 'compare' | 'worry';

const FOLLOW_UPS: { key: FollowUpKey; label: string }[] = [
  { key: 'why', label: 'Why?' },
  { key: 'biggest-expense', label: 'What was my biggest expense?' },
  { key: 'compare', label: 'How does this compare to last week?' },
  { key: 'worry', label: 'What should I worry about?' },
];

/**
 * The Vanta Brief — a calm, editorial weekly summary in plain language.
 * Deliberately not a dashboard: no stat grid, no chart, no table. Every
 * figure comes from buildBrief() in lib/brief.ts, which only does real
 * arithmetic over already-fetched transaction/debt rows — nothing here is
 * estimated or phrased by a model.
 */
export default function BriefPage() {
  const { transactions, isLoading: txLoading, loadError: txError } = useTransactions();
  const { debts, isLoading: debtsLoading } = useDebts();
  const [activeAnswers, setActiveAnswers] = useState<FollowUpAnswer[]>([]);
  const isLoading = txLoading || debtsLoading;

  const brief = buildBrief(transactions, debts);

  const handleFollowUp = (key: FollowUpKey) => {
    const already = activeAnswers.find((a) => a.question === FOLLOW_UPS.find((f) => f.key === key)?.label);
    if (already) return;
    const result = answerFollowUp(key, transactions, debts);
    setActiveAnswers((prev) => [...prev, result]);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="inline-flex items-center gap-2 text-vanta-navy mb-8"
        >
          <ScrollText size={16} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">Vanta Brief</span>
        </motion.div>

        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-9 w-64 rounded-md bg-vanta-sidebar animate-pulse" />
            <div className="h-5 w-full max-w-md rounded-md bg-vanta-sidebar animate-pulse mt-6" />
            <div className="h-5 w-5/6 rounded-md bg-vanta-sidebar animate-pulse" />
          </div>
        ) : txError ? (
          <p className="text-vanta-gray text-sm">Couldn't load your records: {txError}</p>
        ) : (
          <>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="font-serif text-3xl md:text-4xl text-vanta-black leading-tight mb-8"
            >
              Your business this week
            </motion.h1>

            <div className="space-y-4 mb-10">
              {brief.lines.map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.12 + i * 0.08 }}
                  className={cn(
                    'leading-relaxed text-vanta-black',
                    i === 0 ? 'text-xl md:text-2xl font-serif' : 'text-base md:text-lg text-vanta-gray',
                  )}
                >
                  {line}
                </motion.p>
              ))}
            </div>

            {brief.hasEnoughData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="pt-8 border-t border-vanta-border"
              >
                <div className="text-[11px] uppercase tracking-[0.08em] text-vanta-gray-light font-medium mb-3">
                  Ask Vanta
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {FOLLOW_UPS.map((f) => {
                    const answered = activeAnswers.some((a) => a.question === f.label);
                    return (
                      <button
                        key={f.key}
                        onClick={() => handleFollowUp(f.key)}
                        disabled={answered}
                        className={cn(
                          'text-[13px] px-3.5 py-2 rounded-full border transition-colors',
                          answered
                            ? 'border-transparent bg-vanta-accent-tint text-vanta-navy-dark cursor-default'
                            : 'border-vanta-border text-vanta-gray hover:text-vanta-black hover:border-vanta-border-strong',
                        )}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {activeAnswers.map((a) => (
                    <motion.div
                      key={a.question}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 flex gap-3"
                    >
                      <ArrowRight size={14} className="shrink-0 mt-1 text-vanta-gray-light" />
                      <div>
                        <div className="text-xs text-vanta-gray-light mb-0.5">{a.question}</div>
                        <p className="text-[15px] text-vanta-black leading-relaxed">{a.answer}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
