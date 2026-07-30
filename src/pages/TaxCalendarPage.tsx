import { useState } from 'react';
import { CalendarClock, Info } from 'lucide-react';
import { cn } from '../lib/utils';

type RegistrationStatus = 'informal' | 'registered_vat' | 'not_yet_registered';

interface ComplianceDate {
  title: string;
  when: string;
  detail: string;
  vatOnly?: boolean;
}

/**
 * SA compliance dates for the 2027 tax year (1 March 2026 – 28 February
 * 2027), for a business with a standard February financial year-end —
 * the default for individuals and most small/informal businesses in
 * South Africa. Sourced from SARS's own published deadline structure,
 * current as of mid-2026. If this business's financial year-end is NOT
 * the end of February, every one of these dates shifts accordingly —
 * see the note in the UI.
 */
const PROVISIONAL_TAX_DATES: ComplianceDate[] = [
  {
    title: '1st provisional tax payment (IRP6)',
    when: '31 August 2026',
    detail: 'Six months into the 2027 tax year (1 March 2026 – 28 February 2027). Based on an estimate of your total taxable income for the year.',
  },
  {
    title: '2nd provisional tax payment (IRP6)',
    when: '26 February 2027',
    detail: 'At the end of the 2027 tax year, based on a more accurate estimate of full-year taxable income. 28 February 2027 falls on a Sunday, so the deadline shifts to the prior business day.',
  },
  {
    title: '3rd "top-up" payment (optional)',
    when: '30 September 2027',
    detail: 'Optional top-up payment to avoid interest if your February estimate was too low, paid after assessment.',
  },
  {
    title: 'Annual income tax return',
    when: '22 January 2027',
    detail: 'For provisional taxpayers (including most small businesses and trusts) filing via eFiling.',
  },
];

const VAT_DATES: ComplianceDate[] = [
  {
    title: 'VAT201 return & payment',
    when: 'The 25th of the month following each 2-month VAT period (or the last business day before, if the 25th falls on a weekend/public holiday)',
    detail: 'Standard bi-monthly vendors submit a VAT201 return and pay any VAT owing roughly every two months.',
    vatOnly: true,
  },
];

const REGISTRATION_OPTIONS: { value: RegistrationStatus; label: string }[] = [
  { value: 'informal', label: 'Informal / not registered for tax' },
  { value: 'not_yet_registered', label: 'Registered business, not yet VAT registered' },
  { value: 'registered_vat', label: 'VAT registered' },
];

/**
 * No persisted `profiles` row is read/written here yet — this app has no
 * real Supabase auth to scope a profile write to, and no profile-editing
 * UI exists elsewhere. The selector below is a local, session-only toggle
 * so the page is still useful tonight; it is NOT saved to the `profiles`
 * table added in the migration. Wiring this to a real persisted profile
 * is future work once real auth exists. See final report.
 */
export default function TaxCalendarPage() {
  const [status, setStatus] = useState<RegistrationStatus>('informal');
  const isVatRegistered = status === 'registered_vat';

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-vanta-black tracking-tight">Tax & Compliance Calendar</h1>
          <p className="text-sm text-vanta-gray mt-1">Confirmed SA compliance dates for the 2027 tax year</p>
        </div>

        <div className="flex items-start gap-2 p-4 border border-vanta-border rounded-xl bg-white text-xs text-vanta-gray leading-relaxed">
          <Info size={14} className="shrink-0 mt-0.5 text-vanta-black" />
          <span>
            These dates are correct for a standard February financial year-end (1 March 2026 – 28 February 2027) — sourced from
            SARS's own published deadlines, current as of mid-2026. If this business's financial year-end is not the end of
            February, every date below shifts accordingly — reconfirm against SARS eFiling in that case. This page shows a
            static list only; there are no reminders or notifications.
          </span>
        </div>

        <div className="border border-vanta-border rounded-2xl bg-white p-6 space-y-3">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-vanta-black">Your registration status</div>
          <p className="text-xs text-vanta-gray">
            Not saved yet — this app has no persisted profile editing built tonight. Selecting an option here only changes what
            this page shows you, for this session.
          </p>
          <div className="flex items-center gap-1.5 bg-vanta-sidebar p-1.5 border border-vanta-border rounded-full text-xs w-fit flex-wrap">
            {REGISTRATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={cn(
                  'px-4 py-2 font-medium transition-all rounded-full whitespace-nowrap',
                  status === opt.value
                    ? 'bg-white text-vanta-black border border-vanta-border shadow-sm'
                    : 'text-vanta-gray hover:text-vanta-black border border-transparent',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-vanta-border rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
          <div className="flex items-center gap-2 px-6 py-4 border-b border-vanta-border">
            <CalendarClock size={16} className="text-vanta-navy" />
            <h2 className="text-sm font-semibold text-vanta-black">Provisional tax</h2>
          </div>
          <div className="divide-y divide-vanta-border/60">
            {PROVISIONAL_TAX_DATES.map((d) => (
              <div key={d.title} className="px-6 py-4">
                <div className="text-sm font-medium text-vanta-black">{d.title}</div>
                <div className="text-xs font-mono text-vanta-gray mt-1">{d.when}</div>
                <div className="text-xs text-vanta-gray mt-1.5 leading-relaxed">{d.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {isVatRegistered ? (
          <div className="border border-vanta-border rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
            <div className="flex items-center gap-2 px-6 py-4 border-b border-vanta-border">
              <CalendarClock size={16} className="text-vanta-navy" />
              <h2 className="text-sm font-semibold text-vanta-black">VAT</h2>
            </div>
            <div className="divide-y divide-vanta-border/60">
              {VAT_DATES.map((d) => (
                <div key={d.title} className="px-6 py-4">
                  <div className="text-sm font-medium text-vanta-black">{d.title}</div>
                  <div className="text-xs font-mono text-vanta-gray mt-1">{d.when}</div>
                  <div className="text-xs text-vanta-gray mt-1.5 leading-relaxed">{d.detail}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-vanta-gray text-sm px-6 border border-vanta-border rounded-2xl bg-white">
            VAT deadlines are hidden — select "VAT registered" above to see them.
          </div>
        )}
      </div>
    </div>
  );
}
