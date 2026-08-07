import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Users, CalendarClock } from 'lucide-react';
import { SHADOW_SM } from '../../lib/surfaces';
import { overdueDebtsOwedToBusiness } from '../../lib/overdueDebts';
import { nextUpcomingDeadline } from '../../lib/taxDeadlines';
import type { Transaction } from '../TransactionDetailModal';
import type { Debt } from '../../hooks/useDebts';

interface NeedsAttentionProps {
  transactions: Transaction[];
  debts: Debt[];
  isVatRegistered: boolean;
}

interface AttentionItem {
  key: string;
  icon: typeof AlertTriangle;
  /** e.g. "Review transaction" — the category of thing this is. */
  label: string;
  /** The real, specific detail — a transaction's own description, a debtor's own name and amount, a deadline's own title. Never a generic placeholder. */
  detail: string;
  path: string;
}

/**
 * One calm area instead of notifications scattered everywhere. Each row is
 * a real, specific thing (an actual transaction's wording, an actual
 * debtor's name and amount, an actual deadline) — never an aggregated
 * count standing in for detail the owner would have to click through to
 * see. Shown only when genuinely true; renders nothing at all otherwise.
 *
 * Same three real sources as before (this replaces NudgeBar): a debt
 * counts as overdue at 30+ days outstanding (see overdueDebts.ts), a tax
 * deadline surfaces inside a 14-day window (see taxDeadlines.ts).
 */
export function NeedsAttention({ transactions, debts, isVatRegistered }: NeedsAttentionProps) {
  const navigate = useNavigate();

  const items: AttentionItem[] = [];

  const needsReview = transactions.filter((t) => t.needs_review).slice(0, 2);
  for (const t of needsReview) {
    items.push({
      key: `review-${t.id}`,
      icon: AlertTriangle,
      label: 'Review transaction',
      detail: t.description || t.raw_input || `${t.category} — R${(t.amount ?? 0).toFixed(0)}`,
      path: '/app/ledger',
    });
  }

  const overdue = overdueDebtsOwedToBusiness(debts).slice(0, 2);
  for (const d of overdue) {
    items.push({
      key: `overdue-${d.id}`,
      icon: Users,
      label: 'Invoice overdue',
      detail: `${d.party_name ?? 'Unknown'} — R${(d.amount ?? 0).toLocaleString('en-ZA')}`,
      path: '/app/debtors',
    });
  }

  const deadline = nextUpcomingDeadline(isVatRegistered);
  if (deadline) {
    items.push({
      key: 'tax-deadline',
      icon: CalendarClock,
      label: 'Tax date approaching',
      detail: deadline.daysUntil === 0
        ? `${deadline.title} is due today`
        : `${deadline.title} due in ${deadline.daysUntil} ${deadline.daysUntil === 1 ? 'day' : 'days'}`,
      path: '/app/tax-calendar',
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-white border border-vanta-border rounded-2xl p-4" style={{ boxShadow: SHADOW_SM }}>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[11px] uppercase tracking-[0.08em] text-vanta-gray font-medium">Needs your attention</span>
        <span className="text-[11px] text-vanta-gray-light">{items.length} {items.length === 1 ? 'thing' : 'things'}</span>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className="w-full flex items-start gap-2.5 text-left px-2 py-2 rounded-lg hover:bg-vanta-sidebar transition-colors"
          >
            <item.icon size={13} className="text-vanta-black shrink-0 mt-0.5" />
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-vanta-gray-light">{item.label}</span>
              <span className="block text-[13px] text-vanta-black leading-snug truncate">{item.detail}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
