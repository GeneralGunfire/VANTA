import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  checkLimits,
  estimateCostUsd,
  getAnonId,
  limitExceededResponse,
  logRequest,
  roughTokenEstimate,
} from "../_shared/rateLimit.ts";
import { findMatchingRule } from "../_shared/categoryRules.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

const CATEGORIES = ["Sales", "Stock", "Rent", "Utilities", "Transport", "Wages", "Other"];
const RULE_MATCH_CONFIDENCE = 0.95;

const TRANSACTION_SHAPE = `{
  "amount": number,
  "direction": "in" | "out",
  "category": one of ${JSON.stringify(CATEGORIES)},
  "description": string (short, plain English),
  "confidence": number between 0 and 1
}`;

const SYSTEM_PROMPT = `You are a bookkeeping assistant for small, informal South African businesses. You will be given a short piece of raw text describing one or more business transactions (this may be free-text typed by the user, or a row extracted from a spreadsheet).

First decide: does the input describe a SINGLE transaction, or MULTIPLE distinct transactions (e.g. a list or paragraph covering several separate sales/expenses, such as a whole day's or week's worth pasted at once)?

- If it is a SINGLE transaction, return STRICT JSON ONLY: a single JSON object with exactly these fields:
${TRANSACTION_SHAPE}

- If it is MULTIPLE distinct transactions, return STRICT JSON ONLY: a JSON array of objects, each with exactly the same fields:
[${TRANSACTION_SHAPE}, ...]

No preamble, no explanation, no markdown code fences, in either case. Never mix the two shapes — one object for one transaction, an array only when there are genuinely multiple distinct transactions.

Rules (apply to every individual transaction object, whether standalone or inside an array):
- "in" means money received (e.g. a sale). "out" means money spent (e.g. buying stock, paying rent).
- category must be exactly one of the listed values. Use "Other" if nothing fits.
- If an individual transaction is ambiguous, incomplete, or doesn't clearly look like a transaction, still return your best guess for every field, but set confidence low (at or below 0.2). Do not invent a plausible-sounding amount, direction, or category just because the fields require a value — a low-confidence best guess is expected and correct for this case.
- Base confidence strictly on these three checkable criteria, not on overall impression, and score each transaction independently — some entries in a multi-transaction input may be clear while others are ambiguous:
  (a) Is there a clear, explicit monetary amount in the input?
  (b) Is the direction of money flow (received vs. spent) unambiguous?
  (c) Is this plausibly a business transaction at all (an exchange of money for goods, services, rent, wages, transport, etc.), as opposed to unrelated data such as a log entry, timestamp record, name list, or system message?
  If any of (a), (b), or (c) is not clearly satisfied for that transaction, its confidence must be at or below 0.2. Only score a transaction above 0.7 when all three are clearly satisfied for it.
- Examples of LOW confidence (at or below 0.2) input — no clear amount, no business context, or both:
  - "User Name: Mila Murphy, Log in: 08:02, Log out: 17:41" (a login/logout log, no amount, no transaction)
  - "System backup completed at 02:00, status: OK" (system message, no amount, no business context)
  - "Jane, Peter, Sam — attendance list for Monday" (a name list, no amount, no transaction)
- Examples of HIGH confidence (above 0.7) input — explicit amount, clear direction, clear business context:
  - "Sold 3 bags of maize meal for R450 cash" (clear amount, clear "in", clear Sales context)
  - "Paid R1200 rent for the shop this month" (clear amount, clear "out", clear Rent context)
- Example of MULTIPLE transactions in one input, returned as an array:
  - "Sold bread R400 cash. Bought flour R180. Paid taxi R60." → three objects, one per sentence, each scored independently.
- Never return anything except the JSON object or JSON array.`;

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const anonId = getAnonId(req);

  try {
    const { raw_input, source } = await req.json();

    if (!raw_input || typeof raw_input !== "string") {
      return new Response(JSON.stringify({ error: "raw_input is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (source !== "text" && source !== "excel") {
      return new Response(JSON.stringify({ error: "source must be 'text' or 'excel'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Part 2: rate-limit check runs (and is logged/observable) regardless
    // of ENFORCE_RATE_LIMITS — only actual blocking is gated by the flag.
    const limitCheck = await checkLimits(supabase, anonId);
    if (limitCheck.blocked) {
      return limitExceededResponse(corsHeaders);
    }

    // Part 3: deterministic rules layer — check for a confident pattern
    // match before spending a Groq call. A match short-circuits parsing
    // entirely for this input.
    const ruleMatch = await findMatchingRule(supabase, raw_input);

    let rowsToInsert: Array<{
      raw_input: string;
      source: string;
      amount: number | null;
      direction: string | null;
      category: string;
      description: string | null;
      confidence: number;
      needs_review: boolean;
      anon_id: string;
    }>;

    let estimatedTokens = 0;
    let estimatedCostUsd = 0;

    if (ruleMatch) {
      rowsToInsert = [
        {
          raw_input,
          source,
          amount: null, // rules only ever confirm category/direction, never guess an amount
          direction: ruleMatch.direction,
          category: ruleMatch.category,
          description: raw_input,
          confidence: RULE_MATCH_CONFIDENCE,
          needs_review: RULE_MATCH_CONFIDENCE < 0.7,
          anon_id: anonId,
        },
      ];
    } else {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: raw_input },
          ],
          temperature: 0.2,
        }),
      });

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        await logRequest(supabase, { anonId, endpoint: "parse-transaction" });
        return new Response(JSON.stringify({ error: `Groq API error: ${errText}` }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const groqData = await groqRes.json();
      const content = groqData.choices?.[0]?.message?.content ?? "";

      // Prefer Groq's own reported usage when available; fall back to a
      // rough character-based estimate otherwise.
      const usage = groqData.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
      const inputTokens = usage?.prompt_tokens ?? roughTokenEstimate(SYSTEM_PROMPT + raw_input);
      const outputTokens = usage?.completion_tokens ?? roughTokenEstimate(content);
      estimatedTokens = inputTokens + outputTokens;
      estimatedCostUsd = estimateCostUsd(inputTokens, outputTokens);

      interface RawParsedTransaction {
        amount: number | null;
        direction: string | null;
        category: string | null;
        description: string | null;
        confidence: number;
      }

      // The model returns either a single transaction object or a JSON
      // array of them, depending on whether the input described one or
      // several distinct transactions. Normalize to an array either way.
      let rawEntries: RawParsedTransaction[];

      try {
        const json = JSON.parse(stripCodeFences(content));
        rawEntries = Array.isArray(json) ? json : [json];
        if (rawEntries.length === 0) throw new Error("empty array");
      } catch {
        // Single fallback row for the whole input — never guess at
        // splitting a bulk input ourselves when the model didn't return
        // usable JSON.
        rawEntries = [
          {
            amount: null,
            direction: null,
            category: "Other",
            description: "Could not parse model output",
            confidence: 0,
          },
        ];
      }

      rowsToInsert = rawEntries.map((parsed) => {
        const amount = typeof parsed.amount === "number" ? parsed.amount : null;
        const direction = parsed.direction === "in" || parsed.direction === "out" ? parsed.direction : null;
        const category = CATEGORIES.includes(parsed.category ?? "") ? parsed.category : "Other";
        const description = typeof parsed.description === "string" ? parsed.description : null;
        const confidence = typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0;
        const needs_review = confidence < 0.7;

        return {
          // Full original raw input preserved on every row, even for a
          // bulk submission that produced multiple rows, so the audit
          // trail always shows exactly what was sent.
          raw_input,
          source,
          amount,
          direction,
          category,
          description,
          confidence,
          needs_review,
          anon_id: anonId,
        };
      });
    }

    const { data, error } = await supabase.from("transactions").insert(rowsToInsert).select();

    // Part 2: log this request regardless of outcome (success, DB error,
    // rule match, or Groq call) — logging must not depend on success.
    await logRequest(supabase, {
      anonId,
      endpoint: "parse-transaction",
      estimatedTokens: estimatedTokens || undefined,
      estimatedCostUsd: estimatedCostUsd || undefined,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // `transactions` is always an array, even for the single-transaction
    // case, so a caller that wants to handle bulk results has one uniform
    // shape to work with. The current frontend (src/lib/supabaseClient.ts)
    // predates this change and still expects a single row directly at the
    // top level of the response — spreading the first row in keeps that
    // existing call site working unmodified for single-transaction input
    // (still its only real-world case today) without this backend-only
    // pass touching frontend code. A caller that wants multi-transaction
    // support should read `transactions` instead. See final report.
    const firstRow = Array.isArray(data) ? data[0] : undefined;
    return new Response(JSON.stringify({ ...firstRow, transactions: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    await logRequest(supabase, { anonId, endpoint: "parse-transaction" });
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
