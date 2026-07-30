import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Debt {
  id: string;
  user_id: string;
  party_name: string | null;
  direction: 'owed_to_business' | 'owed_by_business' | null;
  amount: number | null;
  description: string | null;
  status: 'outstanding' | 'settled';
  created_at: string;
  settled_at: string | null;
  transaction_id: string | null;
}

interface UseDebtsResult {
  debts: Debt[];
  isLoading: boolean;
  loadError: string | null;
  /** Prepend a freshly-added debt without waiting for a refetch. */
  addDebt: (debt: Debt) => void;
  /** Mark a debt settled — optimistically updates local state before the write resolves. */
  settleDebt: (id: string) => Promise<void>;
}

/**
 * Real Supabase queries only, same shape as useTransactions.ts. Because
 * this app has no real Supabase auth (see migration file header), RLS on
 * `debts` will make this query return zero rows for every user until real
 * auth is wired up — that's expected and flows through the normal
 * loading/error/empty ladder rather than being special-cased here.
 */
export function useDebts(): UseDebtsResult {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDebts() {
      try {
        if (!supabase) throw new Error('Supabase is not configured — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');

        const { data, error } = await supabase
          .from('debts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;
        setDebts((data ?? []) as Debt[]);
      } catch (err: any) {
        console.error('Error fetching debts:', err);
        setLoadError(err?.message ?? String(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchDebts();
  }, []);

  const addDebt = (debt: Debt) => {
    setDebts((prev) => [debt, ...prev]);
  };

  const settleDebt = async (id: string) => {
    const settled_at = new Date().toISOString();
    // Optimistic: flip status locally first so the row leaves the
    // "outstanding" list immediately.
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'settled', settled_at } : d)));

    if (!supabase) return;
    const { error } = await supabase.from('debts').update({ status: 'settled', settled_at }).eq('id', id);
    if (error) {
      console.error('Error settling debt:', error);
      // Roll back on failure.
      setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'outstanding', settled_at: null } : d)));
      throw error;
    }
  };

  return { debts, isLoading, loadError, addDebt, settleDebt };
}
