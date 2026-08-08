import { useState } from 'react';
import { Plus, AlertTriangle, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDebts, type Debt } from '../hooks/useDebts';
import AddDebtModal from '../components/AddDebtModal';
import { SHADOW_SM } from '../lib/surfaces';

const fmt = (n: number) => n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Simple client-side "N days ago" — no new date library. */
function ageLabel(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

interface DebtSectionProps {
  title: string;
  totalLabel: string;
  debts: Debt[];
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
}

function DebtSection({ title, totalLabel, debts, onSettle, onDelete }: DebtSectionProps) {
  const total = debts.reduce((sum, d) => sum + (d.amount ?? 0), 0);

  return (
    <div className="border border-vanta-border rounded-2xl overflow-hidden bg-white" style={{ boxShadow: SHADOW_SM }}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-vanta-border">
        <div>
          <h2 className="text-sm font-semibold text-vanta-black">{title}</h2>
          <span className="text-[11px] text-vanta-gray-light">
            {debts.length} {debts.length === 1 ? 'entry' : 'entries'} outstanding
          </span>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-vanta-gray-light">{totalLabel}</div>
          <div className="text-lg font-mono font-semibold text-vanta-black">R{fmt(total)}</div>
        </div>
      </div>

      {debts.length === 0 ? (
        <div className="text-center py-14 text-vanta-gray text-sm px-6">Nothing here right now.</div>
      ) : (
        <div className="divide-y divide-vanta-border/60">
          {debts.map((d) => {
            const daysOld = Math.floor((Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysOld >= 30;
            return (
            <div
              key={d.id}
              className={`flex items-center justify-between gap-4 px-6 py-4 ${isOverdue ? 'border-l-2 border-l-vanta-warning' : ''}`}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-vanta-black truncate">{d.party_name || 'Unknown'}</div>
                {d.description && <div className="text-xs text-vanta-gray mt-0.5 truncate">{d.description}</div>}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] uppercase tracking-widest text-vanta-gray-light">{ageLabel(d.created_at)}</span>
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-vanta-warning">
                      <AlertTriangle size={10} />
                      30+ days
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-sm text-vanta-black">R{fmt(d.amount ?? 0)}</span>
                <button
                  onClick={() => onSettle(d.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-vanta-gray hover:text-vanta-black transition-colors px-3 py-1.5 rounded-lg border border-vanta-border hover:border-vanta-border-strong"
                >
                  <Check size={12} />
                  Settle
                </button>
                <button
                  onClick={() => onDelete(d.id)}
                  aria-label={`Delete ${d.party_name ?? 'debt'}`}
                  className="p-1.5 rounded-lg text-vanta-gray hover:text-vanta-black hover:bg-vanta-sidebar transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Settled debts remain in the database (status='settled', settled_at set)
 * but are not shown in any history view on this page tonight — a simple
 * toggle was judged out of scope to keep this part fully finished rather
 * than half-built. See final report.
 */
export default function DebtorsPage() {
  const { debts, isLoading, loadError, addDebt, settleDebt, deleteDebt } = useDebts();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const owedToYou = debts.filter((d) => d.direction === 'owed_to_business' && d.status === 'outstanding');
  const youOwe = debts.filter((d) => d.direction === 'owed_by_business' && d.status === 'outstanding');

  const handleSettle = async (id: string) => {
    try {
      await settleDebt(id);
      toast.success('Marked as settled');
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not update — try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDebt(id);
      toast.success('Deleted — restore it from Recently Deleted if needed');
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not delete — try again.');
    }
  };

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <AddDebtModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addDebt} />

      <div className="relative max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-vanta-black">Debtors & Creditors</h1>
            <p className="text-sm text-vanta-gray mt-1">Who owes you, and who you owe.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-white px-4 py-2.5 text-[13px] font-medium transition-colors duration-150 flex items-center gap-1.5 rounded-lg active:scale-[0.98] bg-vanta-navy hover:bg-vanta-navy-dark"
          >
            <Plus size={15} />
            Add debtor / creditor
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-vanta-gray text-sm italic">Loading…</div>
        ) : loadError ? (
          <div role="alert" className="flex items-center justify-center gap-2 py-16 text-vanta-black text-sm px-6">
            <AlertTriangle size={16} />
            Couldn't load debtors & creditors: {loadError}
          </div>
        ) : debts.length === 0 ? (
          <div className="text-center py-20 text-sm px-6 leading-relaxed border border-vanta-border rounded-2xl bg-white">
            <span className="text-vanta-black font-medium">No debtors or creditors yet.</span>{' '}
            <span className="text-vanta-gray">Mention one in chat (like "Thabo owes me R200") or add one manually.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DebtSection title="Owed to you" totalLabel="Total owed to you" debts={owedToYou} onSettle={handleSettle} onDelete={handleDelete} />
            <DebtSection title="You owe" totalLabel="Total you owe" debts={youOwe} onSettle={handleSettle} onDelete={handleDelete} />
          </div>
        )}
      </div>
    </div>
  );
}
