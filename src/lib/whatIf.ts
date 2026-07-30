import type { Transaction } from '../components/TransactionDetailModal';
import type { Debt } from '../hooks/useDebts';
import { computeCashflowForecast } from './forecast';

export interface WhatIfInput {
  /** Positive = an additional recurring monthly cost (e.g. hiring someone). Negative would mean a monthly saving. */
  extraMonthlyExpense: number;
  /** Percentage change to apply to average monthly revenue, e.g. 20 for "20% more sales". Optional — 0 if not specified. */
  revenueChangePct: number;
}

export interface WhatIfResult {
  hasEnoughData: boolean;
  avgMonthlyRevenue: number;
  avgMonthlyExpenses: number;
  currentMonthlySurplus: number;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedSurplus: number;
  /** Plain arithmetic, shown so the user can verify the math themselves rather than trust an opaque number. */
  workingLine: string;
}

const DAYS_PER_MONTH = 30;

/**
 * Reuses computeCashflowForecast's averages and minimum-history threshold
 * directly rather than duplicating that logic — this function's only job
 * is applying a user-proposed hypothetical on top of numbers already
 * computed elsewhere. No AI model is involved in producing any number
 * here; this is deliberately simple, transparent arithmetic (a monthly
 * average plus a hypothetical), not a financial model — the workingLine
 * exists specifically so the calculation can be shown, not just asserted.
 */
export function computeWhatIf(transactions: Transaction[], debts: Debt[], input: WhatIfInput): WhatIfResult {
  const forecast = computeCashflowForecast(transactions, debts);

  const avgMonthlyRevenue = forecast.avgDailyIncome * DAYS_PER_MONTH;
  const avgMonthlyExpenses = forecast.avgDailyExpense * DAYS_PER_MONTH;
  const currentMonthlySurplus = avgMonthlyRevenue - avgMonthlyExpenses;

  const projectedRevenue = avgMonthlyRevenue * (1 + input.revenueChangePct / 100);
  const projectedExpenses = avgMonthlyExpenses + input.extraMonthlyExpense;
  const projectedSurplus = projectedRevenue - projectedExpenses;

  const fmt = (n: number) => `R${Math.round(n).toLocaleString('en-ZA')}`;
  const parts: string[] = [`${fmt(currentMonthlySurplus)} average monthly surplus`];
  if (input.revenueChangePct !== 0) {
    parts.push(`${input.revenueChangePct > 0 ? '+' : ''}${input.revenueChangePct}% revenue → ${fmt(projectedRevenue)}`);
  }
  if (input.extraMonthlyExpense !== 0) {
    parts.push(`${input.extraMonthlyExpense > 0 ? '+' : '−'}${fmt(Math.abs(input.extraMonthlyExpense))}/month`);
  }
  parts.push(`= ${fmt(projectedSurplus)} projected surplus`);
  const workingLine = parts.join(' · ');

  return {
    hasEnoughData: forecast.hasEnoughData,
    avgMonthlyRevenue,
    avgMonthlyExpenses,
    currentMonthlySurplus,
    projectedRevenue,
    projectedExpenses,
    projectedSurplus,
    workingLine,
  };
}
