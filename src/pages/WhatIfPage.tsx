import { useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useDebts } from '../hooks/useDebts';
import { computeWhatIf } from '../lib/whatIf';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const fmt = (n: number) => `R${Math.round(Math.abs(n)).toLocaleString('en-ZA')}`;

/**
 * Evaluates a specific hypothetical the user proposes — distinct from the
 * passive Forecast page. Built as a simple form (not chat-routed): the
 * two inputs it needs (an extra monthly cost, a revenue % change) map
 * cleanly to form fields, and a form keeps the underlying calculation
 * fully visible/predictable rather than adding an LLM-classification step
 * for something that should stay transparent and simple.
 */
export default function WhatIfPage() {
  const { transactions, isLoading: txLoading, loadError: txError } = useTransactions();
  const { debts, isLoading: debtsLoading, loadError: debtsError } = useDebts();

  const [extraExpenseInput, setExtraExpenseInput] = useState('');
  const [revenuePctInput, setRevenuePctInput] = useState('');

  const isLoading = txLoading || debtsLoading;
  const loadError = txError || debtsError;

  const extraMonthlyExpense = Number(extraExpenseInput) || 0;
  const revenueChangePct = Number(revenuePctInput) || 0;
  const hasAnyInput = extraExpenseInput.trim() !== '' || revenuePctInput.trim() !== '';

  const result = computeWhatIf(transactions, debts, { extraMonthlyExpense, revenueChangePct });

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-vanta-black tracking-tight">What If</h1>
          <p className="text-sm text-vanta-gray mt-1">A simple estimate for a hypothetical change, based on your recent average</p>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-vanta-gray text-sm italic">Loading…</div>
        ) : loadError ? (
          <div role="alert" className="flex items-center justify-center gap-2 py-16 text-vanta-black text-sm px-6">
            <AlertTriangle size={16} />
            Couldn't load your data: {loadError}
          </div>
        ) : !result.hasEnoughData ? (
          <div className="text-center py-20 text-vanta-gray text-sm px-6 leading-relaxed border border-vanta-border rounded-2xl bg-white">
            Not enough recorded history yet for a reliable estimate — a hypothetical built on just a few transactions would be
            misleading. Keep recording in chat for at least a couple of weeks and check back soon.
          </div>
        ) : (
          <div className="space-y-6">
            <div
              className="border border-vanta-border rounded-2xl bg-white p-6 space-y-4"
              style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}
            >
              <div className="text-[10px] uppercase tracking-widest font-semibold text-vanta-black">Your hypothetical</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="extra-expense" className="block text-xs text-vanta-gray mb-2">
                    Extra monthly cost (R) — e.g. hiring someone
                  </Label>
                  <Input
                    id="extra-expense"
                    inputMode="decimal"
                    placeholder="e.g. 500"
                    value={extraExpenseInput}
                    onChange={(e) => setExtraExpenseInput(e.target.value)}
                    className="w-full bg-white border-vanta-border text-sm text-vanta-black font-mono rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="revenue-pct" className="block text-xs text-vanta-gray mb-2">
                    Revenue change (%) — e.g. 20 for "20% more sales"
                  </Label>
                  <Input
                    id="revenue-pct"
                    inputMode="decimal"
                    placeholder="e.g. 20"
                    value={revenuePctInput}
                    onChange={(e) => setRevenuePctInput(e.target.value)}
                    className="w-full bg-white border-vanta-border text-sm text-vanta-black font-mono rounded-lg"
                  />
                </div>
              </div>
            </div>

            {hasAnyInput && (
              <div
                className="border border-vanta-border rounded-2xl bg-white p-6"
                style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle size={16} className="text-vanta-navy" />
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-vanta-black">Estimate</span>
                </div>
                <p className="text-sm text-vanta-black leading-relaxed">
                  Based on your recent average monthly surplus of{' '}
                  <span className="font-mono font-semibold">{fmt(result.currentMonthlySurplus)}</span>, this change would leave
                  you with roughly{' '}
                  <span className="font-mono font-semibold">{fmt(result.projectedSurplus)}</span>
                  {result.projectedSurplus < 0 ? ' short' : ' per month'} — but this is a simple average-based estimate, not a
                  forecast that accounts for how a change like this might also affect your business in other ways.
                </p>
                <div className="mt-4 pt-4 border-t border-vanta-border">
                  <div className="text-[10px] uppercase tracking-widest font-semibold text-vanta-gray mb-1.5">The math</div>
                  <div className="text-xs font-mono text-vanta-gray leading-relaxed">{result.workingLine}</div>
                </div>
              </div>
            )}

            <p className="text-xs text-vanta-gray-light leading-relaxed">
              This is deliberately simple arithmetic on your recent monthly average — not a sophisticated financial model. It
              doesn't account for one-off costs, seasonal swings, or anything not already reflected in your recorded history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
