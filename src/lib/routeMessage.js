// STUB: keyword-based intent classifier. Swap for real NLU/intent-classification
// logic later. Do not fabricate financial data in the handlers below —
// summary/query intents must return an honest "not implemented" placeholder.

const SUMMARY_KEYWORDS = ["summary", "summarize", "how much", "total", "how many", "spent", "made"];

export const INTENTS = {
  NEW_TRANSACTION: "new_transaction",
  SUMMARY_REQUEST: "summary_request",
  DATA_QUERY: "data_query",
  CORRECTION: "correction",
};

// STUB: correction/reply-to-pending-card detection is not implemented yet —
// every message currently falls through to either a summary/query stub or
// the real transaction parser. Wire up correction handling once pending-card
// state is tracked server-side or in a more persistent way.
export function routeMessage(text) {
  const lower = text.toLowerCase();

  const isSummaryOrQuery = SUMMARY_KEYWORDS.some((kw) => lower.includes(kw));
  if (isSummaryOrQuery) {
    const intent = lower.includes("total") || lower.includes("how much") || lower.includes("spent") || lower.includes("made") || lower.includes("summarize") || lower.includes("summary")
      ? INTENTS.SUMMARY_REQUEST
      : INTENTS.DATA_QUERY;
    return { intent, text };
  }

  return { intent: INTENTS.NEW_TRANSACTION, text };
}

// STUB: placeholder response only — do not generate plausible-looking fake numbers.
export function handleSummaryRequest() {
  return "Summary generation not yet implemented — this is a placeholder response.";
}

// STUB: placeholder response only — do not generate plausible-looking fake numbers.
export function handleDataQuery() {
  return "Data query answering not yet implemented — this is a placeholder response.";
}
