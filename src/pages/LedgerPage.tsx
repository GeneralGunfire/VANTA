import React, { useEffect, useState, useMemo } from 'react';
import { Plus, FileText, Utensils, Truck, Zap, Home, Users, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { APP_SURFACE, CANVAS_GLOW } from '../lib/surfaces';
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
    <div
      className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32"
      style={{ background: APP_SURFACE }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: CANVAS_GLOW }} />
      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddNewTransaction} />

      <div className="relative max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-6 bg-white/5 backdrop-blur-sm p-8 border border-white/10 rounded-2xl">
          <div>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-zinc-50">Ledger</h1>
            <p className="text-xs uppercase tracking-widest text-white/45 mt-2 font-semibold">
              Every sale and expense you've recorded
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-vanta-navy text-white px-6 py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-[#2A6DC4] transition-all flex items-center gap-2.5 rounded-full shadow-[0_10px_26px_-10px_rgba(30,90,168,0.9)] active:scale-[0.98]"
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-65">
              <SearchBar
                placeholder="Search your transactions"
                suggestions={TRANSACTION_CATEGORIES}
                onChange={setSearchQuery}
              />
            </div>

            <div className="flex items-center gap-1.5 bg-white/5 p-1.5 border border-white/10 rounded-full text-xs">
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
                  className={cn(
                    'px-4 py-2 font-bold transition-all rounded-full whitespace-nowrap',
                    filterType === key
                      ? 'bg-white/12 text-zinc-50 border border-white/15'
                      : 'text-white/50 hover:text-white/90 border border-transparent',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl text-white/50 text-sm italic">
            Loading…
          </div>
        ) : loadError ? (
          <div role="alert" className="text-center py-16 bg-amber-400/5 border border-amber-400/30 rounded-2xl text-amber-200 text-sm px-6">
            Couldn't load transactions: {loadError}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 text-white/50 text-sm border border-white/10 bg-white/5 rounded-2xl px-6 leading-relaxed">
            Your ledger will show up here as you tell Vanta what's happening in your business — try the chat to add your first one.
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-white/50 text-sm border border-white/10 bg-white/5 rounded-2xl">
            No transactions match your search.
          </div>
        ) : (
          <div className="space-y-8">
            {(Object.entries(grouped) as [string, Transaction[]][]).map(([date, items]) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
              >
                <div className="bg-white/5 border-b border-white/10 px-8 py-4 flex justify-between items-center">
                  <div className="text-xs uppercase tracking-widest font-bold text-white/60">{date}</div>
                  <div className="text-sm font-mono font-bold text-[#8FBCEA]">
                    {items.reduce((sum, t) => sum + (t.direction === 'in' ? (t.amount ?? 0) : -(t.amount ?? 0)), 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="divide-y divide-white/8">
                  {items.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTx(t)}
                      className={cn(
                        'p-5 md:p-6 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group',
                        t.needs_review && 'border-l-4 border-l-[#6FA3DE]',
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8FBCEA] group-hover:border-white/25 group-hover:bg-white/10 transition-all">
                          {getIconForCategory(t.category)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-100 text-base mb-1 group-hover:underline">
                            {t.description || t.raw_input || '—'}
                          </div>
                          <div className="text-xs uppercase tracking-widest text-white/45 font-semibold flex items-center gap-2">
                            {t.category}
                            {t.needs_review && <span className="text-[#8FBCEA] font-bold">⚑ Needs review</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-base font-mono font-bold text-[#8FBCEA]">
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
