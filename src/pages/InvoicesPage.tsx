import { useState } from 'react';
import { Plus, AlertTriangle, FileText } from 'lucide-react';
import { useInvoices, type Invoice } from '../hooks/useInvoices';
import AddInvoiceModal from '../components/AddInvoiceModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import { cn } from '../lib/utils';
import { SHADOW_SM } from '../lib/surfaces';

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
  const { invoices, isLoading, loadError, addInvoice, updateStatus, deleteInvoice } = useInvoices();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <AddInvoiceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addInvoice} />
      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onUpdateStatus={updateStatus}
        onDelete={deleteInvoice}
      />

      <div className="relative max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-vanta-black">Invoices</h1>
            <p className="text-sm text-vanta-gray mt-1">Bill customers for work or goods.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-white px-4 py-2.5 text-[13px] font-medium transition-colors duration-150 flex items-center gap-1.5 rounded-lg active:scale-[0.98] bg-vanta-navy hover:bg-vanta-navy-dark"
          >
            <Plus size={15} />
            New invoice
          </button>
        </div>

        <div className="border border-vanta-border rounded-2xl overflow-hidden bg-white" style={{ boxShadow: SHADOW_SM }}>
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
              <span>
                <span className="text-vanta-black font-medium">No invoices yet.</span> Try "invoice Sipho for 3 deliveries at R150 each" in chat, or create one manually.
              </span>
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
                        'text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full',
                        inv.status === 'paid' && 'bg-vanta-success-tint text-vanta-success',
                        inv.status === 'sent' && 'bg-vanta-accent-tint text-vanta-navy',
                        inv.status === 'draft' && 'bg-vanta-sidebar text-vanta-gray border border-vanta-border',
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
