import type { Transaction } from '../components/TransactionDetailModal';
import type { Debt } from '../hooks/useDebts';

/** Minimum confirmed transactions and days of recorded history before a forecast is shown as a confident-looking number. */
const MIN_TRANSACTIONS_FOR_FORECAST = 10;
const MIN_HISTORY_DAYS_FOR_FORECAST = 14;

export interface CashflowForecast {
  /**
   * True once there's enough real history to show a forecast that reads
   * as reliable — both a minimum transaction count AND a minimum span of
   * days, not just "at least one row exists." Found during live testing:
   * the real (non-test) data in this project is 4 transactions across
   * ~11 minutes on a single day — exactly the kind of thin history that
   * would previously have produced a confident-sounding number off
   * almost nothing.
   */
  hasEnoughData: boolean;
  windowDays: number;
  avgDailyIncome: number;
  avgDailyExpense: number;
  /** Expected income over the next 7 days, from recent pattern only. */
  expectedInFromPattern: number;
  /** Expected expense over the next 7 days, from recent pattern only. */
  expectedOut: number;
  /** Outstanding amounts owed to the business, treated as "reasonably expected soon." */
  expectedInFromDebts: number;
  expectedIn: number;
  estimatedNet: number;
  /** Recurring expense detected across the window (e.g. a rent-like monthly payment), if any. */
  recurringExpense: { description: string; amount: number; occurrences: number } | null;
}

/**
 * Every figure here is computed directly from real rows — no model is
 * involved in producing any number. See DebtorsPage/useDebts and
 * useTransactions for the source data. This mirrors the same discipline
 * as supabase/functions/generate-summary/index.ts (computeSummary): code
 * computes, an LLM (if used at all) may only phrase a sentence around
 * numbers that already exist.
 */
export function computeCashflowForecast(transactions: Transaction[], debts: Debt[], windowDays = 30): CashflowForecast {
  const now = Date.now();
  const windowStart = now - windowDays * 24 * 60 * 60 * 1000;

  const recent = transactions.filter((t) => !t.needs_review && new Date(t.created_at).getTime() >= windowStart);

  const oldestRecentMs = recent.length > 0 ? Math.min(...recent.map((t) => new Date(t.created_at).getTime())) : now;
  const historySpanDays = (now - oldestRecentMs) / (1000 * 60 * 60 * 24);
  const hasEnoughData = recent.length >= MIN_TRANSACTIONS_FOR_FORECAST && historySpanDays >= MIN_HISTORY_DAYS_FOR_FORECAST;

  const totalIn = recent.filter((t) => t.direction === 'in').reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalOut = recent.filter((t) => t.direction === 'out').reduce((s, t) => s + (t.amount ?? 0), 0);

  const avgDailyIncome = totalIn / windowDays;
  const avgDailyExpense = totalOut / windowDays;

  const expectedInFromPattern = avgDailyIncome * 7;
  const expectedOut = avgDailyExpense * 7;

  const expectedInFromDebts = debts
    .filter((d) => d.status === 'outstanding' && d.direction === 'owed_to_business')
    .reduce((s, d) => s + (d.amount ?? 0), 0);

  const expectedIn = expectedInFromPattern + expectedInFromDebts;
  const estimatedNet = expectedIn - expectedOut;

  // Simple recurring-expense detection: group outgoing transactions by a
  // normalized description, flag any group with >=2 occurrences roughly
  // ~28-31 days apart (a monthly cadence, e.g. rent). This is intentionally
  // conservative — it will miss irregular recurring costs, and that's an
  // acceptable, documented limitation rather than a false positive risk.
  const outgoing = recent.filter((t) => t.direction === 'out' && t.description);
  const groups = new Map<string, Transaction[]>();
  for (const t of outgoing) {
    const key = (t.description ?? '').trim().toLowerCase();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  let recurringExpense: CashflowForecast['recurringExpense'] = null;
  for (const [desc, group] of groups) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push((new Date(sorted[i].created_at).getTime() - new Date(sorted[i - 1].created_at).getTime()) / (1000 * 60 * 60 * 24));
    }
    const looksMonthly = gaps.every((g) => g >= 25 && g <= 35);
    if (looksMonthly) {
      const avgAmount = group.reduce((s, t) => s + (t.amount ?? 0), 0) / group.length;
      recurringExpense = { description: desc, amount: avgAmount, occurrences: group.length };
      break;
    }
  }

  return {
    hasEnoughData,
    windowDays,
    avgDailyIncome,
    avgDailyExpense,
    expectedInFromPattern,
    expectedOut,
    expectedInFromDebts,
    expectedIn,
    estimatedNet,
    recurringExpense,
  };
}
