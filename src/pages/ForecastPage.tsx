import { AlertTriangle, TrendingUp } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useDebts } from '../hooks/useDebts';
import { computeCashflowForecast } from '../lib/forecast';

const fmt = (n: number) => `R${Math.round(Math.abs(n)).toLocaleString('en-ZA')}`;

/**
 * Forward-looking, distinct from the Ledger (which is descriptive, not
 * predictive). Every number below is computed client-side from real rows —
 * see src/lib/forecast.ts. No model is asked to produce or guess a figure.
 * Plain text only, no chart — a forecast is exactly the kind of feature
 * that invites a trend line, and that's deliberately not built here.
 */
export default function ForecastPage() {
  const { transactions, isLoading: txLoading, loadError: txError } = useTransactions();
  const { debts, isLoading: debtsLoading, loadError: debtsError } = useDebts();

  const isLoading = txLoading || debtsLoading;
  const loadError = txError || debtsError;

  const forecast = computeCashflowForecast(transactions, debts);

  const shortfall = forecast.estimatedNet < 0;

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-vanta-black tracking-tight">Cashflow Forecast</h1>
          <p className="text-sm text-vanta-gray mt-1">An estimate for the next 7 days, based on your recent pattern</p>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-vanta-gray text-sm italic">Loading…</div>
        ) : loadError ? (
          <div role="alert" className="flex items-center justify-center gap-2 py-16 text-vanta-black text-sm px-6">
            <AlertTriangle size={16} />
            Couldn't load your data: {loadError}
          </div>
        ) : !forecast.hasEnoughData ? (
          <div className="text-center py-20 text-vanta-gray text-sm px-6 leading-relaxed border border-vanta-border rounded-2xl bg-white">
            Not enough recorded history yet for a reliable forecast — a confident-looking number off just a few transactions
            would be misleading. Keep recording in chat for at least a couple of weeks and check back soon.
          </div>
        ) : (
          <div className="space-y-6">
            <div
              className="border border-vanta-border rounded-2xl bg-white p-6"
              style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-vanta-navy" />
                <span className="text-[10px] uppercase tracking-widest font-semibold text-vanta-black">7-day estimate</span>
              </div>
              <p className="text-sm text-vanta-black leading-relaxed">
                Based on your recent pattern, you may {shortfall ? 'be short by about' : 'come out ahead by about'}{' '}
                <span className="font-mono font-semibold">{fmt(forecast.estimatedNet)}</span> over the next 7 days.
              </p>
              <p className="text-xs text-vanta-gray mt-2 leading-relaxed">
                This is an estimate from your last {forecast.windowDays} days of activity and outstanding amounts owed to you —
                not a guarantee. Unexpected income or expenses will change the actual outcome.
              </p>
            </div>

            <div
              className="border border-vanta-border rounded-2xl bg-white p-6"
              style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}
            >
              <div className="text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-4">Breakdown</div>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-vanta-gray font-sans">Expected in — from recent income pattern</span>
                  <span className="text-vanta-black">R{fmt(forecast.expectedInFromPattern)}</span>
                </div>
                {forecast.expectedInFromDebts > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-vanta-gray font-sans">Expected in — outstanding amounts owed to you</span>
                    <span className="text-vanta-black">R{fmt(forecast.expectedInFromDebts)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-vanta-border">
                  <span className="text-vanta-black font-sans font-medium">Total expected in</span>
                  <span className="text-vanta-black font-semibold">R{fmt(forecast.expectedIn)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-vanta-gray font-sans">Expected out — from recent spending pattern</span>
                  <span className="text-vanta-black">R{fmt(forecast.expectedOut)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-vanta-border">
                  <span className="text-vanta-black font-sans font-medium">{shortfall ? 'Estimated shortfall' : 'Estimated surplus'}</span>
                  <span className="text-vanta-black font-semibold">R{fmt(forecast.estimatedNet)}</span>
                </div>
              </div>
            </div>

            {forecast.recurringExpense && (
              <div className="border border-vanta-border rounded-2xl bg-white p-6" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
                <div className="text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">Recurring expense detected</div>
                <p className="text-sm text-vanta-black leading-relaxed">
                  "{forecast.recurringExpense.description}" — roughly{' '}
                  <span className="font-mono">R{fmt(forecast.recurringExpense.amount)}</span> about once a month, seen{' '}
                  {forecast.recurringExpense.occurrences} times recently.
                </p>
              </div>
            )}

            <p className="text-xs text-vanta-gray-light leading-relaxed">
              This forecast only looks at confirmed transactions from the last {forecast.windowDays} days and outstanding
              amounts in Debtors &amp; Creditors — it does not know about anything you haven't recorded yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
