import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Skeleton } from '../ui/skeleton';
import { SHADOW_SM } from '../../lib/surfaces';
import { groupByDay } from '../../lib/metrics';
import type { Transaction } from '../TransactionDetailModal';

interface CashflowBarsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const rand = (n: number) => n.toLocaleString('en-ZA', { maximumFractionDigits: 0 });

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const inVal = payload.find((p: any) => p.dataKey === 'in')?.value ?? 0;
  const outVal = payload.find((p: any) => p.dataKey === 'out')?.value ?? 0;
  return (
    <div className="bg-white border border-vanta-border rounded-lg px-3 py-2 text-[11px] shadow-lg">
      <div className="font-medium text-vanta-black mb-1">{label}</div>
      <div className="text-vanta-navy">In: R{rand(inVal)}</div>
      <div className="text-vanta-gray-light">Out: R{rand(outVal)}</div>
    </div>
  );
}

export function CashflowBars({ transactions, isLoading }: CashflowBarsProps) {
  const days = groupByDay(transactions, 7);
  const hasActivity = days.some((d) => d.in > 0 || d.out > 0);

  return (
    <section
      className="bg-white border border-vanta-border rounded-2xl px-4 py-4"
      style={{ boxShadow: SHADOW_SM }}
      aria-label="Money in and out, last 7 days"
    >
      <div className="text-[11px] uppercase tracking-[0.08em] text-vanta-gray font-medium mb-3">
        In &amp; out, last 7 days
      </div>

      {isLoading ? (
        <Skeleton className="h-36 w-full rounded-xl" />
      ) : !hasActivity ? (
        <p className="text-[12.5px] text-vanta-gray leading-snug">
          No activity in the last 7 days yet — it'll show up here once you log something.
        </p>
      ) : (
        <div className="h-36 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days} barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-vanta-border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'var(--color-vanta-gray-light)' }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-muted)' }} />
              <Bar dataKey="in" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} maxBarSize={14} />
              <Bar dataKey="out" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex items-center gap-4 mt-2 text-[11px] text-vanta-gray-light">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-chart-1)' }} /> In
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-chart-2)' }} /> Out
        </span>
      </div>
    </section>
  );
}
