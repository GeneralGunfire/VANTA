// Shared rate-limiting / cost-ceiling infrastructure for all Vanta Edge
// Functions. Enforcement is gated behind ENFORCE_RATE_LIMITS (see below) —
// with it false, checkLimits() always returns { blocked: false } but still
// computes and returns the real numbers, so logging/dry-run data is
// meaningful even while enforcement is off.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

// ── Enforcement flag ─────────────────────────────────────────────────
// Set to true once active testing is done and real usage data from
// request_log has been reviewed to sanity-check the limits below.
export const ENFORCE_RATE_LIMITS = false;

// ── Limits (conservative defaults — see final report for reasoning) ──
export const MAX_REQUESTS_PER_HOUR = 60;
export const MAX_REQUESTS_PER_DAY = 300;
export const MAX_ESTIMATED_COST_USD_PER_DAY = 1.0;

// Groq llama-3.1-8b-instant published pricing (per published rate card,
// as of this build): $0.05 / 1M input tokens, $0.08 / 1M output tokens.
const INPUT_COST_PER_TOKEN = 0.05 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 0.08 / 1_000_000;

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN;
}

// Rough token estimate when the API doesn't return usage figures directly
// (e.g. before a call is made, for pre-flight logging). ~4 chars/token is
// a standard rough approximation for English text.
export function roughTokenEstimate(text: string): number {
  return Math.ceil(text.length / 4);
}

export function getAnonId(req: Request): string {
  const id = req.headers.get("x-vanta-anon-id");
  return id && id.trim() ? id.trim() : "unknown";
}

export async function logRequest(
  supabase: SupabaseClient,
  params: { anonId: string; endpoint: string; estimatedTokens?: number; estimatedCostUsd?: number },
): Promise<void> {
  // Logging must never break the actual request — swallow failures.
  try {
    await supabase.from("request_log").insert({
      anon_id: params.anonId,
      endpoint: params.endpoint,
      estimated_tokens: params.estimatedTokens ?? null,
      estimated_cost_usd: params.estimatedCostUsd ?? null,
    });
  } catch (err) {
    console.error("request_log insert failed (non-fatal):", err);
  }
}

export interface LimitCheckResult {
  blocked: boolean;
  reason?: string;
  requestsLastHour: number;
  requestsLastDay: number;
  estimatedCostTodayUsd: number;
}

/**
 * Computes real usage numbers against request_log every time, regardless
 * of ENFORCE_RATE_LIMITS. Only the `blocked` field is forced to false
 * when the flag is off — everything else reflects the true current state,
 * so this can be logged/observed as a dry run before enforcement flips on.
 */
export async function checkLimits(supabase: SupabaseClient, anonId: string): Promise<LimitCheckResult> {
  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: hourCount }, { data: dayRows, count: dayCount }] = await Promise.all([
    supabase
      .from("request_log")
      .select("id", { count: "exact", head: true })
      .eq("anon_id", anonId)
      .gte("created_at", oneHourAgo),
    supabase
      .from("request_log")
      .select("estimated_cost_usd", { count: "exact" })
      .eq("anon_id", anonId)
      .gte("created_at", oneDayAgo),
  ]);

  const requestsLastHour = hourCount ?? 0;
  const requestsLastDay = dayCount ?? 0;
  const estimatedCostTodayUsd = (dayRows ?? []).reduce((sum, r) => sum + (r.estimated_cost_usd ?? 0), 0);

  const overHourLimit = requestsLastHour >= MAX_REQUESTS_PER_HOUR;
  const overDayLimit = requestsLastDay >= MAX_REQUESTS_PER_DAY;
  const overCostLimit = estimatedCostTodayUsd >= MAX_ESTIMATED_COST_USD_PER_DAY;

  const wouldBlock = overHourLimit || overDayLimit || overCostLimit;

  return {
    blocked: ENFORCE_RATE_LIMITS && wouldBlock,
    reason: wouldBlock
      ? overCostLimit
        ? "daily cost ceiling"
        : overDayLimit
          ? "daily request limit"
          : "hourly request limit"
      : undefined,
    requestsLastHour,
    requestsLastDay,
    estimatedCostTodayUsd,
  };
}

/** Honest, user-facing rejection message — implemented now even though it can't fire until ENFORCE_RATE_LIMITS is true. */
export function limitExceededResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      error: "You've reached today's limit — try again tomorrow.",
      code: "RATE_LIMIT_EXCEEDED",
    }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
