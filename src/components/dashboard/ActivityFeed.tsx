import { Skeleton } from '../ui/skeleton';
import { recentActivity } from '../../lib/metrics';
import type { Transaction } from '../../components/TransactionDetailModal';
import { cn } from '../../lib/utils';
import { SHADOW_SM } from '../../lib/surfaces';

interface ActivityFeedProps {
  transactions: Transaction[];
  isLoading: boolean;
  onSelect: (tx: Transaction) => void;
}

function relativeTime(tx: Transaction): string {
  const d = new Date(tx.date || tx.created_at);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 60) return `${Math.max(diffMins, 1)}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function ActivityFeed({ transactions, isLoading, onSelect }: ActivityFeedProps) {
  const items = recentActivity(transactions, 6);

  return (
    <section
      className="bg-white border border-vanta-border rounded-2xl px-4 py-4"
      style={{ boxShadow: SHADOW_SM }}
      aria-label="Recent activity"
    >
      <div className="text-[11px] uppercase tracking-[0.08em] text-vanta-gray font-medium">
        Recent activity
      </div>

      {isLoading ? (
        <div className="mt-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-vanta-gray leading-snug">
          Nothing recorded yet — tell Vanta about a sale or expense below and it'll show up here.
        </p>
      ) : (
        <div className="mt-2 -mx-2">
          {items.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="w-full flex items-baseline gap-3 px-2 py-2 text-left rounded-md hover:bg-muted/70 transition-colors duration-150"
            >
              {/* Direction is carried by the amount's sign and colour, not by a
                  redundant icon chip — the ledger convention itself. */}
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-vanta-black truncate leading-snug">
                  {t.description || t.raw_input || t.category}
                </div>
                <div className="mt-0.5 text-[11.5px] text-vanta-gray-light truncate">
                  {t.category}
                  <span aria-hidden="true"> · </span>
                  {relativeTime(t)}
                  {t.needs_review && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span className="text-vanta-warning">needs review</span>
                    </>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  'shrink-0 text-[12.5px] font-mono tabular-nums',
                  t.direction === 'in' ? 'text-vanta-success font-medium' : 'text-vanta-gray',
                )}
              >
                {t.direction === 'in' ? '+' : '−'}R
                {(t.amount ?? 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
