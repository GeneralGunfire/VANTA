import { AlertTriangle, History } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useInventory } from '../hooks/useInventory';
import { computeBusinessTimeline } from '../lib/timeline';

const fmt = (n: number) => `R${Math.round(n).toLocaleString('en-ZA')}`;

function changeLabel(pct: number | null, isConsecutive: boolean): string | null {
  if (pct === null) return null;
  const sign = pct >= 0 ? '+' : '';
  const suffix = isConsecutive ? 'vs prior month' : 'vs last recorded month';
  return `${sign}${pct.toFixed(0)}% ${suffix}`;
}

/**
 * Built entirely from data that already exists (transactions, inventory).
 * Only states what the data shows changed — never a fabricated narrative
 * about why. See src/lib/timeline.ts for the computation.
 */
export default function TimelinePage() {
  const { transactions, isLoading: txLoading, loadError: txError } = useTransactions();
  const { items, isLoading: invLoading, loadError: invError } = useInventory();

  const isLoading = txLoading || invLoading;
  const loadError = txError || invError;

  const months = computeBusinessTimeline(transactions, items);

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-vanta-black tracking-tight">Business Timeline</h1>
          <p className="text-sm text-vanta-gray mt-1">What changed, month by month, from your recorded activity</p>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-vanta-gray text-sm italic">Loading…</div>
        ) : loadError ? (
          <div role="alert" className="flex items-center justify-center gap-2 py-16 text-vanta-black text-sm px-6">
            <AlertTriangle size={16} />
            Couldn't load your data: {loadError}
          </div>
        ) : months.length === 0 ? (
          <div className="text-center py-20 text-vanta-gray text-sm px-6 leading-relaxed flex flex-col items-center gap-3 border border-vanta-border rounded-2xl bg-white">
            <History size={20} className="text-vanta-gray-light" />
            Nothing recorded yet — this timeline fills in as you record transactions in chat.
          </div>
        ) : (
          <div className="border border-vanta-border rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
            <div className="divide-y divide-vanta-border/60">
              {months.map((m) => {
                const revChange = changeLabel(m.revenueChangePct, m.comparisonIsConsecutiveMonth);
                const expChange = changeLabel(m.expensesChangePct, m.comparisonIsConsecutiveMonth);
                return (
                  <div key={m.key} className="px-6 py-4">
                    <div className="text-sm font-medium text-vanta-black">{m.label}</div>
                    <div className="text-xs font-mono text-vanta-gray mt-1">
                      {fmt(m.revenue)} revenue{revChange ? ` (${revChange})` : ''} · {fmt(m.expenses)} expenses
                      {expChange ? ` (${expChange})` : ''}
                    </div>
                    {m.events.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {m.events.map((e, i) => (
                          <li key={i} className="text-xs text-vanta-gray leading-relaxed">
                            {e}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
