import type { Transaction } from '../components/TransactionDetailModal';
import type { Debt } from '../hooks/useDebts';

export interface BusinessRecord {
  hasAnyData: boolean;
  /** Earliest confirmed transaction's created_at, if any. */
  recordingSince: string | null;
  monthsRecording: number;
  totalRevenue: number;
  avgMonthlyRevenue: number;
  monthsWithActivity: number;
  monthsChecked: number;
  outstandingOwedToBusiness: number;
  outstandingOwedByBusiness: number;
}

/**
 * Every figure here is computed directly from real rows — no estimated or
 * invented figures, and deliberately no single blended "score." Each value
 * is a plain, individually-labeled fact. Mirrors the same discipline as
 * src/lib/forecast.ts and supabase/functions/generate-summary/index.ts.
 */
export function computeBusinessRecord(transactions: Transaction[], debts: Debt[], monthsChecked = 5): BusinessRecord {
  const confirmed = transactions.filter((t) => !t.needs_review);

  if (confirmed.length === 0) {
    return {
      hasAnyData: false,
      recordingSince: null,
      monthsRecording: 0,
      totalRevenue: 0,
      avgMonthlyRevenue: 0,
      monthsWithActivity: 0,
      monthsChecked,
      outstandingOwedToBusiness: 0,
      outstandingOwedByBusiness: 0,
    };
  }

  const sorted = [...confirmed].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const earliest = sorted[0].created_at;

  const now = new Date();
  const earliestDate = new Date(earliest);
  const monthsRecording = Math.max(
    1,
    (now.getFullYear() - earliestDate.getFullYear()) * 12 + (now.getMonth() - earliestDate.getMonth()) + 1,
  );

  const totalRevenue = confirmed.filter((t) => t.direction === 'in').reduce((s, t) => s + (t.amount ?? 0), 0);
  const avgMonthlyRevenue = totalRevenue / monthsRecording;

  // "Records maintained: N of last monthsChecked months" — count distinct
  // calendar months (within the last `monthsChecked` months, including the
  // current one) that have at least one confirmed transaction.
  const monthKeys = new Set<string>();
  for (let i = 0; i < monthsChecked; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const hasActivity = confirmed.some((t) => {
      const td = new Date(t.created_at);
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
    });
    if (hasActivity) monthKeys.add(`${d.getFullYear()}-${d.getMonth()}`);
  }

  const outstandingOwedToBusiness = debts
    .filter((d) => d.status === 'outstanding' && d.direction === 'owed_to_business')
    .reduce((s, d) => s + (d.amount ?? 0), 0);
  const outstandingOwedByBusiness = debts
    .filter((d) => d.status === 'outstanding' && d.direction === 'owed_by_business')
    .reduce((s, d) => s + (d.amount ?? 0), 0);

  return {
    hasAnyData: true,
    recordingSince: earliest,
    monthsRecording,
    totalRevenue,
    avgMonthlyRevenue,
    monthsWithActivity: monthKeys.size,
    monthsChecked,
    outstandingOwedToBusiness,
    outstandingOwedByBusiness,
  };
}
