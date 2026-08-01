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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-vanta-border rounded-2xl bg-white p-5 sm:col-span-2" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
              <div className="text-[11px] uppercase tracking-widest text-vanta-gray-light mb-1.5">Recording since</div>
              <div className="text-2xl font-mono font-semibold text-vanta-black">
                {new Date(record.recordingSince!).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })}
              </div>
              <div className="text-xs text-vanta-gray mt-1">
                {record.monthsRecording} {record.monthsRecording === 1 ? 'month' : 'months'} of records
              </div>
            </div>

            <div className="border border-vanta-border rounded-2xl bg-white p-5" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
              <div className="text-[11px] uppercase tracking-widest text-vanta-gray-light mb-1.5">Total recorded revenue</div>
              <div className="text-2xl font-mono font-semibold text-vanta-black">{fmt(record.totalRevenue)}</div>
            </div>

            <div className="border border-vanta-border rounded-2xl bg-white p-5" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
              <div className="text-[11px] uppercase tracking-widest text-vanta-gray-light mb-1.5">Average monthly revenue</div>
              <div className="text-2xl font-mono font-semibold text-vanta-black">{fmt(record.avgMonthlyRevenue)}</div>
            </div>

            <div className="border border-vanta-border rounded-2xl bg-white p-5" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
              <div className="text-[11px] uppercase tracking-widest text-vanta-gray-light mb-1.5">Records maintained</div>
              <div className="text-2xl font-mono font-semibold text-vanta-black">
                {record.monthsWithActivity}<span className="text-vanta-gray-light text-lg"> / {record.monthsChecked}</span>
              </div>
              <div className="text-xs text-vanta-gray mt-1">months with activity</div>
            </div>

            <div className="border border-vanta-border rounded-2xl bg-white p-5" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
              <div className="text-[11px] uppercase tracking-widest text-vanta-gray-light mb-1.5">Owed to the business</div>
              <div className="text-2xl font-mono font-semibold text-vanta-black">{fmt(record.outstandingOwedToBusiness)}</div>
            </div>

            <div className="border border-vanta-border rounded-2xl bg-white p-5" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
              <div className="text-[11px] uppercase tracking-widest text-vanta-gray-light mb-1.5">Owed by the business</div>
              <div className="text-2xl font-mono font-semibold text-vanta-black">{fmt(record.outstandingOwedByBusiness)}</div>
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
