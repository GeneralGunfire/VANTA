// Real data-query logic (Part 5). Replaces the frontend's "not yet
// implemented" placeholder for specific data questions.
//
// AI is used ONLY to extract structured intent (metric, category, date
// range) from the natural-language question. The actual answer is always
// computed by a real, deterministic query/arithmetic in code — the model
// never states or guesses the final number. If intent extraction is
// ambiguous or doesn't map to a real query shape, we return an honest
// "couldn't understand" response rather than fabricate an answer.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { checkLimits, getAnonId, limitExceededResponse, logRequest, roughTokenEstimate, estimateCostUsd } from "../_shared/rateLimit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

const CATEGORIES = ["Sales", "Stock", "Rent", "Utilities", "Transport", "Wages", "Other"];
const METRICS = ["total_in", "total_out", "top_category", "transaction_count"] as const;
type Metric = (typeof METRICS)[number];

interface Intent {
  metric: Metric | null;
  category: string | null; // one of CATEGORIES, or null for "all categories"
  range: "this_week" | "this_month" | "all_time" | null;
}

const INTENT_SYSTEM_PROMPT = `You extract structured intent from a small business owner's question about their own transaction records. You never answer the question yourself and you never state or guess any number — you only identify what should be looked up.

Return STRICT JSON ONLY, no preamble, no markdown fences, with exactly these fields:
{
  "metric": one of ${JSON.stringify(METRICS)} or null if the question doesn't clearly ask for one of these,
  "category": one of ${JSON.stringify(CATEGORIES)} or null if no specific category is mentioned,
  "range": "this_week" | "this_month" | "all_time" or null if unclear
}

metric meanings:
- "total_in" = how much money came in / was earned / sold
- "total_out" = how much money was spent
- "top_category" = which category made the most money
- "transaction_count" = how many transactions/entries

If the question is not clearly about one of these four things, set "metric" to null — do not guess. Never include any field other than metric, category, range. Never include an answer, a number, or any explanation.`;

function resolveRange(range: Intent["range"]): { start: Date; end: Date; label: string } {
  const now = new Date();
  if (range === "this_month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1), label: "this month" };
  }
  if (range === "all_time") {
    return { start: new Date(0), end: new Date(now.getTime() + 86400000), label: "overall" };
  }
  // default / "this_week"
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);
  return { start, end, label: "this week" };
}

function formatRands(n: number): string {
  return "R" + Math.round(n).toLocaleString("en-ZA");
}

function couldNotUnderstand(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({
      text: "I couldn't quite understand that question — try asking it differently.",
      understood: false,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
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
    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limitCheck = await checkLimits(supabase, anonId);
    if (limitCheck.blocked) return limitExceededResponse(corsHeaders);

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: INTENT_SYSTEM_PROMPT },
          { role: "user", content: question },
        ],
        temperature: 0,
      }),
    });

    let estimatedTokens = 0;
    let estimatedCostUsd = 0;
    let intent: Intent | null = null;

    if (groqRes.ok) {
      const groqData = await groqRes.json();
      const usage = groqData.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
      const content = (groqData.choices?.[0]?.message?.content ?? "").trim();
      estimatedTokens = (usage?.prompt_tokens ?? roughTokenEstimate(INTENT_SYSTEM_PROMPT + question)) + (usage?.completion_tokens ?? roughTokenEstimate(content));
      estimatedCostUsd = estimateCostUsd(usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0);

      try {
        const fenceMatch = content.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
        const parsed = JSON.parse(fenceMatch ? fenceMatch[1] : content);
        intent = {
          metric: METRICS.includes(parsed.metric) ? parsed.metric : null,
          category: CATEGORIES.includes(parsed.category) ? parsed.category : null,
          range: ["this_week", "this_month", "all_time"].includes(parsed.range) ? parsed.range : null,
        };
      } catch {
        intent = null;
      }
    }

    await logRequest(supabase, { anonId, endpoint: "query-transactions", estimatedTokens: estimatedTokens || undefined, estimatedCostUsd: estimatedCostUsd || undefined });

    if (!intent || !intent.metric) {
      return couldNotUnderstand(corsHeaders);
    }

    const range = resolveRange(intent.range);

    const { data: rawRows, error } = await supabase
      .from("transactions")
      .select("amount, direction, category, needs_review")
      .gte("created_at", range.start.toISOString())
      .lt("created_at", range.end.toISOString());
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Needs-review rows excluded from every computed answer — same rule
    // as the summary endpoint, so the user only ever sees numbers they
    // can trust.
    let rows = (rawRows ?? []).filter((r) => !r.needs_review);
    if (intent.category) {
      rows = rows.filter((r) => r.category === intent.category);
    }

    const categoryLabel = intent.category ? ` on ${intent.category}` : "";

    switch (intent.metric) {
      case "total_in": {
        const total = rows.filter((r) => r.direction === "in").reduce((s, r) => s + (r.amount ?? 0), 0);
        return respond(corsHeaders, `You made ${formatRands(total)}${categoryLabel} ${range.label}.`, { metric: "total_in", value: total, range: range.label, category: intent.category });
      }
      case "total_out": {
        const total = rows.filter((r) => r.direction === "out").reduce((s, r) => s + (r.amount ?? 0), 0);
        return respond(corsHeaders, `You spent ${formatRands(total)}${categoryLabel} ${range.label}.`, { metric: "total_out", value: total, range: range.label, category: intent.category });
      }
      case "transaction_count": {
        return respond(corsHeaders, `You had ${rows.length} transaction${rows.length === 1 ? "" : "s"}${categoryLabel} ${range.label}.`, { metric: "transaction_count", value: rows.length, range: range.label, category: intent.category });
      }
      case "top_category": {
        const breakdown: Record<string, number> = {};
        for (const r of rows) {
          if (r.direction !== "in" || !r.category) continue;
          breakdown[r.category] = (breakdown[r.category] ?? 0) + (r.amount ?? 0);
        }
        const top = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0];
        if (!top) {
          return respond(corsHeaders, `No sales recorded ${range.label} yet.`, { metric: "top_category", value: null, range: range.label, category: null });
        }
        return respond(corsHeaders, `Your top category ${range.label} was ${top[0]}, at ${formatRands(top[1])}.`, { metric: "top_category", value: top[0], amount: top[1], range: range.label });
      }
    }

    // Unreachable given the METRICS/Metric exhaustiveness above, but keep
    // an explicit honest fallback rather than ever returning undefined.
    return couldNotUnderstand(corsHeaders);
  } catch (err) {
    await logRequest(supabase, { anonId, endpoint: "query-transactions" });
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function respond(corsHeaders: Record<string, string>, text: string, data: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ text, understood: true, ...data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
