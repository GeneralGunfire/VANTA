import type { Debt } from '../hooks/useDebts';

/** A debt "should have been paid by now" once it's been outstanding this long, with no settlement. */
const OVERDUE_WINDOW_DAYS = 30;

/** Outstanding debts owed TO the business (not the business's own debts) older than the overdue window. */
export function overdueDebtsOwedToBusiness(debts: Debt[]): Debt[] {
  const cutoff = Date.now() - OVERDUE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return debts.filter(
    (d) => d.direction === 'owed_to_business' && d.status === 'outstanding' && new Date(d.created_at).getTime() <= cutoff,
  );
}
