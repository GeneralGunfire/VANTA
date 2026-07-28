import React, { useEffect, useState, useMemo } from 'react';
import { Plus, FileText, Utensils, Truck, Zap, Home, Users, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { SearchBar } from '../components/ui/search-bar';
import TransactionDetailModal, { Transaction } from '../components/TransactionDetailModal';
import AddTransactionModal from '../components/AddTransactionModal';

const TRANSACTION_CATEGORIES = ['Sales', 'Stock', 'Rent', 'Utilities', 'Transport', 'Wages', 'Other'];

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out' | 'needs_review'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const handleAddNewTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        (t.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.category ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(t.amount ?? '').includes(searchQuery);

      if (filterType === 'in') return matchesSearch && t.direction === 'in';
      if (filterType === 'out') return matchesSearch && t.direction === 'out';
      if (filterType === 'needs_review') return matchesSearch && t.needs_review;
      return matchesSearch;
    });
  }, [transactions, searchQuery, filterType]);

  const grouped = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      const d = new Date(t.date || t.created_at);
      const dateStr = d.toLocaleDateString('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' });
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [filteredTransactions]);

  const getIconForCategory = (cat: string) => {
    switch (cat) {
      case 'Sales':
        return <ShoppingBag size={18} />;
      case 'Stock':
        return <FileText size={18} />;
      case 'Rent':
        return <Home size={18} />;
      case 'Utilities':
        return <Zap size={18} />;
      case 'Transport':
        return <Truck size={18} />;
      case 'Wages':
        return <Users size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  const needsReviewCount = transactions.filter((t) => t.needs_review).length;

  return (
    <div className="flex-1 overflow-y-auto bg-vanta-bg pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddNewTransaction} />

      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-6 bg-white p-8 border border-vanta-border rounded-md shadow-sm">
          <div>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-vanta-navy">Ledger</h1>
            <p className="text-xs uppercase tracking-widest text-vanta-gray mt-2 font-semibold">
              Every sale and expense you've recorded
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-vanta-navy text-white px-6 py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-opacity-90 transition-all flex items-center gap-2.5 rounded-xs shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </div>

        <div className="bg-white border border-vanta-border p-6 rounded-md shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-65">
              <SearchBar
                placeholder="Search your transactions"
                suggestions={TRANSACTION_CATEGORIES}
                onChange={setSearchQuery}
              />
            </div>

            <div className="flex items-center gap-1.5 bg-vanta-bg p-1.5 border border-vanta-border rounded-xs text-xs">
              {(
                [
                  ['all', 'All'],
                  ['in', 'Money in'],
                  ['out', 'Money out'],
                  ['needs_review', `Needs review${needsReviewCount > 0 ? ` (${needsReviewCount})` : ''}`],
                ] as [typeof filterType, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`px-4 py-2 font-bold transition-all rounded-xs whitespace-nowrap ${
                    filterType === key ? 'bg-white text-vanta-navy shadow-sm border border-vanta-border' : 'text-vanta-gray hover:text-vanta-navy'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 bg-white border border-vanta-border shadow-sm rounded-md text-vanta-gray text-sm italic">
            Loading…
          </div>
        ) : loadError ? (
          <div className="text-center py-16 bg-white border-2 border-vanta-navy shadow-sm rounded-md text-vanta-navy text-sm px-6">
            Couldn't load transactions: {loadError}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 text-vanta-gray text-sm border border-vanta-border bg-white shadow-sm rounded-md px-6 leading-relaxed">
            Your ledger will show up here as you tell Vanta what's happening in your business — try the chat to add your first one.
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-vanta-gray text-sm border border-vanta-border bg-white shadow-sm rounded-md">
            No transactions match your search.
          </div>
        ) : (
          <div className="space-y-8">
            {(Object.entries(grouped) as [string, Transaction[]][]).map(([date, items]) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-vanta-border rounded-md shadow-sm overflow-hidden"
              >
                <div className="bg-vanta-sidebar border-b border-vanta-border px-8 py-4 flex justify-between items-center">
                  <div className="text-xs uppercase tracking-widest font-bold text-vanta-navy">{date}</div>
                  <div className="text-sm font-mono font-bold text-vanta-navy">
                    {items.reduce((sum, t) => sum + (t.direction === 'in' ? (t.amount ?? 0) : -(t.amount ?? 0)), 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="divide-y divide-vanta-border/60">
                  {items.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTx(t)}
                      className={cn(
                        'p-5 md:p-6 flex items-center justify-between hover:bg-gray-50/90 transition-all cursor-pointer group',
                        t.needs_review && 'border-l-4 border-vanta-navy',
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-11 h-11 rounded-sm bg-vanta-bg border border-vanta-border flex items-center justify-center text-vanta-navy group-hover:border-vanta-navy group-hover:bg-white transition-all">
                          {getIconForCategory(t.category)}
                        </div>
                        <div>
                          <div className="font-bold text-vanta-navy text-base mb-1 group-hover:underline">
                            {t.description || t.raw_input || '—'}
                          </div>
                          <div className="text-xs uppercase tracking-widest text-vanta-gray font-semibold flex items-center gap-2">
                            {t.category}
                            {t.needs_review && <span className="text-vanta-navy font-bold">⚑ Needs review</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-base font-mono font-bold text-vanta-navy">
                        {t.direction === 'in' ? '+' : '-'}
                        {(t.amount ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
