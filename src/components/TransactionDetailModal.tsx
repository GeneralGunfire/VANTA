import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Calendar, Tag, ArrowUpRight, ArrowDownLeft, Pencil, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Modal from './Modal';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';
import { cn } from '../lib/utils';

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
  supplier_name?: string | null;
}

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  /** Called with the saved transaction after a correction persists, so the caller can update its local list. */
  onCorrected?: (updated: Transaction) => void;
  /** Called after the user confirms deletion — caller owns the actual soft-delete write. */
  onDelete?: (transaction: Transaction) => Promise<void>;
}

const CATEGORIES = ['Sales', 'Stock', 'Rent', 'Utilities', 'Transport', 'Wages', 'Other'];

/**
 * Persists a correction via the record-correction edge function (writes a
 * correction_history row) and separately updates the transaction row
 * itself so the ledger reflects the fix immediately. record-correction
 * was built in an earlier pass but never called from the frontend — this
 * is the first real caller.
 */
async function persistCorrection(field: 'category' | 'amount' | 'description', transactionId: string, before: string, after: string) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error: fnError } = await supabase.functions.invoke('record-correction', {
    body: { transaction_id: transactionId, field, before_value: before, after_value: after },
    headers: { 'x-vanta-anon-id': getAnonId() },
  });
  if (fnError) throw fnError;

  const updatePayload: Record<string, string | number> =
    field === 'amount' ? { amount: Number(after) } : { [field]: after };

  const { data, error } = await supabase.from('transactions').update(updatePayload).eq('id', transactionId).select().single();
  if (error) throw error;
  return data as Transaction;
}

export default function TransactionDetailModal({ transaction, onClose, onCorrected, onDelete }: TransactionDetailModalProps) {
  const isOpen = transaction !== null;

  const [editingField, setEditingField] = useState<'category' | 'amount' | 'description' | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEditingField(null);
      setDraftValue('');
      setConfirmingDelete(false);
    }
  }, [isOpen]);

  if (!transaction) return null;

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(transaction);
      toast.success('Transaction deleted — restore it from Recently Deleted if needed');
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not delete — try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(transaction.date || transaction.created_at).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isIn = transaction.direction === 'in';

  const startEdit = (field: 'category' | 'amount' | 'description', current: string) => {
    setEditingField(field);
    setDraftValue(current);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setDraftValue('');
  };

  const saveEdit = async (field: 'category' | 'amount' | 'description', before: string) => {
    if (draftValue === before) {
      cancelEdit();
      return;
    }
    setIsSaving(true);
    try {
      const updated = await persistCorrection(field, transaction.id, before, draftValue);
      onCorrected?.(updated);
      toast.success('Correction saved');
      cancelEdit();
    } catch (err: any) {
      console.error('Failed to save correction:', err);
      toast.error(err?.message ?? 'Could not save — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Transaction"
      title={transaction.description || 'Untitled'}
      footer={
        <div className="flex items-center justify-between w-full">
          {onDelete && (
            confirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-vanta-gray">Delete this transaction?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-xs font-semibold uppercase tracking-widest text-vanta-black border border-vanta-black px-3 py-1.5 rounded-lg hover:bg-vanta-black hover:text-white transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting…' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs font-semibold uppercase tracking-widest text-vanta-gray hover:text-vanta-black transition-colors px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-vanta-gray hover:text-vanta-black transition-colors px-3 py-2 rounded-lg border border-vanta-border hover:border-vanta-border-strong"
              >
                <Trash2 size={12} />
                Delete
              </button>
            )
          )}
          <button
            onClick={onClose}
            className="bg-vanta-navy text-white px-5 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-vanta-navy-dark transition-colors rounded-lg ml-auto"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        <div className="p-6 bg-vanta-sidebar border border-vanta-border rounded-xl flex items-center justify-between">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1 flex items-center gap-1.5">
              Amount
              {editingField !== 'amount' && (
                <button onClick={() => startEdit('amount', String(transaction.amount ?? 0))} aria-label="Edit amount" className="text-vanta-gray hover:text-vanta-black">
                  <Pencil size={11} />
                </button>
              )}
            </div>
            {editingField === 'amount' ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  inputMode="decimal"
                  value={draftValue}
                  onChange={(e) => setDraftValue(e.target.value)}
                  className="text-xl font-mono font-bold text-vanta-black bg-white border border-vanta-border rounded-lg px-2 py-1 w-32"
                />
                <button onClick={() => saveEdit('amount', String(transaction.amount ?? 0))} disabled={isSaving} className="p-1.5 text-vanta-navy hover:text-vanta-navy-dark">
                  <Check size={16} />
                </button>
                <button onClick={cancelEdit} className="p-1.5 text-vanta-gray hover:text-vanta-black">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="text-2xl font-mono font-bold text-vanta-black">
                {isIn ? '+' : '-'}R{(transaction.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-white border border-vanta-border text-vanta-navy">
            {isIn ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
          </div>
        </div>

        {transaction.raw_input && (
          <div className="p-3 border border-vanta-border rounded-xl bg-vanta-sidebar">
            <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1">You said</div>
            <div className="text-sm text-vanta-black italic">{transaction.raw_input}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 border border-vanta-border rounded-xl col-span-2">
            <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-2 flex items-center gap-1.5">
              <Tag size={12} /> Category
              {editingField !== 'category' && (
                <button onClick={() => startEdit('category', transaction.category || 'Other')} aria-label="Edit category" className="text-vanta-gray hover:text-vanta-black">
                  <Pencil size={11} />
                </button>
              )}
            </div>
            {editingField === 'category' ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setDraftValue(c)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-full border transition-all',
                      draftValue === c ? 'bg-vanta-navy text-white border-vanta-navy' : 'bg-white text-vanta-gray border-vanta-border hover:text-vanta-black',
                    )}
                  >
                    {c}
                  </button>
                ))}
                <button onClick={() => saveEdit('category', transaction.category || 'Other')} disabled={isSaving} className="p-1.5 text-vanta-navy hover:text-vanta-navy-dark ml-1">
                  <Check size={16} />
                </button>
                <button onClick={cancelEdit} className="p-1.5 text-vanta-gray hover:text-vanta-black">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="font-medium text-vanta-black">{transaction.category || 'Other'}</div>
            )}
          </div>

          <div className="p-3 border border-vanta-border rounded-xl">
            <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1 flex items-center gap-1">
              <Calendar size={12} /> Date & time
            </div>
            <div className="font-medium text-vanta-black text-xs">{formattedDate}</div>
          </div>

          <div className="p-3 border border-vanta-border rounded-xl">
            <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1">Direction</div>
            <div className="font-medium text-xs text-vanta-black">{isIn ? 'Money in' : 'Money out'}</div>
          </div>

          <div
            className={cn('p-3 rounded-xl col-span-2', transaction.needs_review ? 'border-2 border-vanta-black' : 'border border-vanta-border')}
          >
            <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1">Status</div>
            {transaction.needs_review ? (
              <div className="flex items-center gap-1.5 font-medium text-xs text-vanta-black">
                <AlertTriangle size={14} /> Needs review
              </div>
            ) : (
              <div className="flex items-center gap-1.5 font-medium text-xs text-vanta-black">
                <CheckCircle2 size={14} /> Confirmed
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
