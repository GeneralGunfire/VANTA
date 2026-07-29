import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
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
            <h1 className="text-2xl font-serif text-vanta-black tracking-tight">Ledger</h1>
            <p className="text-sm text-vanta-gray mt-1">Every sale and expense you've recorded</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-vanta-navy text-white px-5 py-2.5 text-xs font-semibold hover:bg-vanta-navy-dark transition-all flex items-center gap-2 rounded-lg active:scale-[0.98]"
          >
            <Plus size={16} />
            Add Transaction
          </button>
        </div>

        <div className="bg-white border border-vanta-border rounded-2xl overflow-hidden">
          {/* Header info block */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 px-6 py-5 border-b border-vanta-border text-xs">
            <div>
              <div className="text-vanta-gray mb-0.5">Company Name</div>
              <div className="text-vanta-black font-medium">Vanta Books</div>
            </div>
            <div>
              <div className="text-vanta-gray mb-0.5">Fiscal Year</div>
              <div className="text-vanta-black font-medium">{new Date().getFullYear()}</div>
            </div>
            <div>
              <div className="text-vanta-gray mb-0.5">Currency</div>
              <div className="text-vanta-black font-medium">ZAR</div>
            </div>
            <div>
              <div className="text-vanta-gray mb-0.5">Account Type</div>
              <div className="text-vanta-black font-medium">Operating Account</div>
            </div>
            <div>
              <div className="text-vanta-gray mb-0.5">Opening Balance</div>
              <div className="text-vanta-black font-mono font-semibold">R{fmt(OPENING_BALANCE)}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between gap-6 flex-wrap px-6 py-4 border-b border-vanta-border">
            <div className="relative flex-1 min-w-65">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-vanta-gray" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your transactions"
                aria-label="Search your transactions"
                className="w-full bg-white border border-vanta-border rounded-full pl-9 pr-3 py-2 text-sm text-vanta-black placeholder-vanta-gray focus:outline-none focus:border-vanta-navy/40 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-vanta-sidebar p-1.5 border border-vanta-border rounded-full text-xs">
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
                    'px-4 py-2 font-medium transition-all rounded-full whitespace-nowrap',
                    filterType === key
                      ? 'bg-white text-vanta-black border border-vanta-border shadow-sm'
                      : 'text-vanta-gray hover:text-vanta-black border border-transparent',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-vanta-gray text-sm italic">Loading…</div>
          ) : loadError ? (
            <div role="alert" className="flex items-center justify-center gap-2 py-16 text-vanta-black text-sm px-6">
              <AlertTriangle size={16} />
              Couldn't load transactions: {loadError}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 text-vanta-gray text-sm px-6 leading-relaxed">
              Your ledger will show up here as you tell Vanta what's happening in your business — try the chat to add your first one.
            </div>
          ) : ledgerRows.length === 0 ? (
            <div className="text-center py-20 text-vanta-gray text-sm">No transactions match your search.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-vanta-sidebar text-vanta-gray uppercase tracking-wider text-[10px]">
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
                <tbody className="divide-y divide-vanta-border/60">
                  {ledgerRows.map((row) => (
                    <motion.tr
                      key={row.tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelectedTx(row.tx)}
                      className={cn(
                        'hover:bg-vanta-sidebar transition-colors cursor-pointer',
                        row.tx.needs_review && 'border-l-2 border-l-vanta-black',
                      )}
                    >
                      <td className="px-4 py-3 text-vanta-gray">{row.month}</td>
                      <td className="px-4 py-3 text-vanta-gray font-mono">{row.date}</td>
                      <td className="px-4 py-3 text-vanta-black font-medium">
                        {row.tx.description || row.tx.raw_input || '—'}
                      </td>
                      <td className="px-4 py-3 text-vanta-gray">
                        {row.tx.category}
                        {row.tx.needs_review && (
                          <AlertTriangle size={12} className="inline-block ml-1.5 -mt-0.5 text-vanta-black" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-vanta-gray">{row.accountType}</td>
                      <td className="px-4 py-3 text-right font-mono text-vanta-black">
                        {row.debit > 0 ? `R${fmt(row.debit)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-vanta-black">
                        {row.credit > 0 ? `R${fmt(row.credit)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-vanta-black">
                        R{fmt(row.runningBalance)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-vanta-sidebar font-semibold">
                    <td colSpan={5} className="px-4 py-3 text-right text-vanta-gray uppercase tracking-wider text-[10px]">
                      Totals
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-vanta-black">R{fmt(totalDebit)}</td>
                    <td className="px-4 py-3 text-right font-mono text-vanta-black">R{fmt(totalCredit)}</td>
                    <td className="px-4 py-3 text-right font-mono text-vanta-black">R{fmt(endingBalance)}</td>
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
