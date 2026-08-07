import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Skeleton } from '../ui/skeleton';
import { SHADOW_SM } from '../../lib/surfaces';
import { categoryBreakdown } from '../../lib/metrics';
import type { Transaction } from '../TransactionDetailModal';

interface CategoryDonutProps {
  transactions: Transaction[];
  isLoading: boolean;
}

/**
 * A single-hue tint scale (light to full navy) rather than a rainbow palette
 * — Vanta has exactly one accent color, so category difference is carried by
 * position/label/percentage, not by introducing new hues.
 */
const SLICE_SHADES = ['#153F78', '#1E5AA8', '#2563EB', '#5B8DEF', '#93B8F5', '#C7DAFA'];

const rand = (n: number) => n.toLocaleString('en-ZA', { maximumFractionDigits: 0 });

export function CategoryDonut({ transactions, isLoading }: CategoryDonutProps) {
  const breakdown = categoryBreakdown(transactions, 30).slice(0, 6);
  const total = breakdown.reduce((sum, c) => sum + c.total, 0);

  return (
    <section
      className="bg-white border border-vanta-border rounded-2xl px-4 py-4"
      style={{ boxShadow: SHADOW_SM }}
      aria-label="Spending by category"
    >
      <div className="text-[11px] uppercase tracking-[0.08em] text-vanta-gray font-medium mb-3">
        Where it went, last 30 days
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : breakdown.length === 0 ? (
        <p className="text-[12.5px] text-vanta-gray leading-snug">
          No expenses recorded in the last 30 days yet.
        </p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="total"
                  nameKey="category"
                  innerRadius="68%"
                  outerRadius="100%"
                  strokeWidth={0}
                >
                  {breakdown.map((entry, i) => (
                    <Cell key={entry.category} fill={SLICE_SHADES[i % SLICE_SHADES.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] uppercase tracking-wider text-vanta-gray-light">Total</span>
              <span className="text-[13px] font-mono font-semibold text-vanta-black tabular-nums">
                R{rand(total)}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            {breakdown.map((c, i) => (
              <div key={c.category} className="flex items-center gap-2 text-[12px]">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: SLICE_SHADES[i % SLICE_SHADES.length] }}
                />
                <span className="text-vanta-gray truncate flex-1">{c.category}</span>
                <span className="font-mono text-vanta-black tabular-nums shrink-0">
                  {total > 0 ? Math.round((c.total / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
