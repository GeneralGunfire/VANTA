// Real plain-English summary generation (Part 4). Replaces the frontend's
// "not yet implemented" placeholder for summary requests.
//
// HARD RULE: every number in the response is computed here, in code, from
// real database rows. The AI model (if invoked at all) only phrases a
// sentence around numbers that already exist — it never produces, guesses,
// or is asked to state any figure itself. A hallucinated financial number
// would be a serious product failure, not a minor bug, so this function
// deliberately does not give the model any opportunity to originate one:
// the numbers are formatted into the prompt as fixed values to phrase
// around, and the response is validated to still contain those exact
// figures before being returned (see assertNumbersPreserved below).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { checkLimits, getAnonId, limitExceededResponse, logRequest, roughTokenEstimate, estimateCostUsd } from "../_shared/rateLimit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

interface DateRange {
  start: Date;
  end: Date; // exclusive
  label: string;
}

function resolveDateRange(descriptor: string | undefined, startDate: string | undefined, endDate: string | undefined): DateRange {
  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(new Date(endDate).getTime() + 86400000), label: `${startDate} to ${endDate}` };
  }

  const now = new Date();
  const d = (descriptor ?? "this week").toLowerCase().trim();

  if (d.includes("month")) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end, label: "this month" };
  }

  // Default: this week (last 7 days, including today).
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);
  return { start, end, label: "this week" };
}

interface ComputedSummary {
  totalIn: number;
  totalOut: number;
  net: number;
  topCategory: string | null;
  topCategoryAmount: number;
  categoryBreakdown: Record<string, number>;
  transactionCount: number;
  excludedNeedsReviewCount: number;
}

function computeSummary(rows: { amount: number | null; direction: string | null; category: string | null; needs_review: boolean }[]): ComputedSummary {
  // Needs-review rows are excluded from all totals below — an unconfirmed
  // guess should never contribute to a number the user is told to trust.
  // This mirrors the same rule already applied to the chat home snapshot.
  const trusted = rows.filter((r) => !r.needs_review);
  const excludedNeedsReviewCount = rows.length - trusted.length;

  const totalIn = trusted.filter((r) => r.direction === "in").reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalOut = trusted.filter((r) => r.direction === "out").reduce((s, r) => s + (r.amount ?? 0), 0);

  const categoryBreakdown: Record<string, number> = {};
  for (const r of trusted) {
    if (r.direction !== "in" || !r.category) continue;
    categoryBreakdown[r.category] = (categoryBreakdown[r.category] ?? 0) + (r.amount ?? 0);
  }
  const topEntry = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];

  return {
    totalIn,
    totalOut,
    net: totalIn - totalOut,
    topCategory: topEntry?.[0] ?? null,
    topCategoryAmount: topEntry?.[1] ?? 0,
    categoryBreakdown,
    transactionCount: trusted.length,
    excludedNeedsReviewCount,
  };
}

function formatRands(n: number): string {
  return "R" + Math.round(n).toLocaleString("en-ZA");
}

/** Deterministic fallback phrasing — used when Groq is unavailable or its output can't be trusted verbatim. */
function plainEnglishFallback(summary: ComputedSummary, rangeLabel: string): string {
  if (summary.transactionCount === 0) {
    return `No confirmed transactions ${rangeLabel} yet.`;
  }
  const base = `You made ${formatRands(summary.totalIn)} and spent ${formatRands(summary.totalOut)} ${rangeLabel}`;
  if (summary.topCategory) {
    return `${base}, mostly from ${summary.topCategory}.`;
  }
  return `${base}.`;
}

/** Every number the model was given must appear verbatim in its phrasing, or we discard its output and use the deterministic fallback instead. */
function assertNumbersPreserved(text: string, summary: ComputedSummary): boolean {
  const requiredFigures = [formatRands(summary.totalIn), formatRands(summary.totalOut)];
  if (summary.topCategory) requiredFigures.push(formatRands(summary.topCategoryAmount));
  return requiredFigures.every((fig) => text.includes(fig));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const anonId = getAnonId(req);

  try {
    const body = await req.json().catch(() => ({}));
    const range = resolveDateRange(body.range, body.start_date, body.end_date);

    const limitCheck = await checkLimits(supabase, anonId);
    if (limitCheck.blocked) return limitExceededResponse(corsHeaders);

    const { data: rows, error } = await supabase
      .from("transactions")
      .select("amount, direction, category, needs_review")
      .gte("created_at", range.start.toISOString())
      .lt("created_at", range.end.toISOString());

    if (error) {
      await logRequest(supabase, { anonId, endpoint: "generate-summary" });
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary = computeSummary(rows ?? []);
    let text = plainEnglishFallback(summary, range.label);
    let estimatedTokens = 0;
    let estimatedCostUsd = 0;

    // Optional: ask the model to phrase a nicer sentence around the
    // already-computed numbers. The numbers themselves are fixed inputs
    // to the prompt, not something the model is asked to produce — and
    // its output is discarded in favor of the deterministic fallback
    // above if it doesn't reproduce those exact figures verbatim.
    if (summary.transactionCount > 0 && GROQ_API_KEY) {
      const phrasingPrompt = `Rewrite this as one friendly, plain-English sentence for a small business owner. Do not change, round, or add any numbers — use exactly the figures given, word for word. Do not invent any new information.\n\nFacts: money in ${formatRands(summary.totalIn)}, money out ${formatRands(summary.totalOut)}, period "${range.label}"${summary.topCategory ? `, top category "${summary.topCategory}" at ${formatRands(summary.topCategoryAmount)}` : ""}.\n\nReturn only the sentence, nothing else.`;

      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: phrasingPrompt }],
            temperature: 0.3,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const usage = groqData.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
          const candidate = (groqData.choices?.[0]?.message?.content ?? "").trim();
          estimatedTokens = (usage?.prompt_tokens ?? roughTokenEstimate(phrasingPrompt)) + (usage?.completion_tokens ?? roughTokenEstimate(candidate));
          estimatedCostUsd = estimateCostUsd(usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0);

          if (candidate && assertNumbersPreserved(candidate, summary)) {
            text = candidate;
          }
          // else: keep the deterministic fallback — the model's phrasing
          // is discarded silently if it altered any figure.
        }
      } catch (err) {
        console.error("Groq phrasing call failed (using deterministic fallback):", err);
      }
    }

    await logRequest(supabase, { anonId, endpoint: "generate-summary", estimatedTokens: estimatedTokens || undefined, estimatedCostUsd: estimatedCostUsd || undefined });

    return new Response(
      JSON.stringify({
        text,
        range_label: range.label,
        total_in: summary.totalIn,
        total_out: summary.totalOut,
        net: summary.net,
        top_category: summary.topCategory,
        top_category_amount: summary.topCategoryAmount,
        category_breakdown: summary.categoryBreakdown,
        transaction_count: summary.transactionCount,
        excluded_needs_review_count: summary.excludedNeedsReviewCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    await logRequest(supabase, { anonId, endpoint: "generate-summary" });
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
