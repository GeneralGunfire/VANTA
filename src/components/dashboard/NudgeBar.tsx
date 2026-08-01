import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Users, CalendarClock } from 'lucide-react';
import { SHADOW_SM } from '../../lib/surfaces';
import { needsReviewCount } from '../../lib/metrics';
import { overdueDebtsOwedToBusiness } from '../../lib/overdueDebts';
import { nextUpcomingDeadline } from '../../lib/taxDeadlines';
import type { Transaction } from '../TransactionDetailModal';
import type { Debt } from '../../hooks/useDebts';

interface NudgeBarProps {
  transactions: Transaction[];
  debts: Debt[];
  isVatRegistered: boolean;
}

interface Nudge {
  key: string;
  icon: typeof AlertTriangle;
  text: string;
  path: string;
}

/**
 * Plain-text, honest nudges that tie Chat back to the rest of the app —
 * shown only when genuinely true, never as placeholder/zero-state clutter.
 * A debt counts as overdue once it's been outstanding 30+ days with no
 * settlement (see overdueDebts.ts) — a reasonable "should have been paid
 * by now" default with no domain-specific signal to do better. A tax
 * deadline surfaces once it's within 14 days (see taxDeadlines.ts) — close
 * enough to be actionable, far enough to give real notice.
 */
export function NudgeBar({ transactions, debts, isVatRegistered }: NudgeBarProps) {
  const navigate = useNavigate();

  const nudges: Nudge[] = [];

  const reviewCount = needsReviewCount(transactions);
  if (reviewCount > 0) {
    nudges.push({
      key: 'needs-review',
      icon: AlertTriangle,
      text: `${reviewCount} ${reviewCount === 1 ? 'transaction needs' : 'transactions need'} review`,
      path: '/app/ledger',
    });
  }

  const overdue = overdueDebtsOwedToBusiness(debts);
  if (overdue.length > 0) {
    nudges.push({
      key: 'overdue-debts',
      icon: Users,
      text: overdue.length === 1
        ? `${overdue[0].party_name ?? 'A customer'} still owes you money`
        : `${overdue.length} customers still owe you money`,
      path: '/app/debtors',
    });
  }

  const deadline = nextUpcomingDeadline(isVatRegistered);
  if (deadline) {
    nudges.push({
      key: 'tax-deadline',
      icon: CalendarClock,
      text: deadline.daysUntil === 0
        ? `${deadline.title} is due today`
        : `${deadline.title} is due in ${deadline.daysUntil} ${deadline.daysUntil === 1 ? 'day' : 'days'}`,
      path: '/app/tax-calendar',
    });
  }

  if (nudges.length === 0) return null;

  return (
    <div className="bg-white border border-vanta-border rounded-2xl p-3 space-y-1" style={{ boxShadow: SHADOW_SM }}>
      {nudges.slice(0, 3).map((n) => (
        <button
          key={n.key}
          onClick={() => navigate(n.path)}
          className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-vanta-sidebar transition-colors"
        >
          <n.icon size={13} className="text-vanta-black shrink-0" />
          <span className="text-[12.5px] text-vanta-black leading-snug">{n.text}</span>
        </button>
      ))}
    </div>
  );
}
