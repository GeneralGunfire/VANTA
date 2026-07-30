import type { Transaction } from '../components/TransactionDetailModal';

export interface SupplierSummary {
  name: string;
  totalSpent: number;
  transactionCount: number;
  mostRecentPurchase: string;
}

/**
 * Derived entirely from transactions.supplier_name — no separate table,
 * no invented grouping. A transaction with no supplier_name simply never
 * contributes to any row here; it isn't force-categorized under a
 * fallback "Unknown" bucket.
 */
export function computeSupplierSummaries(transactions: Transaction[]): SupplierSummary[] {
  const groups = new Map<string, Transaction[]>();

  for (const t of transactions) {
    if (t.needs_review) continue;
    if (t.direction !== 'out') continue;
    const name = t.supplier_name?.trim();
    if (!name) continue;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(t);
  }

  const summaries: SupplierSummary[] = [];
  for (const [name, txs] of groups) {
    const totalSpent = txs.reduce((s, t) => s + (t.amount ?? 0), 0);
    const mostRecent = txs.reduce((latest, t) => (new Date(t.created_at) > new Date(latest) ? t.created_at : latest), txs[0].created_at);
    summaries.push({ name, totalSpent, transactionCount: txs.length, mostRecentPurchase: mostRecent });
  }

  return summaries.sort((a, b) => b.totalSpent - a.totalSpent);
}
