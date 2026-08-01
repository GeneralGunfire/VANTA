import type { Transaction } from '../components/TransactionDetailModal';

const LOOKBACK_DAYS = 62; // roughly the prior 1-2 months
const AMOUNT_TOLERANCE = 0.15; // within 15% counts as "similar"

/**
 * Loose text similarity: shares at least half its significant words with
 * the candidate — enough to catch "paid rent" vs "paid rent this month"
 * without needing a real NLP dependency for a labeling convenience.
 */
function wordsOverlapEnough(a: string, b: string): boolean {
  const wordsOf = (s: string) => s.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const aWords = new Set(wordsOf(a));
  const bWords = wordsOf(b);
  if (aWords.size === 0 || bWords.length === 0) return false;
  const shared = bWords.filter((w) => aWords.has(w)).length;
  return shared / Math.max(aWords.size, bWords.length) >= 0.5;
}

/**
 * A single, simple heuristic: same category + amount within tolerance +
 * similar description, seen in the last ~1-2 months. Purely for the small
 * "mark as recurring?" labeling prompt in Chat — not a matcher used for
 * anything that blocks or auto-creates transactions.
 */
export function findLikelyRecurringMatch(newTx: {
  category: string;
  amount: number | null;
  description: string | null;
}, history: Transaction[]): Transaction | null {
  if (!newTx.amount || !newTx.description) return null;

  const cutoff = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

  const candidates = history.filter((t) => {
    if (t.category !== newTx.category) return false;
    if (!t.amount) return false;
    if (new Date(t.date || t.created_at).getTime() < cutoff) return false;
    const withinTolerance = Math.abs(t.amount - newTx.amount!) / newTx.amount! <= AMOUNT_TOLERANCE;
    if (!withinTolerance) return false;
    return wordsOverlapEnough(t.description ?? '', newTx.description!);
  });

  if (candidates.length === 0) return null;

  // Most recent match reads best in "...last month" phrasing.
  return candidates.sort(
    (a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime(),
  )[0];
}
