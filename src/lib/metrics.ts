import type { Transaction } from '../components/TransactionDetailModal';

/**
 * All aggregates here derive from the same capped (200-row) transactions
 * query LedgerPage uses — there is no backend aggregation endpoint. Every
 * function is windowed to a small recent range (today, last N days) rather
 * than "all time," so the cap is very unlikely to truncate the data that
 * actually feeds these numbers.
 */

function txDate(t: Transaction): Date {
  return new Date(t.date || t.created_at);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Total money in, today only. */
export function todaysSales(transactions: Transaction[]): number {
  const today = new Date();
  return transactions
    .filter((t) => t.direction === 'in' && isSameDay(txDate(t), today))
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);
}

/** Net cash movement (in − out) over the trailing N days, inclusive of today. */
export function cashMovement(transactions: Transaction[], days = 7): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  cutoff.setHours(0, 0, 0, 0);

  return transactions
    .filter((t) => txDate(t) >= cutoff)
    .reduce((sum, t) => sum + (t.direction === 'in' ? t.amount ?? 0 : -(t.amount ?? 0)), 0);
}

export function needsReviewCount(transactions: Transaction[]): number {
  return transactions.filter((t) => t.needs_review).length;
}

/**
 * Percent change in a day's money-in vs the previous day. Returns null when
 * the previous day had zero sales (a percent change against zero is
 * undefined, not "0%" or "∞%") — callers must render that as "—", never a
 * fabricated number.
 */
export function todaysSalesTrend(transactions: Transaction[]): number | null {
  const days = groupByDay(transactions, 2);
  const [yesterday, today] = days;
  if (!yesterday || yesterday.in === 0) return null;
  return ((today.in - yesterday.in) / yesterday.in) * 100;
}

/** Daily money-in totals over the trailing N days, oldest first — for sparklines. */
export function salesSparkline(transactions: Transaction[], days = 14): number[] {
  return groupByDay(transactions, days).map((d) => d.in);
}

/** Most recent N transactions, already sorted newest-first by the query. */
export function recentActivity(transactions: Transaction[], count = 6): Transaction[] {
  return transactions.slice(0, count);
}

export interface CategoryTotal {
  category: string;
  total: number;
}

/**
 * Real spend by category, trailing N days — money out only (an expense
 * breakdown, the thing a "where did it go" chart is actually for). Zero-total
 * categories are dropped rather than zero-filled: an unused category isn't a
 * slice of a pie, it just doesn't exist yet for this business.
 */
export function categoryBreakdown(transactions: Transaction[], days = 30): CategoryTotal[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  cutoff.setHours(0, 0, 0, 0);

  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.direction !== 'out') continue;
    if (txDate(t) < cutoff) continue;
    const key = t.category || 'Other';
    totals.set(key, (totals.get(key) ?? 0) + (t.amount ?? 0));
  }

  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export interface DayTotals {
  /** e.g. "Mon 21" */
  label: string;
  in: number;
  out: number;
}

/**
 * Buckets transactions into the trailing N days, zero-filling days with no
 * activity — a flat zero day is real information (nothing happened), not a
 * gap to be skipped.
 */
export function groupByDay(transactions: Transaction[], days = 7): DayTotals[] {
  const buckets: DayTotals[] = [];
  const dayKeys: string[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dayKeys.push(d.toDateString());
    buckets.push({
      label: d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric' }),
      in: 0,
      out: 0,
    });
  }

  for (const t of transactions) {
    const key = txDate(t).toDateString();
    const idx = dayKeys.indexOf(key);
    if (idx === -1) continue; // outside the window
    if (t.direction === 'in') buckets[idx].in += t.amount ?? 0;
    else if (t.direction === 'out') buckets[idx].out += t.amount ?? 0;
  }

  return buckets;
}
