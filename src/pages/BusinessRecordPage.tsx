import { AlertTriangle, FileCheck } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useDebts } from '../hooks/useDebts';
import { computeBusinessRecord } from '../lib/businessRecord';

const fmt = (n: number) => `R${Math.round(n).toLocaleString('en-ZA')}`;

/**
 * A plain, honest snapshot of recorded activity — never a single blended
 * "trust score." Every figure is real and individually labeled. Descriptive
 * only tonight: no sharing/export/partner-facing functionality, which
 * would need a real consent flow this pass does not build.
 */
export default function BusinessRecordPage() {
  const { transactions, isLoading: txLoading, loadError: txError } = useTransactions();
  const { debts, isLoading: debtsLoading, loadError: debtsError } = useDebts();

  const isLoading = txLoading || debtsLoading;
  const loadError = txError || debtsError;

  const record = computeBusinessRecord(transactions, debts);

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-vanta-black tracking-tight">Business Record</h1>
          <p className="text-sm text-vanta-gray mt-1">A plain snapshot of what you've recorded — no score, just facts</p>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-vanta-gray text-sm italic">Loading…</div>
        ) : loadError ? (
          <div role="alert" className="flex items-center justify-center gap-2 py-16 text-vanta-black text-sm px-6">
            <AlertTriangle size={16} />
            Couldn't load your data: {loadError}
          </div>
        ) : !record.hasAnyData ? (
          <div className="text-center py-20 text-vanta-gray text-sm px-6 leading-relaxed flex flex-col items-center gap-3 border border-vanta-border rounded-2xl bg-white">
            <FileCheck size={20} className="text-vanta-gray-light" />
            Nothing recorded yet — this page fills in as you record transactions in chat.
          </div>
        ) : (
          <div className="border border-vanta-border rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
            <div className="divide-y divide-vanta-border/60">
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-vanta-gray">Recording since</span>
                <span className="text-sm font-mono text-vanta-black">
                  {new Date(record.recordingSince!).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })} · {record.monthsRecording}{' '}
                  {record.monthsRecording === 1 ? 'month' : 'months'}
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-vanta-gray">Total recorded revenue</span>
                <span className="text-sm font-mono text-vanta-black font-semibold">{fmt(record.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-vanta-gray">Average monthly revenue</span>
                <span className="text-sm font-mono text-vanta-black">{fmt(record.avgMonthlyRevenue)}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-vanta-gray">Records maintained</span>
                <span className="text-sm font-mono text-vanta-black">
                  {record.monthsWithActivity} of last {record.monthsChecked} months
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-vanta-gray">Currently owed to the business</span>
                <span className="text-sm font-mono text-vanta-black">{fmt(record.outstandingOwedToBusiness)}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-vanta-gray">Currently owed by the business</span>
                <span className="text-sm font-mono text-vanta-black">{fmt(record.outstandingOwedByBusiness)}</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-vanta-gray-light leading-relaxed">
          This page is for your own reference only — there's no sharing or export yet. A future version may let you share this
          record with a lender or partner, with your explicit consent, but that isn't built here.
        </p>
      </div>
    </div>
  );
}
