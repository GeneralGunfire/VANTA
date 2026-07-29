import React from 'react';
import { CheckCircle2, AlertTriangle, Calendar, Tag, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import Modal from './Modal';

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
  const isOpen = transaction !== null;
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Transaction"
      title={transaction.description || 'Untitled'}
      footer={
        <button
          onClick={onClose}
          className="bg-vanta-navy text-white px-5 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-vanta-navy-dark transition-colors rounded-lg"
        >
          Done
        </button>
      }
    >
      <div className="p-6 space-y-6">
        <div className="p-6 bg-vanta-sidebar border border-vanta-border rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1">Amount</div>
            <div className="text-2xl font-mono font-bold text-vanta-black">
              {isIn ? '+' : '-'}R{(transaction.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
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
          <div className="p-3 border border-vanta-border rounded-xl">
            <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1 flex items-center gap-1">
              <Tag size={12} /> Category
            </div>
            <div className="font-medium text-vanta-black">{transaction.category || 'Other'}</div>
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
            className={`p-3 rounded-xl ${
              transaction.needs_review ? 'border-2 border-vanta-black' : 'border border-vanta-border'
            }`}
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
