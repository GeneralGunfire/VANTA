import { Skeleton } from '../ui/skeleton';
import { SHADOW_SM } from '../../lib/surfaces';
import { groupByDay } from '../../lib/metrics';
import type { Transaction } from '../TransactionDetailModal';

interface StatTilesProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const rand = (n: number) => n.toLocaleString('en-ZA', { maximumFractionDigits: 0 });

/** Two compact tiles — total in vs total out, trailing 7 days — both real sums of groupByDay, never estimated. */
export function StatTiles({ transactions, isLoading }: StatTilesProps) {
  const days = groupByDay(transactions, 7);
  const totalIn = days.reduce((sum, d) => sum + d.in, 0);
  const totalOut = days.reduce((sum, d) => sum + d.out, 0);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white border border-vanta-border rounded-2xl px-4 py-3.5" style={{ boxShadow: SHADOW_SM }}>
        <div className="text-[10.5px] uppercase tracking-[0.08em] text-vanta-gray font-medium">
          Money in, 7 days
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-20 mt-1.5" />
        ) : (
          <div className="mt-1 font-mono text-[19px] font-semibold text-vanta-black tabular-nums">
            R{rand(totalIn)}
          </div>
        )}
      </div>
      <div className="bg-white border border-vanta-border rounded-2xl px-4 py-3.5" style={{ boxShadow: SHADOW_SM }}>
        <div className="text-[10.5px] uppercase tracking-[0.08em] text-vanta-gray font-medium">
          Money out, 7 days
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-20 mt-1.5" />
        ) : (
          <div className="mt-1 font-mono text-[19px] font-semibold text-vanta-black tabular-nums">
            R{rand(totalOut)}
          </div>
        )}
      </div>
    </div>
  );
}
