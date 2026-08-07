import type { Transaction } from '../components/TransactionDetailModal';
import type { Debt } from '../hooks/useDebts';
import { biggestExpense } from './brief';

/**
 * Ask Vanta — free-text questions about real recorded history, answered
 * deterministically (simple keyword matching, no model call) so the stated
 * answer and its citation ("Based on N recorded purchases") can never drift
 * apart. If the question doesn't clearly match one of the patterns below,
 * this says so honestly rather than guessing — same rule the backend's
 * query-transactions function already follows with its own intent
 * extraction. Hypothetical/affordability questions are deliberately not
 * answered here at all; they're redirected to What If, which is built for
 * exactly that and already refuses to answer without enough history.
 */

const CATEGORIES = ['Sales', 'Stock', 'Rent', 'Utilities', 'Transport', 'Wages', 'Other'];

export interface AskResult {
  understood: boolean;
  /** The direct answer, in plain language. */
  answer: string;
  /** e.g. "Based on 14 recorded purchases" — omitted when the answer isn't backed by a specific row set (e.g. a redirect). */
  basis: string | null;
  /** Router state for "View transactions →", pointing the Ledger at exactly the rows behind this answer. */
  viewFilter: { search?: string; filterType?: 'all' | 'in' | 'out' | 'needs_review' } | null;
  /** Set only for a redirect (e.g. to What If) instead of a direct answer. */
  redirect: { path: string; label: string } | null;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}
function txDate(t: Transaction): Date {
  return new Date(t.date || t.created_at);
}

interface Range {
  start: Date;
  end: Date;
  label: string;
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Resolves a date range purely from keywords in the question — "today," "this week," "this month," or a weekday name (always the most recent past occurrence, even if today is that weekday). Defaults to "this month." */
function resolveRange(question: string): Range {
  const q = question.toLowerCase();
  const now = new Date();

  if (q.includes('today')) {
    return { start: startOfDay(now), end: endOfDay(now), label: 'today' };
  }
  if (q.includes('this week')) {
    const start = startOfDay(now);
    start.setDate(start.getDate() - 6);
    return { start, end: endOfDay(now), label: 'this week' };
  }
  if (q.includes('all time') || q.includes('ever') || q.includes('overall')) {
    return { start: new Date(0), end: endOfDay(now), label: 'overall' };
  }

  for (let i = 0; i < WEEKDAYS.length; i++) {
    if (q.includes(WEEKDAYS[i])) {
      const d = new Date(now);
      let diff = (d.getDay() - i + 7) % 7;
      if (diff === 0) diff = 7; // "last Friday" means a past Friday, never today even if today is Friday
      d.setDate(d.getDate() - diff);
      const label = WEEKDAYS[i][0].toUpperCase() + WEEKDAYS[i].slice(1);
      return { start: startOfDay(d), end: endOfDay(d), label };
    }
  }

  if (q.includes('this month')) {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now), label: 'this month' };
  }

  // Default window — most of the example questions imply "recently" without naming a range.
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now), label: 'this month' };
}

function findCategory(question: string): string | null {
  const q = question.toLowerCase();
  return CATEGORIES.find((c) => q.includes(c.toLowerCase())) ?? null;
}

const rand = (n: number) => 'R' + Math.round(Math.abs(n)).toLocaleString('en-ZA');

export function askVanta(question: string, transactions: Transaction[], debts: Debt[]): AskResult {
  const q = question.toLowerCase().trim();

  // Hypotheticals belong to What If, which already refuses to guess without enough history.
  if (/\b(afford|should i buy|can i buy|worth buying)\b/.test(q)) {
    return {
      understood: true,
      answer: "That's a \"what if\" question rather than something I can look up directly — What If will work through it against your real numbers.",
      basis: null,
      viewFilter: null,
      redirect: { path: '/app/what-if', label: 'Try it in What If' },
    };
  }

  // Who owes money / unpaid invoices — same underlying data either phrasing.
  if (/\b(who owes|owes? me|owed to me|unpaid|not.{0,3}paid|hasn'?t paid|haven'?t paid)\b/.test(q)) {
    const outstanding = debts.filter((d) => d.direction === 'owed_to_business' && d.status === 'outstanding');
    if (outstanding.length === 0) {
      return {
        understood: true,
        answer: "Nobody currently owes you money, based on your recorded debtors.",
        basis: null,
        viewFilter: null,
        redirect: null,
      };
    }
    const total = outstanding.reduce((s, d) => s + (d.amount ?? 0), 0);
    const names = outstanding.slice(0, 3).map((d) => d.party_name ?? 'someone').join(', ');
    return {
      understood: true,
      answer: `${rand(total)} is owed to you by ${outstanding.length === 1 ? names : `${outstanding.length} people`}${outstanding.length <= 3 ? ` (${names})` : ''}.`,
      basis: `Based on ${outstanding.length} recorded debt${outstanding.length === 1 ? '' : 's'}.`,
      viewFilter: null,
      redirect: { path: '/app/debtors', label: 'View debtors →' },
    };
  }

  // Biggest expense(s).
  if (/\bbiggest expense/.test(q)) {
    const range = resolveRange(q);
    const days = Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86400000));
    const top = biggestExpense(transactions, days);
    if (!top) {
      return {
        understood: true,
        answer: `No expenses recorded ${range.label} yet.`,
        basis: null,
        viewFilter: null,
        redirect: null,
      };
    }
    return {
      understood: true,
      answer: `${top.category} was your biggest expense ${range.label}, at ${rand(top.amount)}.`,
      basis: null,
      viewFilter: { search: top.category, filterType: 'out' },
      redirect: null,
    };
  }

  // Category-scoped spend ("how much did I spend on stock this month?").
  const category = findCategory(q);
  const isSpendQuestion = /\b(spend|spent|cost|expense)\b/.test(q);
  if (isSpendQuestion) {
    const range = resolveRange(q);
    const matches = transactions.filter(
      (t) => !t.needs_review && t.direction === 'out' && (!category || t.category === category) && txDate(t) >= range.start && txDate(t) <= range.end,
    );
    const total = matches.reduce((s, t) => s + (t.amount ?? 0), 0);
    if (matches.length === 0) {
      return {
        understood: true,
        answer: `No ${category ? `${category.toLowerCase()} ` : ''}expenses recorded ${range.label} yet.`,
        basis: null,
        viewFilter: null,
        redirect: null,
      };
    }
    return {
      understood: true,
      answer: `You spent ${rand(total)}${category ? ` on ${category}` : ''} ${range.label}.`,
      basis: `Based on ${matches.length} recorded ${matches.length === 1 ? 'purchase' : 'purchases'}.`,
      viewFilter: { search: category ?? '', filterType: 'out' },
      redirect: null,
    };
  }

  // Money in ("how much came in", "how much did I make", "sales").
  const isIncomeQuestion = /\b(came in|brought in|earned?|made|income|sales)\b/.test(q);
  if (isIncomeQuestion) {
    const range = resolveRange(q);
    const matches = transactions.filter(
      (t) => !t.needs_review && t.direction === 'in' && (!category || t.category === category) && txDate(t) >= range.start && txDate(t) <= range.end,
    );
    const total = matches.reduce((s, t) => s + (t.amount ?? 0), 0);
    if (matches.length === 0) {
      return {
        understood: true,
        answer: `No money in recorded ${range.label} yet.`,
        basis: null,
        viewFilter: null,
        redirect: null,
      };
    }
    return {
      understood: true,
      answer: `${rand(total)} came in ${range.label}.`,
      basis: `Based on ${matches.length} recorded ${matches.length === 1 ? 'sale' : 'sales'}.`,
      viewFilter: { search: category ?? '', filterType: 'in' },
      redirect: null,
    };
  }

  return {
    understood: false,
    answer: "I couldn't quite match that to something I can look up yet — try asking about spending, money in, who owes you, or your biggest expense.",
    basis: null,
    viewFilter: null,
    redirect: null,
  };
}
