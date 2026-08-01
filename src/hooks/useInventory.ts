import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';

export interface InventoryItem {
  id: string;
  anon_id: string;
  item_name: string;
  quantity: number;
  cost_price: number | null;
  sale_price: number | null;
  reorder_threshold: number | null;
  updated_at: string;
  created_at: string;
  deleted_at?: string | null;
}

interface UseInventoryResult {
  items: InventoryItem[];
  isLoading: boolean;
  loadError: string | null;
  addItem: (item: InventoryItem) => void;
  updateItem: (item: InventoryItem) => void;
  removeItem: (id: string) => Promise<void>;
}

/**
 * Real Supabase queries only, same shape as useTransactions.ts / useDebts.ts.
 * Scoped by anon_id (see src/lib/anonId.ts) since this app has no real
 * Supabase auth — RLS on `inventory_items` is `using (true)`, so this
 * client-side filter is the only scoping that exists.
 */
export function useInventory(): UseInventoryResult {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      try {
        if (!supabase) throw new Error('Supabase is not configured — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');

        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('anon_id', getAnonId())
          .is('deleted_at', null)
          .order('item_name', { ascending: true })
          .limit(500);

        if (error) throw error;
        setItems((data ?? []) as InventoryItem[]);
      } catch (err: any) {
        console.error('Error fetching inventory:', err);
        setLoadError(err?.message ?? String(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchItems();
  }, []);

  const addItem = (item: InventoryItem) => {
    setItems((prev) => [...prev, item].sort((a, b) => a.item_name.localeCompare(b.item_name)));
  };

  const updateItem = (item: InventoryItem) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  };

  const removeItem = async (id: string) => {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));

    if (!supabase) return;
    const { error } = await supabase.from('inventory_items').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      console.error('Error deleting inventory item:', error);
      setItems(prev);
      throw error;
    }
  };

  return { items, isLoading, loadError, addItem, updateItem, removeItem };
}
