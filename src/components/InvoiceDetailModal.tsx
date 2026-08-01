import { useEffect, useState } from 'react';
import { FileText, Check, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Modal from './Modal';
import type { Invoice } from '../hooks/useInvoices';

const fmt = (n: number) => `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Invoice['status']) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

/**
 * Plain, clean on-screen invoice preview — no PDF generation or email
 * delivery tonight (see final report). "Mark as sent" / "Mark as paid" are
 * manual status changes only; nothing is actually transmitted anywhere.
 */
export default function InvoiceDetailModal({ invoice, onClose, onUpdateStatus, onDelete }: InvoiceDetailModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!invoice) setConfirmingDelete(false);
  }, [invoice]);

  if (!invoice) return null;

  const handleStatusChange = async (status: Invoice['status']) => {
    try {
      await onUpdateStatus(invoice.id, status);
      toast.success(`Marked as ${status}`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not update — try again.');
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(invoice.id);
      toast.success('Invoice deleted — restore it from Recently Deleted if needed');
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not delete — try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={invoice !== null} onClose={onClose} eyebrow={`Invoice · ${invoice.status}`} title={`Bill to ${invoice.recipient_name}`} icon={<FileText size={16} />} maxWidth="max-w-lg">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-vanta-gray mb-0.5">From</div>
            <div className="text-vanta-black font-medium">Vanta Books</div>
          </div>
          <div className="text-right">
            <div className="text-vanta-gray mb-0.5">Date</div>
            <div className="text-vanta-black font-mono">
              {new Date(invoice.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="border border-vanta-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-vanta-sidebar text-vanta-gray uppercase tracking-wider text-[10px]">
                <th className="text-left font-semibold px-4 py-2.5">Description</th>
                <th className="text-right font-semibold px-4 py-2.5">Qty</th>
                <th className="text-right font-semibold px-4 py-2.5">Unit price</th>
                <th className="text-right font-semibold px-4 py-2.5">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vanta-border/60">
              {invoice.line_items.map((li, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5 text-vanta-black">{li.description}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-vanta-gray">{li.quantity}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-vanta-gray">{fmt(li.unit_price)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-vanta-black">{fmt(li.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-vanta-border bg-vanta-sidebar">
            <span className="text-xs font-semibold uppercase tracking-widest text-vanta-black">Total</span>
            <span className="text-sm font-mono font-semibold text-vanta-black">{fmt(invoice.total)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {onDelete && (
            confirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-vanta-gray">Delete this invoice?</span>
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
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-vanta-gray hover:text-vanta-black transition-colors border border-vanta-border rounded-lg"
              >
                <Trash2 size={12} />
                Delete
              </button>
            )
          )}
          <div className="flex justify-end gap-3 ml-auto">
            {invoice.status === 'draft' && (
              <button
                onClick={() => handleStatusChange('sent')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-vanta-gray hover:text-vanta-black transition-colors border border-vanta-border rounded-lg"
              >
                <Send size={12} />
                Mark as sent
              </button>
            )}
            {invoice.status === 'sent' && (
              <button
                onClick={() => handleStatusChange('paid')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white bg-vanta-navy hover:bg-vanta-navy-dark transition-colors rounded-lg"
              >
                <Check size={12} />
                Mark as paid
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
