import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertTriangle, Calendar, Tag, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export interface Transaction {
  id: string;
  created_at: string;
  amount: number | null;
  direction: 'in' | 'out' | null;
  category: string;
  description: string | null;
  raw_input?: string;
  date?: string;
  needs_review?: boolean;
  confidence?: number;
}

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  if (!transaction) return null;

  const formattedDate = new Date(transaction.date || transaction.created_at).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isIn = transaction.direction === 'in';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white border border-vanta-border shadow-2xl rounded-sm w-full max-w-lg overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-vanta-border bg-vanta-sidebar">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-vanta-gray font-semibold mb-1">Transaction</div>
              <h3 className="font-serif font-bold text-lg text-vanta-navy">{transaction.description || 'Untitled'}</h3>
            </div>
            <button onClick={onClose} className="text-vanta-gray hover:text-vanta-navy p-1 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-6 bg-vanta-bg border border-vanta-border rounded-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1">Amount</div>
                <div className="text-2xl font-mono font-bold text-vanta-navy">
                  {isIn ? '+' : '-'}R{(transaction.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 rounded-sm bg-white border border-vanta-border text-vanta-navy">
                {isIn ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
              </div>
            </div>

            {transaction.raw_input && (
              <div className="p-3 border border-vanta-border/60 rounded-sm bg-vanta-sidebar">
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1">You said</div>
                <div className="text-sm text-vanta-navy italic">{transaction.raw_input}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 border border-vanta-border/60 rounded-sm">
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1 flex items-center gap-1">
                  <Tag size={12} /> Category
                </div>
                <div className="font-medium text-vanta-navy">{transaction.category || 'Other'}</div>
              </div>

              <div className="p-3 border border-vanta-border/60 rounded-sm">
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Date & time
                </div>
                <div className="font-medium text-vanta-navy text-xs">{formattedDate}</div>
              </div>

              <div className="p-3 border border-vanta-border/60 rounded-sm">
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1">Direction</div>
                <div className="font-medium text-xs text-vanta-navy">{isIn ? 'Money in' : 'Money out'}</div>
              </div>

              <div className="p-3 border border-vanta-border/60 rounded-sm">
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1">Status</div>
                {transaction.needs_review ? (
                  <div className="flex items-center gap-1.5 font-medium text-xs text-vanta-navy">
                    <AlertTriangle size={14} /> Needs review
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 font-medium text-xs text-vanta-navy">
                    <CheckCircle2 size={14} /> Confirmed
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-vanta-sidebar border-t border-vanta-border flex justify-end">
            <button
              onClick={onClose}
              className="bg-vanta-navy text-white px-5 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-opacity-90 transition-opacity rounded-sm"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
