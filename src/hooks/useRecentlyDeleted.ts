import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';

export type DeletedKind = 'transaction' | 'debt' | 'invoice' | 'inventory_item';

export interface DeletedRow {
  kind: DeletedKind;
  id: string;
  label: string;
  detail: string;
  deleted_at: string;
}

const WINDOW_DAYS = 30;
const TABLE_BY_KIND: Record<DeletedKind, string> = {
  transaction: 'transactions',
  debt: 'debts',
  invoice: 'invoices',
  inventory_item: 'inventory_items',
};

interface UseRecentlyDeletedResult {
  rows: DeletedRow[];
  isLoading: boolean;
  loadError: string | null;
  restore: (row: DeletedRow) => Promise<void>;
}

/**
 * One consolidated "Recently deleted" view across all four soft-deletable
 * tables, rather than four separate small sections — a single owner is
 * far more likely to remember "I deleted something recently" than which
 * specific page it lived on. Only rows deleted in the last 30 days are
 * fetched; older soft-deleted rows simply never appear here (no automatic
 * hard-deletion job is built this pass — they remain in the database).
 */
export function useRecentlyDeleted(): UseRecentlyDeletedResult {
  const [rows, setRows] = useState<DeletedRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        if (!supabase) throw new Error('Supabase is not configured — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');

        const anonId = getAnonId();
        const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

        const [txRes, debtRes, invRes, itemRes] = await Promise.all([
          supabase.from('transactions').select('*').eq('anon_id', anonId).not('deleted_at', 'is', null).gte('deleted_at', cutoff),
          supabase.from('debts').select('*').eq('anon_id', anonId).not('deleted_at', 'is', null).gte('deleted_at', cutoff),
          supabase.from('invoices').select('*').eq('anon_id', anonId).not('deleted_at', 'is', null).gte('deleted_at', cutoff),
          supabase.from('inventory_items').select('*').eq('anon_id', anonId).not('deleted_at', 'is', null).gte('deleted_at', cutoff),
        ]);

        for (const res of [txRes, debtRes, invRes, itemRes]) {
          if (res.error) throw res.error;
        }

        const combined: DeletedRow[] = [
          ...(txRes.data ?? []).map((t: any) => ({
            kind: 'transaction' as const,
            id: t.id,
            label: t.description || t.raw_input || 'Transaction',
            detail: `${t.direction === 'in' ? '+' : '-'}R${Number(t.amount ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} · ${t.category}`,
            deleted_at: t.deleted_at,
          })),
          ...(debtRes.data ?? []).map((d: any) => ({
            kind: 'debt' as const,
            id: d.id,
            label: d.party_name || 'Debt',
            detail: `R${Number(d.amount ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} · ${d.direction === 'owed_to_business' ? 'owed to you' : 'you owe'}`,
            deleted_at: d.deleted_at,
          })),
          ...(invRes.data ?? []).map((inv: any) => ({
            kind: 'invoice' as const,
            id: inv.id,
            label: inv.recipient_name || 'Invoice',
            detail: `R${Number(inv.total ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} · ${inv.status}`,
            deleted_at: inv.deleted_at,
          })),
          ...(itemRes.data ?? []).map((it: any) => ({
            kind: 'inventory_item' as const,
            id: it.id,
            label: it.item_name || 'Inventory item',
            detail: `${it.quantity} in stock`,
            deleted_at: it.deleted_at,
          })),
        ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

        setRows(combined);
      } catch (err: any) {
        console.error('Error fetching recently deleted items:', err);
        setLoadError(err?.message ?? String(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
  }, []);

  const restore = async (row: DeletedRow) => {
    if (!supabase) return;
    const prev = rows;
    setRows((p) => p.filter((r) => !(r.kind === row.kind && r.id === row.id)));

    const { error } = await supabase.from(TABLE_BY_KIND[row.kind]).update({ deleted_at: null }).eq('id', row.id);
    if (error) {
      console.error('Error restoring item:', error);
      setRows(prev);
      throw error;
    }
  };

  return { rows, isLoading, loadError, restore };
}
