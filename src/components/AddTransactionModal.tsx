import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Transaction } from './TransactionDetailModal';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newTx: Transaction) => void;
}

/**
 * Manual entry still goes through the real parse-transaction pipeline
 * (same confidence scoring, needs_review flag, and raw_input audit trail
 * as chat) rather than inserting directly into the transactions table —
 * this form is just a plain-language box, not a raw ledger-row form,
 * matching the product's "describe it, AI parses it" model everywhere
 * transactions get created.
 */
export default function AddTransactionModal({ isOpen, onClose, onAdd }: AddTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (!supabase) throw new Error('Supabase is not configured.');

      const { data, error: fnError } = await supabase.functions.invoke('parse-transaction', {
        body: { raw_input: description, source: 'text' },
      });

      if (fnError) throw fnError;

      const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
      if (transactions.length === 0) {
        throw new Error("Couldn't parse that — try rephrasing it.");
      }

      transactions.forEach((t: Transaction) => onAdd(t));
      setDescription('');
      onClose();
    } catch (err: any) {
      console.error('Add transaction failed:', err);
      setError(err?.message ?? String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white border border-vanta-border shadow-2xl rounded-sm w-full max-w-md overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-vanta-border bg-vanta-sidebar">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-vanta-navy text-white flex items-center justify-center">
                <Plus size={16} />
              </div>
              <h3 className="font-serif font-bold text-lg text-vanta-navy">Add a transaction</h3>
            </div>
            <button onClick={onClose} className="text-vanta-gray hover:text-vanta-navy p-1 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-navy mb-2">
                What happened?
              </label>
              <textarea
                required
                rows={3}
                placeholder='e.g. "sold 20 loaves R400 cash" or "bought flour for R180"'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-vanta-bg border border-vanta-border p-3 text-sm text-vanta-navy focus:outline-none focus:border-vanta-navy rounded-sm resize-none"
              />
              <p className="text-xs text-vanta-gray mt-2">
                Describe it in your own words — Vanta will work out the amount, category, and direction.
              </p>
            </div>

            {error && (
              <div className="p-3 border-2 border-vanta-navy rounded-sm text-xs text-vanta-navy">{error}</div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-vanta-gray hover:text-vanta-navy transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="bg-vanta-navy text-white px-5 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-opacity-90 transition-opacity rounded-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Check size={14} />
                {isSubmitting ? 'Recording…' : 'Add'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
