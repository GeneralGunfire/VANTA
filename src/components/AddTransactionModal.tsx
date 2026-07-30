import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';
import Modal from './Modal';
import { Transaction } from './TransactionDetailModal';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { addTransactionSchema, type AddTransactionFormValues } from '../lib/schemas/transaction';

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
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddTransactionFormValues>({
    resolver: zodResolver(addTransactionSchema),
    defaultValues: { description: '' },
  });

  const onSubmit = async (values: AddTransactionFormValues) => {
    setServerError(null);

    try {
      if (!supabase) throw new Error('Supabase is not configured.');

      const { data, error: fnError } = await supabase.functions.invoke('parse-transaction', {
        body: { raw_input: values.description, source: 'text' },
        headers: { 'x-vanta-anon-id': getAnonId() },
      });

      if (fnError) throw fnError;

      const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
      if (transactions.length === 0) {
        throw new Error("Couldn't parse that — try rephrasing it.");
      }

      transactions.forEach((t: Transaction) => onAdd(t));
      reset();
      onClose();
      toast.success('Added to your ledger');
    } catch (err: any) {
      console.error('Add transaction failed:', err);
      // Stays inline, not a toast — the modal stays open so the user can
      // see the error right next to the field they're about to retry.
      setServerError(err?.message ?? String(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} eyebrow="New entry" title="Add a transaction" icon={<Plus size={16} />} maxWidth="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div>
          <Label htmlFor="description" className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">
            What happened?
          </Label>
          <Textarea
            id="description"
            rows={3}
            placeholder='e.g. "sold 20 loaves R400 cash" or "bought flour for R180"'
            className="w-full bg-white border-vanta-border text-sm text-vanta-black focus-visible:border-vanta-navy focus-visible:ring-vanta-navy/20 rounded-lg resize-none"
            {...register('description')}
          />
          {errors.description ? (
            <p className="text-xs text-vanta-black mt-2 flex items-center gap-1.5">
              <AlertTriangle size={12} className="shrink-0" />
              {errors.description.message}
            </p>
          ) : (
            <p className="text-xs text-vanta-gray mt-2">
              Describe it in your own words — Vanta will work out the amount, category, and direction.
            </p>
          )}
        </div>

        {serverError && (
          <div className="flex items-start gap-2 p-3 border-2 border-vanta-black rounded-lg text-xs text-vanta-black">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            {serverError}
          </div>
        )}

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-vanta-gray hover:text-vanta-black transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-vanta-navy text-white px-5 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-vanta-navy-dark transition-colors rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Check size={14} />
            {isSubmitting ? 'Recording…' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
