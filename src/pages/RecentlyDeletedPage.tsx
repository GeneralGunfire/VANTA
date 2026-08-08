import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRecentlyDeleted, type DeletedKind } from '../hooks/useRecentlyDeleted';
import { SHADOW_SM } from '../lib/surfaces';

const KIND_LABEL: Record<DeletedKind, string> = {
  transaction: 'Transaction',
  debt: 'Debtor / creditor',
  invoice: 'Invoice',
  inventory_item: 'Inventory item',
};

/** Simple client-side "N days ago" — matches the pattern used elsewhere in the app. */
function ageLabel(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

/**
 * One consolidated safety net across every soft-deletable table
 * (transactions, debts, invoices, inventory items) — see useRecentlyDeleted.
 * Shows only what was deleted in the last 30 days; older items simply stop
 * appearing here (they still exist in the database, just out of view).
 */
export default function RecentlyDeletedPage() {
  const { rows, isLoading, loadError, restore } = useRecentlyDeleted();

  const handleRestore = async (row: (typeof rows)[number]) => {
    try {
      await restore(row);
      toast.success(`Restored "${row.label}"`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not restore — try again.');
    }
  };

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-vanta-black">Recently Deleted</h1>
          <p className="text-sm text-vanta-gray mt-1">Anything deleted in the last 30 days — restore it here if it was a mistake</p>
        </div>

        <div className="border border-vanta-border rounded-2xl overflow-hidden bg-white" style={{ boxShadow: SHADOW_SM }}>
          {isLoading ? (
            <div className="text-center py-16 text-vanta-gray text-sm italic">Loading…</div>
          ) : loadError ? (
            <div role="alert" className="flex items-center justify-center gap-2 py-16 text-vanta-black text-sm px-6">
              <AlertTriangle size={16} />
              Couldn't load recently deleted items: {loadError}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-20 text-vanta-gray text-sm px-6 leading-relaxed flex flex-col items-center gap-3">
              <Trash2 size={20} className="text-vanta-gray-light" />
              Nothing deleted recently — anything you delete across Vanta shows up here for 30 days.
            </div>
          ) : (
            <div className="divide-y divide-vanta-border/60">
              {rows.map((row) => (
                <div key={`${row.kind}-${row.id}`} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-vanta-gray-light">{KIND_LABEL[row.kind]}</span>
                    </div>
                    <div className="text-sm font-medium text-vanta-black truncate mt-0.5">{row.label}</div>
                    <div className="text-xs text-vanta-gray mt-0.5">
                      <span className="font-mono">{row.detail}</span> · deleted {ageLabel(row.deleted_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(row)}
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-vanta-gray hover:text-vanta-black transition-colors px-3 py-1.5 rounded-lg border border-vanta-border hover:border-vanta-border-strong shrink-0"
                  >
                    <RotateCcw size={12} />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
