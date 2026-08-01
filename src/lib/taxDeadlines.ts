export interface TaxDeadline {
  title: string;
  date: Date;
  vatOnly?: boolean;
}

/**
 * Shared with TaxCalendarPage's static SA compliance dates for the 2027 tax
 * year — kept as real Date objects here (rather than the display strings
 * TaxCalendarPage renders) so Chat's nudge can compute "days until" without
 * re-parsing display text. If TaxCalendarPage's dates ever change, update
 * both — they describe the same real-world deadlines.
 */
export const TAX_DEADLINES: TaxDeadline[] = [
  { title: '1st provisional tax payment (IRP6)', date: new Date('2026-08-31') },
  { title: '2nd provisional tax payment (IRP6)', date: new Date('2027-02-26') },
  { title: 'Annual income tax return', date: new Date('2027-01-22') },
  { title: '3rd "top-up" payment (optional)', date: new Date('2027-09-30') },
];

const UPCOMING_WINDOW_DAYS = 14;

/**
 * The next deadline within UPCOMING_WINDOW_DAYS (14 days — close enough to
 * be genuinely actionable, far enough to give real notice), or null if
 * nothing qualifies. VAT-only deadlines are excluded unless the business is
 * VAT registered, matching Tax Calendar's own gating.
 */
export function nextUpcomingDeadline(isVatRegistered: boolean): { title: string; daysUntil: number } | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const candidates = TAX_DEADLINES
    .filter((d) => isVatRegistered || !d.vatOnly)
    .map((d) => ({ title: d.title, daysUntil: Math.round((d.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) }))
    .filter((d) => d.daysUntil >= 0 && d.daysUntil <= UPCOMING_WINDOW_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return candidates[0] ?? null;
}
