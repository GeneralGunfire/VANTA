// STUB: in-memory correction log only. Populated by the placeholder
// onEditTransaction handlers in Ledger.jsx and Chat.jsx. Not persisted —
// resets on reload. Once real edit persistence exists, this should read
// from an actual corrections/audit table instead.

let history = [];
const listeners = new Set();

export function recordCorrection({ transactionId, before, after, source }) {
  history = [
    {
      id: `correction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      transactionId,
      before,
      after,
      source,
      correctedAt: new Date().toISOString(),
    },
    ...history,
  ];
  listeners.forEach((fn) => fn(history));
}

export function getCorrectionHistory() {
  return history;
}

export function subscribeCorrectionHistory(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
