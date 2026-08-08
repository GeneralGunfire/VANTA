import { AlertTriangle, Truck } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { computeSupplierSummaries } from '../lib/suppliers';
import { SHADOW_SM } from '../lib/surfaces';

const fmt = (n: number) => `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Simple client-side "N days ago" — matches the pattern used on DebtorsPage. */
function ageLabel(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

/**
 * Single-business spending pattern with its own suppliers only — distinct
 * from the blocked cross-business price-comparison feature, which needs
 * data volume that doesn't exist yet. A transaction with no identifiable
 * supplier_name simply doesn't appear here; nothing is force-categorized.
 */
export default function SuppliersPage() {
  const { transactions, isLoading, loadError } = useTransactions();
  const suppliers = computeSupplierSummaries(transactions);

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-vanta-black">Suppliers</h1>
          <p className="text-sm text-vanta-gray mt-1">What you've spent with each supplier you've mentioned.</p>
        </div>

        <div className="border border-vanta-border rounded-2xl overflow-hidden bg-white" style={{ boxShadow: SHADOW_SM }}>
          {isLoading ? (
            <div className="text-center py-16 text-vanta-gray text-sm italic">Loading…</div>
          ) : loadError ? (
            <div role="alert" className="flex items-center justify-center gap-2 py-16 text-vanta-black text-sm px-6">
              <AlertTriangle size={16} />
              Couldn't load suppliers: {loadError}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-20 text-vanta-gray text-sm px-6 leading-relaxed flex flex-col items-center gap-3">
              <Truck size={20} className="text-vanta-gray-light" />
              <span>
                <span className="text-vanta-black font-medium">No suppliers yet.</span> Mention who you bought from in chat (e.g. "bought flour from Sipho's Wholesale, R300") and they'll show up here.
              </span>
            </div>
          ) : (
            <div className="divide-y divide-vanta-border/60">
              {suppliers.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-vanta-black truncate">{s.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-vanta-gray-light mt-1">
                      {s.transactionCount} {s.transactionCount === 1 ? 'purchase' : 'purchases'} · last {ageLabel(s.mostRecentPurchase)}
                    </div>
                  </div>
                  <span className="font-mono text-sm text-vanta-black shrink-0">{fmt(s.totalSpent)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-vanta-gray-light leading-relaxed">
          Only transactions where you named a supplier appear here — this list is not a complete record of every expense.
        </p>
      </div>
    </div>
  );
}
