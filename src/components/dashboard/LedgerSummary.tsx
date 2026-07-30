import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';
import { SHADOW_SM } from '../../lib/surfaces';
import {
  todaysSales,
  todaysSalesTrend,
  cashMovement,
  needsReviewCount,
  groupByDay,
} from '../../lib/metrics';
import type { Transaction } from '../../components/TransactionDetailModal';

interface LedgerSummaryProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const rand = (n: number) => n.toLocaleString('en-ZA', { maximumFractionDigits: 0 });

/**
 * The rail's lead panel. Deliberately NOT a 4-up stat grid.
 *
 * Pattern borrowed from Mercury's account overview and Stripe Dashboard's
 * balance summary: one dominant figure with its context sitting directly
 * underneath it, then tightly-set supporting rows separated by hairline
 * dividers rather than by card chrome. Only the hero number is large; every
 * supporting value is the same modest mono size, so hierarchy is carried by
 * scale and position instead of by four identically-weighted boxes.
 *
 * No icons: in the old MetricCard each tile carried a decorative Lucide glyph
 * in a tinted chip that encoded nothing the label didn't already say.
 */
export function LedgerSummary({ transactions, isLoading }: LedgerSummaryProps) {
  const sales = todaysSales(transactions);
  const trend = todaysSalesTrend(transactions);
  const movement = cashMovement(transactions, 7);
  const reviewCount = needsReviewCount(transactions);

  // Days in the trailing week that actually saw money in — real context for
  // the 7-day figure, and the information the deleted chart was carrying.
  const week = groupByDay(transactions, 7);
  const activeDays = week.filter((d) => d.in > 0 || d.out > 0).length;

  return (
    <section
      className="bg-white border border-vanta-border rounded-2xl px-4 py-4"
      style={{ boxShadow: SHADOW_SM }}
      aria-label="Business summary"
    >
      {/* Hero: today's revenue. The one number allowed to be big. */}
      <div className="text-[11px] uppercase tracking-[0.08em] text-vanta-gray font-medium">
        Taken in today
      </div>

      {isLoading ? (
        <Skeleton className="h-9 w-32 mt-2" />
      ) : (
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-[15px] font-mono text-vanta-gray-light">R</span>
          <span className="text-[30px] leading-none font-mono font-semibold tracking-tight text-vanta-black tabular-nums">
            {rand(sales)}
          </span>
        </div>
      )}

      {!isLoading && (
        <p className="mt-2 text-[12.5px] text-vanta-gray leading-snug">
          {trend === null ? (
            <>No sales yesterday to compare against.</>
          ) : (
            <>
              <span
                className={cn(
                  'font-medium',
                  trend >= 0 ? 'text-vanta-success' : 'text-vanta-danger',
                )}
              >
                {trend >= 0 ? 'Up' : 'Down'} {Math.abs(trend).toFixed(0)}%
              </span>{' '}
              on yesterday.
            </>
          )}
        </p>
      )}

      {/* Supporting rows. Hairline dividers, no nested cards, label left /
          value right — the Linear issue-sidebar property list. */}
      <dl className="mt-4 border-t border-vanta-border">
        <Row label="Net movement, 7 days" loading={isLoading}>
          <span
            className={cn(
              'font-mono tabular-nums font-medium',
              movement >= 0 ? 'text-vanta-black' : 'text-vanta-danger',
            )}
          >
            {movement >= 0 ? '+' : '−'}R{rand(Math.abs(movement))}
          </span>
        </Row>

        <Row label="Days with activity" loading={isLoading}>
          <span className="font-mono tabular-nums text-vanta-black">
            {activeDays}
            <span className="text-vanta-gray-light">/7</span>
          </span>
        </Row>

        <Row label="Needs your review" loading={isLoading}>
          {reviewCount > 0 ? (
            <span className="font-mono tabular-nums font-medium text-vanta-warning">
              {reviewCount}
            </span>
          ) : (
            <span className="text-vanta-gray-light">All clear</span>
          )}
        </Row>

        <Row label="Stock levels" loading={false}>
          <span className="text-vanta-gray-light">Not tracked yet</span>
        </Row>
      </dl>
    </section>
  );
}

function Row({
  label,
  loading,
  children,
}: {
  label: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-vanta-border last:border-b-0">
      <dt className="text-[12.5px] text-vanta-gray">{label}</dt>
      <dd className="text-[12.5px] shrink-0">
        {loading ? <Skeleton className="h-3.5 w-14" /> : children}
      </dd>
    </div>
  );
}
