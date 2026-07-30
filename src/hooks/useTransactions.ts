import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Transaction } from '../components/TransactionDetailModal';

interface UseTransactionsResult {
  transactions: Transaction[];
  isLoading: boolean;
  loadError: string | null;
  /** Prepend a freshly-added transaction without waiting for a refetch. */
  addTransaction: (tx: Transaction) => void;
  /** Replace a transaction in place after a correction persists. */
  updateTransaction: (tx: Transaction) => void;
}

/**
 * Single source of truth for the transactions list — same query LedgerPage
 * has always used. The 200-row cap means any aggregate computed from this
 * data (dashboard metrics, the trend chart) is only accurate within that
 * window, which is why those are framed as "last 7 days" rather than
 * all-time totals.
 */
export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        if (!supabase) throw new Error('Supabase is not configured — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');

        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) throw error;
        setTransactions((data ?? []) as Transaction[]);
      } catch (err: any) {
        // Honest failure — never substitute fabricated rows for a real
        // fetch error or an empty table. An empty table is a real, valid
        // state (a brand-new business with no transactions yet) and is
        // handled separately below, not here.
        console.error('Error fetching transactions:', err);
        setLoadError(err?.message ?? String(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  const addTransaction = (tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  const updateTransaction = (tx: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
  };

  return { transactions, isLoading, loadError, addTransaction, updateTransaction };
}
