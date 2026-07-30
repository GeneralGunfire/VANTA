import type { Transaction } from '../components/TransactionDetailModal';
import type { InventoryItem } from '../hooks/useInventory';

export interface MonthSummary {
  /** e.g. "2026-03" */
  key: string;
  label: string;
  revenue: number;
  expenses: number;
  revenueChangePct: number | null;
  expensesChangePct: number | null;
  /** True when the comparison is against the literal calendar-previous month; false if that month had no recorded activity and the comparison skips back further. */
  comparisonIsConsecutiveMonth: boolean;
  /** Plain-text notable events derived from real data, never invented commentary. */
  events: string[];
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null; // undefined/infinite change from zero — don't fabricate a percentage
  return ((current - previous) / previous) * 100;
}

/**
 * Every figure is computed directly from real rows across the months that
 * actually have recorded activity — no invented narrative about WHY
 * something changed, only what the data shows changed. Notable events
 * (first supplier, first inventory item) are read directly from existing
 * data, not inferred.
 */
export function computeBusinessTimeline(transactions: Transaction[], inventoryItems: InventoryItem[]): MonthSummary[] {
  const confirmed = transactions.filter((t) => !t.needs_review);
  if (confirmed.length === 0) return [];

  const byMonth = new Map<string, Transaction[]>();
  for (const t of confirmed) {
    const key = monthKey(new Date(t.created_at));
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(t);
  }

  const sortedKeys = [...byMonth.keys()].sort();

  // First-appearance tracking for notable events — a supplier or an
  // inventory item is only ever a "notable event" in the single month it
  // FIRST appears, never repeated in later months.
  const suppliersSeen = new Set<string>();
  const inventoryByMonth = new Map<string, string[]>();
  for (const item of inventoryItems) {
    const key = monthKey(new Date(item.created_at));
    if (!inventoryByMonth.has(key)) inventoryByMonth.set(key, []);
    inventoryByMonth.get(key)!.push(item.item_name);
  }

  const summaries: MonthSummary[] = [];
  let prevRevenue: number | null = null;
  let prevExpenses: number | null = null;
  let prevKey: string | null = null;

  for (const key of sortedKeys) {
    const monthTxs = byMonth.get(key)!;
    const revenue = monthTxs.filter((t) => t.direction === 'in').reduce((s, t) => s + (t.amount ?? 0), 0);
    const expenses = monthTxs.filter((t) => t.direction === 'out').reduce((s, t) => s + (t.amount ?? 0), 0);

    const events: string[] = [];

    // New suppliers first mentioned this month (real data — supplier_name
    // already extracted by parse-transaction, see Part 1).
    const newSuppliersThisMonth = new Set<string>();
    for (const t of monthTxs) {
      const supplier = t.supplier_name?.trim();
      if (supplier && !suppliersSeen.has(supplier)) {
        suppliersSeen.add(supplier);
        newSuppliersThisMonth.add(supplier);
      }
    }
    for (const supplier of newSuppliersThisMonth) {
      events.push(`New supplier: ${supplier}`);
    }

    const newInventoryThisMonth = inventoryByMonth.get(key) ?? [];
    for (const itemName of newInventoryThisMonth) {
      events.push(`Inventory item added: ${itemName}`);
    }

    // Is prevKey literally the calendar month immediately before key?
    // Sorted keys can skip a month if it had zero recorded activity —
    // in that case a "vs prior month" comparison would silently compare
    // against a month further back than the label implies, which is
    // misleading. Flagged via comparisonIsConsecutiveMonth so the UI can
    // say "vs Jan" honestly instead of implying "vs last month" when it
    // isn't.
    let comparisonIsConsecutiveMonth = false;
    if (prevKey) {
      const [py, pm] = prevKey.split('-').map(Number);
      const expectedPrev = new Date(py, pm - 1, 1);
      expectedPrev.setMonth(expectedPrev.getMonth() + 1);
      comparisonIsConsecutiveMonth = monthKey(expectedPrev) === key;
    }

    summaries.push({
      key,
      label: monthLabel(key),
      revenue,
      expenses,
      revenueChangePct: prevRevenue !== null ? pctChange(revenue, prevRevenue) : null,
      expensesChangePct: prevExpenses !== null ? pctChange(expenses, prevExpenses) : null,
      comparisonIsConsecutiveMonth,
      events,
    });

    prevRevenue = revenue;
    prevExpenses = expenses;
    prevKey = key;
  }

  // Most recent month first, matching every other list in this app.
  return summaries.reverse();
}
