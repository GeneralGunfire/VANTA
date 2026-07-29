import React, { useEffect, useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { SearchBar } from '../components/ui/search-bar';
import TransactionDetailModal, { Transaction } from '../components/TransactionDetailModal';
import AddTransactionModal from '../components/AddTransactionModal';

const TRANSACTION_CATEGORIES = ['Sales', 'Stock', 'Rent', 'Utilities', 'Transport', 'Wages', 'Other'];

const CATEGORY_TYPE: Record<string, string> = {
  Sales: 'Revenue',
  Stock: 'Expense',
  Rent: 'Expense',
  Utilities: 'Expense',
  Transport: 'Expense',
  Wages: 'Expense',
  Other: 'Expense',
};

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

  const OPENING_BALANCE = 10000;

  const ledgerRows = useMemo(() => {
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime(),
    );

    let runningBalance = OPENING_BALANCE;
    return sorted.map((t) => {
      const debit = t.direction === 'out' ? t.amount ?? 0 : 0;
      const credit = t.direction === 'in' ? t.amount ?? 0 : 0;
      runningBalance += credit - debit;
      const d = new Date(t.date || t.created_at);
      return {
        tx: t,
        month: d.toLocaleDateString('en-ZA', { month: 'short' }),
        date: d.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit' }),
        accountType: CATEGORY_TYPE[t.category] ?? 'Expense',
        debit,
        credit,
        runningBalance,
      };
    });
  }, [filteredTransactions]);

  const totalDebit = ledgerRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = ledgerRows.reduce((sum, r) => sum + r.credit, 0);
  const endingBalance = OPENING_BALANCE + totalCredit - totalDebit;

  const needsReviewCount = transactions.filter((t) => t.needs_review).length;

  const fmt = (n: number) => n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddNewTransaction} />

      <div className="relative max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Accounting General Ledger</h1>
            <p className="text-xs text-white/45 mt-1">Every sale and expense you've recorded</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white text-black px-5 py-2.5 text-xs font-semibold hover:bg-white/85 transition-all flex items-center gap-2 rounded-lg active:scale-[0.98]"
          >
            <Plus size={16} />
            Add Transaction
          </button>
        </div>

        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          {/* Header info block */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 px-6 py-5 border-b border-white/10 text-xs">
            <div>
              <div className="text-white/40 mb-0.5">Company Name</div>
              <div className="text-zinc-200 font-medium">Vanta Books</div>
            </div>
            <div>
              <div className="text-white/40 mb-0.5">Fiscal Year</div>
              <div className="text-zinc-200 font-medium">{new Date().getFullYear()}</div>
            </div>
            <div>
              <div className="text-white/40 mb-0.5">Currency</div>
              <div className="text-zinc-200 font-medium">ZAR</div>
            </div>
            <div>
              <div className="text-white/40 mb-0.5">Account Type</div>
              <div className="text-zinc-200 font-medium">Operating Account</div>
            </div>
            <div>
              <div className="text-white/40 mb-0.5">Opening Balance</div>
              <div className="text-zinc-200 font-mono font-semibold">R{fmt(OPENING_BALANCE)}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between gap-6 flex-wrap px-6 py-4 border-b border-white/10">
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

          {isLoading ? (
            <div className="text-center py-16 text-white/50 text-sm italic">Loading…</div>
          ) : loadError ? (
            <div role="alert" className="text-center py-16 text-amber-200 text-sm px-6">
              Couldn't load transactions: {loadError}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 text-white/50 text-sm px-6 leading-relaxed">
              Your ledger will show up here as you tell Vanta what's happening in your business — try the chat to add your first one.
            </div>
          ) : ledgerRows.length === 0 ? (
            <div className="text-center py-20 text-white/50 text-sm">No transactions match your search.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/4 text-white/45 uppercase tracking-wider text-[10px]">
                    <th className="text-left font-semibold px-4 py-3">Month</th>
                    <th className="text-left font-semibold px-4 py-3">Date</th>
                    <th className="text-left font-semibold px-4 py-3">Account Name</th>
                    <th className="text-left font-semibold px-4 py-3">Category</th>
                    <th className="text-left font-semibold px-4 py-3">Description</th>
                    <th className="text-right font-semibold px-4 py-3">Debit</th>
                    <th className="text-right font-semibold px-4 py-3">Credit</th>
                    <th className="text-right font-semibold px-4 py-3">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {ledgerRows.map((row) => (
                    <motion.tr
                      key={row.tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelectedTx(row.tx)}
                      className={cn(
                        'hover:bg-white/5 transition-colors cursor-pointer',
                        row.tx.needs_review && 'border-l-2 border-l-[#8FBCEA]',
                      )}
                    >
                      <td className="px-4 py-3 text-white/60">{row.month}</td>
                      <td className="px-4 py-3 text-white/60 font-mono">{row.date}</td>
                      <td className="px-4 py-3 text-zinc-200 font-medium">
                        {row.tx.description || row.tx.raw_input || '—'}
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {row.tx.category}
                        {row.tx.needs_review && <span className="ml-2 text-[#8FBCEA] font-bold">⚑</span>}
                      </td>
                      <td className="px-4 py-3 text-white/45">{row.accountType}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-200">
                        {row.debit > 0 ? `R${fmt(row.debit)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-200">
                        {row.credit > 0 ? `R${fmt(row.credit)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#8FBCEA]">
                        R{fmt(row.runningBalance)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-white/4 font-semibold">
                    <td colSpan={5} className="px-4 py-3 text-right text-white/60 uppercase tracking-wider text-[10px]">
                      Totals
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-100">R{fmt(totalDebit)}</td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-100">R{fmt(totalCredit)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#8FBCEA]">R{fmt(endingBalance)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
