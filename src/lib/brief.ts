import type { Transaction } from '../components/TransactionDetailModal';
import type { Debt } from '../hooks/useDebts';
import { needsReviewCount } from './metrics';

/**
 * The Vanta Brief — a calm, natural-language weekly summary, not a dashboard.
 *
 * Every figure here is a real aggregate of already-fetched transaction/debt
 * rows (same 200-row-capped, real-data source useTransactions/useDebts use
 * elsewhere in the app). Nothing is estimated, guessed, or phrased by a
 * model — this file only does arithmetic. needs_review rows are excluded
 * from every total, same rule the backend's generate-summary/query-
 * transactions functions already enforce: an unconfirmed guess should never
 * contribute to a number the owner is told to trust.
 */

function txDate(t: Transaction): Date {
  return new Date(t.date || t.created_at);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function inWindow(t: Transaction, start: Date, end: Date): boolean {
  const d = txDate(t);
  return d >= start && d < end;
}

export interface WeeklyTotals {
  totalIn: number;
  totalOut: number;
  net: number;
  /** True once there's at least one confirmed transaction in the window. */
  hasActivity: boolean;
}

/** Money in/out over the trailing `days` (default 7, inclusive of today). Needs-review rows excluded. */
export function weeklyTotals(transactions: Transaction[], days = 7): WeeklyTotals {
  const start = daysAgo(days - 1);
  const end = daysAgo(-1);
  const confirmed = transactions.filter((t) => !t.needs_review && inWindow(t, start, end));

  const totalIn = confirmed.filter((t) => t.direction === 'in').reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalOut = confirmed.filter((t) => t.direction === 'out').reduce((s, t) => s + (t.amount ?? 0), 0);

  return { totalIn, totalOut, net: totalIn - totalOut, hasActivity: confirmed.length > 0 };
}

export interface BiggestExpense {
  category: string;
  amount: number;
}

/** The single expense category with the highest spend in the trailing `days`. Null if no expenses. */
export function biggestExpense(transactions: Transaction[], days = 7): BiggestExpense | null {
  const start = daysAgo(days - 1);
  const end = daysAgo(-1);
  const totals = new Map<string, number>();

  for (const t of transactions) {
    if (t.needs_review || t.direction !== 'out') continue;
    if (!inWindow(t, start, end)) continue;
    const key = t.category || 'Other';
    totals.set(key, (totals.get(key) ?? 0) + (t.amount ?? 0));
  }

  const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  return { category: sorted[0][0], amount: sorted[0][1] };
}

/** Real money still owed TO the business — outstanding debts only, never settled ones. */
export function owedToBusiness(debts: Debt[]): number {
  return debts
    .filter((d) => d.direction === 'owed_to_business' && d.status === 'outstanding')
    .reduce((s, d) => s + (d.amount ?? 0), 0);
}

export interface WeekComparison {
  thisWeek: WeeklyTotals;
  lastWeek: WeeklyTotals;
  /** False when last week has no confirmed activity — a comparison against zero isn't honest, so callers must say so instead. */
  canCompare: boolean;
}

/** This week vs the trailing 7 days before that — for the "how does this compare to last week?" follow-up. */
export function weekOverWeek(transactions: Transaction[]): WeekComparison {
  const thisWeek = weeklyTotals(transactions, 7);

  const start = daysAgo(13);
  const end = daysAgo(7);
  const confirmed = transactions.filter((t) => !t.needs_review && inWindow(t, start, end));
  const lastWeek: WeeklyTotals = {
    totalIn: confirmed.filter((t) => t.direction === 'in').reduce((s, t) => s + (t.amount ?? 0), 0),
    totalOut: confirmed.filter((t) => t.direction === 'out').reduce((s, t) => s + (t.amount ?? 0), 0),
    net: 0,
    hasActivity: confirmed.length > 0,
  };
  lastWeek.net = lastWeek.totalIn - lastWeek.totalOut;

  return { thisWeek, lastWeek, canCompare: lastWeek.hasActivity };
}

export interface VantaBrief {
  hasEnoughData: boolean;
  totals: WeeklyTotals;
  expense: BiggestExpense | null;
  owed: number;
  reviewCount: number;
  /** The briefing as separate lines — the UI renders each as its own paragraph, never concatenated into one dense block. */
  lines: string[];
}

const rand = (n: number) => 'R' + Math.round(Math.abs(n)).toLocaleString('en-ZA');

/** Composes the calm, natural-language briefing lines from real, already-computed figures. Never invents a sentence about data that doesn't exist. */
export function buildBrief(transactions: Transaction[], debts: Debt[]): VantaBrief {
  const totals = weeklyTotals(transactions, 7);
  const expense = biggestExpense(transactions, 7);
  const owed = owedToBusiness(debts);
  const reviewCount = needsReviewCount(transactions);

  if (!totals.hasActivity) {
    return {
      hasEnoughData: false,
      totals,
      expense,
      owed,
      reviewCount,
      lines: ["Nothing recorded this week yet — tell Vanta about a sale or expense and I'll brief you here."],
    };
  }

  const lines: string[] = [];
  lines.push(`You brought in ${rand(totals.totalIn)} and spent ${rand(totals.totalOut)}.`);

  if (totals.net > 0) {
    lines.push(`That's ${rand(totals.net)} more in than out.`);
  } else if (totals.net < 0) {
    lines.push(`That's ${rand(totals.net)} more out than in.`);
  } else {
    lines.push("You broke even — money in matched money out.");
  }

  if (expense) {
    lines.push(`${expense.category} was your biggest expense, at ${rand(expense.amount)}.`);
  }

  if (owed > 0) {
    lines.push(`${rand(owed)} is still owed to you.`);
  }

  if (reviewCount > 0) {
    lines.push(`${reviewCount} transaction${reviewCount === 1 ? '' : 's'} need${reviewCount === 1 ? 's' : ''} your review.`);
  }

  return { hasEnoughData: true, totals, expense, owed, reviewCount, lines };
}

export interface FollowUpAnswer {
  question: string;
  answer: string;
}

/** Deterministic answers to the four fixed follow-up prompts — every figure traces back to buildBrief/weekOverWeek, nothing is asked of a model. */
export function answerFollowUp(
  question: 'why' | 'biggest-expense' | 'compare' | 'worry',
  transactions: Transaction[],
  debts: Debt[],
): FollowUpAnswer {
  const brief = buildBrief(transactions, debts);

  switch (question) {
    case 'why': {
      if (!brief.hasEnoughData) {
        return { question: 'Why?', answer: "There's not enough recorded yet this week to explain — log a sale or expense first." };
      }
      const driver = brief.expense
        ? `mostly because of ${brief.expense.category}, which came to ${rand(brief.expense.amount)}`
        : 'mostly from the sales you brought in';
      const direction = brief.totals.net >= 0 ? 'ahead' : 'behind';
      return {
        question: 'Why?',
        answer: `You're ${direction} this week ${driver}.`,
      };
    }

    case 'biggest-expense': {
      if (!brief.expense) {
        return { question: 'What was my biggest expense?', answer: "No expenses recorded this week yet." };
      }
      return {
        question: 'What was my biggest expense?',
        answer: `${brief.expense.category}, at ${rand(brief.expense.amount)}.`,
      };
    }

    case 'compare': {
      const cmp = weekOverWeek(transactions);
      if (!cmp.canCompare) {
        return { question: 'How does this compare to last week?', answer: "There's no confirmed activity from last week to compare against yet." };
      }
      const inDiff = cmp.thisWeek.totalIn - cmp.lastWeek.totalIn;
      const outDiff = cmp.thisWeek.totalOut - cmp.lastWeek.totalOut;
      const inWord = inDiff >= 0 ? 'more' : 'less';
      const outWord = outDiff >= 0 ? 'more' : 'less';
      return {
        question: 'How does this compare to last week?',
        answer: `You brought in ${rand(inDiff)} ${inWord} and spent ${rand(outDiff)} ${outWord} than last week.`,
      };
    }

    case 'worry': {
      const concerns: string[] = [];
      if (brief.reviewCount > 0) {
        concerns.push(`${brief.reviewCount} transaction${brief.reviewCount === 1 ? '' : 's'} still need${brief.reviewCount === 1 ? 's' : ''} your review`);
      }
      if (brief.hasEnoughData && brief.totals.net < 0) {
        concerns.push(`you spent ${rand(Math.abs(brief.totals.net))} more than you brought in this week`);
      }
      if (brief.owed > 0) {
        concerns.push(`${rand(brief.owed)} is still outstanding from people who owe you`);
      }
      if (concerns.length === 0) {
        return { question: 'What should I worry about?', answer: "Nothing stands out right now — everything's confirmed and you're ahead this week." };
      }
      return {
        question: 'What should I worry about?',
        answer: concerns.join('; ') + '.',
      };
    }
  }
}
