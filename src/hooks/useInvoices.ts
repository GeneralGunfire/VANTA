import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Invoice {
  id: string;
  anon_id: string;
  recipient_name: string;
  line_items: InvoiceLineItem[];
  total: number;
  status: 'draft' | 'sent' | 'paid';
  created_at: string;
  due_date: string | null;
  deleted_at?: string | null;
}

interface UseInvoicesResult {
  invoices: Invoice[];
  isLoading: boolean;
  loadError: string | null;
  addInvoice: (invoice: Invoice) => void;
  updateStatus: (id: string, status: Invoice['status']) => Promise<void>;
  /** Soft-deletes an invoice (sets deleted_at) — optimistic, rolls back on failure. */
  deleteInvoice: (id: string) => Promise<void>;
}

/**
 * Real Supabase queries only, same shape as the other Phase 2/Round 2
 * hooks. Scoped by anon_id (see src/lib/anonId.ts).
 */
export function useInvoices(): UseInvoicesResult {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        if (!supabase) throw new Error('Supabase is not configured — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');

        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('anon_id', getAnonId())
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;
        setInvoices((data ?? []) as Invoice[]);
      } catch (err: any) {
        console.error('Error fetching invoices:', err);
        setLoadError(err?.message ?? String(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoices();
  }, []);

  const addInvoice = (invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
  };

  const updateStatus = async (id: string, status: Invoice['status']) => {
    const prev = invoices;
    setInvoices((p) => p.map((inv) => (inv.id === id ? { ...inv, status } : inv)));

    if (!supabase) return;
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
    if (error) {
      console.error('Error updating invoice status:', error);
      setInvoices(prev);
      throw error;
    }
  };

  const deleteInvoice = async (id: string) => {
    const prev = invoices;
    setInvoices((p) => p.filter((inv) => inv.id !== id));

    if (!supabase) return;
    const { error } = await supabase.from('invoices').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      console.error('Error deleting invoice:', error);
      setInvoices(prev);
      throw error;
    }
  };

  return { invoices, isLoading, loadError, addInvoice, updateStatus, deleteInvoice };
}
