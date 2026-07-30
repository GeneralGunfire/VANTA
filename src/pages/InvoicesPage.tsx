import { useState } from 'react';
import { Plus, AlertTriangle, FileText } from 'lucide-react';
import { useInvoices, type Invoice } from '../hooks/useInvoices';
import AddInvoiceModal from '../components/AddInvoiceModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import { cn } from '../lib/utils';

const fmt = (n: number) => `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_LABEL: Record<Invoice['status'], string> = { draft: 'Draft', sent: 'Sent', paid: 'Paid' };

/**
 * Invoices can be created two ways: (a) from chat, e.g. "invoice Sipho for
 * 3 deliveries at R150 each" (see parse-transaction's invoice-request
 * detection), or (b) manually here via AddInvoiceModal. Both write the
 * same structured row — chat parsing just fills the form's fields from
 * natural language instead of a person typing them in directly.
 *
 * No PDF generation or email/WhatsApp delivery tonight — "sending" is a
 * manual status change only. See final report.
 */
export default function InvoicesPage() {
  const { invoices, isLoading, loadError, addInvoice, updateStatus } = useInvoices();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <AddInvoiceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addInvoice} />
      <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onUpdateStatus={updateStatus} />

      <div className="relative max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-2xl font-serif text-vanta-black tracking-tight">Invoices</h1>
            <p className="text-sm text-vanta-gray mt-1">Bill customers for work or goods</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-white px-5 py-2.5 text-xs font-semibold transition-all flex items-center gap-2 rounded-lg active:scale-[0.98] shadow-[0_6px_18px_-6px_rgba(30,90,168,0.55)] hover:shadow-[0_8px_22px_-6px_rgba(30,90,168,0.65)] hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(155deg, #2E6EBF 0%, #1E5AA8 60%, #153F78 100%)' }}
          >
            <Plus size={16} />
            Create invoice
          </button>
        </div>

        <div className="border border-vanta-border rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
          {isLoading ? (
            <div className="text-center py-16 text-vanta-gray text-sm italic">Loading…</div>
          ) : loadError ? (
            <div role="alert" className="flex items-center justify-center gap-2 py-16 text-vanta-black text-sm px-6">
              <AlertTriangle size={16} />
              Couldn't load invoices: {loadError}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-20 text-vanta-gray text-sm px-6 leading-relaxed flex flex-col items-center gap-3">
              <FileText size={20} className="text-vanta-gray-light" />
              No invoices yet — try "invoice Sipho for 3 deliveries at R150 each" in chat, or create one manually.
            </div>
          ) : (
            <div className="divide-y divide-vanta-border/60">
              {invoices.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-vanta-sidebar/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-vanta-black truncate">{inv.recipient_name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-vanta-gray-light mt-1">
                      {new Date(inv.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border',
                        inv.status === 'paid'
                          ? 'border-vanta-black text-vanta-black'
                          : 'border-vanta-border text-vanta-gray',
                      )}
                    >
                      {STATUS_LABEL[inv.status]}
                    </span>
                    <span className="font-mono text-sm text-vanta-black">{fmt(inv.total)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
