import { FileText, Check, Send } from 'lucide-react';
import { toast } from 'sonner';
import Modal from './Modal';
import type { Invoice } from '../hooks/useInvoices';

const fmt = (n: number) => `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Invoice['status']) => Promise<void>;
}

/**
 * Plain, clean on-screen invoice preview — no PDF generation or email
 * delivery tonight (see final report). "Mark as sent" / "Mark as paid" are
 * manual status changes only; nothing is actually transmitted anywhere.
 */
export default function InvoiceDetailModal({ invoice, onClose, onUpdateStatus }: InvoiceDetailModalProps) {
  if (!invoice) return null;

  const handleStatusChange = async (status: Invoice['status']) => {
    try {
      await onUpdateStatus(invoice.id, status);
      toast.success(`Marked as ${status}`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not update — try again.');
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

        <div className="flex justify-end gap-3">
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
    </Modal>
  );
}
