import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { motion } from 'motion/react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from '@tanstack/react-table';
import { cn } from '../lib/utils';
import { SHADOW_SM } from '../lib/surfaces';
import TransactionDetailModal, { Transaction } from '../components/TransactionDetailModal';
import AddTransactionModal from '../components/AddTransactionModal';
import { useTransactions } from '../hooks/useTransactions';
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from '../components/ui/table';

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

interface LedgerRow {
  tx: Transaction;
  month: string;
  date: string;
  accountType: string;
  moneyOut: number;
  moneyIn: number;
  total: number;
}

const columnHelper = createColumnHelper<LedgerRow>();

export default function LedgerPage() {
  const { transactions, isLoading, loadError, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out' | 'needs_review'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  // The command palette's "Add transaction" action hands this over via router
  // state (same convention as ChatPage's prefill) so it works from any page.
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if ((location.state as { openAddModal?: boolean } | null)?.openAddModal) {
      setIsAddModalOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

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

  const STARTING_TOTAL = 10000;

  // The running total follows chronological order, not whatever the user
  // is currently sorting the view by — so it's computed once here,
  // upstream of the table, and never recalculated on sort.
  const ledgerRows: LedgerRow[] = useMemo(() => {
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime(),
    );

    let runningTotal = STARTING_TOTAL;
    return sorted.map((t) => {
      const moneyOut = t.direction === 'out' ? t.amount ?? 0 : 0;
      const moneyIn = t.direction === 'in' ? t.amount ?? 0 : 0;
      runningTotal += moneyIn - moneyOut;
      const d = new Date(t.date || t.created_at);
      return {
        tx: t,
        month: d.toLocaleDateString('en-ZA', { month: 'short' }),
        date: d.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit' }),
        accountType: CATEGORY_TYPE[t.category] ?? 'Expense',
        moneyOut,
        moneyIn,
        total: runningTotal,
      };
    });
  }, [filteredTransactions]);

  const totalMoneyOut = ledgerRows.reduce((sum, r) => sum + r.moneyOut, 0);
  const totalMoneyIn = ledgerRows.reduce((sum, r) => sum + r.moneyIn, 0);
  const endingTotal = STARTING_TOTAL + totalMoneyIn - totalMoneyOut;

  const needsReviewCount = transactions.filter((t) => t.needs_review).length;

  const fmt = (n: number) => n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const columns = useMemo(
    () => [
      columnHelper.accessor('month', {
        header: 'Month',
        cell: (info) => <span className="text-vanta-gray">{info.getValue()}</span>,
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        cell: (info) => <span className="text-vanta-gray font-mono">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'description',
        header: 'What happened',
        cell: ({ row }) => (
          <span className="text-vanta-black font-medium">
            {row.original.tx.description || row.original.tx.raw_input || '—'}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.tx.category, {
        id: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-vanta-gray">{row.original.tx.category}</span>
            {row.original.tx.needs_review ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-vanta-black text-vanta-black text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
                <AlertTriangle size={10} />
                Review
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-vanta-success-tint text-vanta-success text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
                Confirmed
              </span>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('accountType', {
        header: 'Type',
        cell: (info) => <span className="text-vanta-gray">{info.getValue()}</span>,
      }),
      columnHelper.accessor('moneyOut', {
        header: 'Money out',
        cell: (info) => (
          <span className="text-right font-mono text-vanta-black block">
            {info.getValue() > 0 ? `R${fmt(info.getValue())}` : '—'}
          </span>
        ),
      }),
      columnHelper.accessor('moneyIn', {
        header: 'Money in',
        cell: (info) => (
          <span className="text-right font-mono text-vanta-black block">
            {info.getValue() > 0 ? `R${fmt(info.getValue())}` : '—'}
          </span>
        ),
      }),
      columnHelper.accessor('total', {
        header: 'Total so far',
        cell: (info) => (
          <span className="text-right font-mono font-semibold text-vanta-black block">R{fmt(info.getValue())}</span>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: ledgerRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onCorrected={updateTransaction}
        onDelete={(tx) => deleteTransaction(tx.id)}
      />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addTransaction} />

      <div className="relative max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-2xl font-serif text-vanta-black tracking-tight">Ledger</h1>
            <p className="text-sm text-vanta-gray mt-1">Every sale and expense you've recorded</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-white px-5 py-2.5 text-xs font-semibold transition-all flex items-center gap-2 rounded-lg active:scale-[0.98] bg-vanta-navy hover:bg-vanta-navy-dark shadow-[0_6px_18px_-6px_rgba(1,90,234,0.45)] hover:shadow-[0_8px_22px_-6px_rgba(1,90,234,0.55)] hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Add Transaction
          </button>
        </div>

        <div
          className="bg-white border border-vanta-border rounded-2xl overflow-hidden"
          style={{ boxShadow: SHADOW_SM }}
        >
          {/*
            Account header. Previously a 4-column grid of five equal-weight
            label/value pairs on a gradient wash — which orphaned the fifth
            cell and gave the opening balance no more prominence than the
            currency code. Reworked on the Stripe Dashboard account-header
            pattern: the figure that matters is set apart on the right at
            display scale, and the descriptive facts collapse into a single
            inline metadata line, since none of them individually deserves
            its own column.
          */}
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 px-6 py-5 border-b border-vanta-border">
            <div className="min-w-0">
              <div className="text-[15px] font-serif text-vanta-black">Vanta Books</div>
              <div className="mt-1 text-[12px] text-vanta-gray flex flex-wrap items-center gap-x-1.5">
                <span>Operating Account</span>
                <span aria-hidden="true">·</span>
                <span>ZAR</span>
                <span aria-hidden="true">·</span>
                <span>
                  Fiscal year{' '}
                  <span className="font-mono tabular-nums">{new Date().getFullYear()}</span>
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <div className="text-[11px] uppercase tracking-[0.08em] text-vanta-gray font-medium">
                Starting total
              </div>
              <div className="mt-1 text-[20px] leading-none font-mono font-semibold tabular-nums text-vanta-black">
                R{fmt(STARTING_TOTAL)}
              </div>
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
              <Table className="text-xs">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-vanta-sidebar text-vanta-gray uppercase tracking-wider text-[10px] hover:bg-vanta-sidebar">
                      {headerGroup.headers.map((header) => {
                        const isNumeric = ['moneyOut', 'moneyIn', 'total'].includes(header.column.id);
                        return (
                          <TableHead
                            key={header.id}
                            className={cn('font-semibold px-4 py-3 h-auto', isNumeric ? 'text-right' : 'text-left')}
                          >
                            <button
                              onClick={header.column.getToggleSortingHandler()}
                              className={cn(
                                'inline-flex items-center gap-1 hover:text-vanta-black transition-colors',
                                isNumeric && 'flex-row-reverse',
                              )}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() && <ArrowUpDown size={10} />}
                            </button>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="divide-y divide-vanta-border/60">
                  {table.getRowModel().rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelectedTx(row.original.tx)}
                      className={cn(
                        'border-b hover:bg-vanta-sidebar transition-colors cursor-pointer',
                        row.original.tx.needs_review && 'border-l-2 border-l-vanta-black',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3 whitespace-normal">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))}
                </TableBody>
                <TableFooter className="bg-vanta-sidebar font-semibold">
                  <TableRow className="hover:bg-vanta-sidebar">
                    <TableCell colSpan={5} className="px-4 py-3 text-right text-vanta-gray uppercase tracking-wider text-[10px]">
                      Totals
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-vanta-black">R{fmt(totalMoneyOut)}</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-vanta-black">R{fmt(totalMoneyIn)}</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-vanta-black">R{fmt(endingTotal)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
