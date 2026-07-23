// Persists a correction (Part 3/6) and, conservatively, may derive a new
// category_rules entry from it.
//
// NOT YET CALLED BY THE FRONTEND. The current edit/correction flow in the
// ledger (src/components/Ledger.tsx, LedgerRow.tsx, ReviewQueue.tsx) is
// entirely local-state + console.log + an in-memory-only stub
// (src/lib/correctionHistory.ts) — no network call happens today. This
// function exists so that persistence work is ready; wiring the frontend
// to call it is explicitly out of scope for this backend-only pass (see
// final report for the minimal hook-up that would be needed).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getAnonId, logRequest } from "../_shared/rateLimit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CATEGORIES = ["Sales", "Stock", "Rent", "Utilities", "Transport", "Wages", "Other"];

interface CorrectionRequest {
  transaction_id: string;
  field: "category" | "amount" | "direction" | "description";
  before_value: string;
  after_value: string;
  /** If true and field is "category", also create a category_rules entry from raw_input -> after_value. Conservative and opt-in — the caller decides, we don't auto-generalize every correction. */
  create_rule?: boolean;
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
    const body = (await req.json()) as CorrectionRequest;

    if (!body.transaction_id || !body.field) {
      return new Response(JSON.stringify({ error: "transaction_id and field are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: correction, error: correctionError } = await supabase
      .from("correction_history")
      .insert({
        transaction_id: body.transaction_id,
        anon_id: anonId,
        field: body.field,
        before_value: body.before_value ?? null,
        after_value: body.after_value ?? null,
      })
      .select()
      .single();

    if (correctionError) {
      return new Response(JSON.stringify({ error: correctionError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let ruleCreated = false;

    // Conservative: only ever derive a rule from a category correction,
    // only when the caller explicitly opts in, and only using the exact
    // original raw_input as the pattern — never a generalized fragment,
    // per the task's instruction not to over-generalize from one
    // correction.
    if (body.create_rule && body.field === "category" && CATEGORIES.includes(body.after_value)) {
      const { data: txn } = await supabase
        .from("transactions")
        .select("raw_input, direction")
        .eq("id", body.transaction_id)
        .single();

      if (txn?.raw_input) {
        const { error: ruleError } = await supabase.from("category_rules").insert({
          pattern: txn.raw_input,
          category: body.after_value,
          direction: txn.direction ?? null,
          source_correction_id: correction.id,
        });
        ruleCreated = !ruleError;
        if (ruleError) console.error("category_rules insert failed (non-fatal):", ruleError);
      }
    }

    await logRequest(supabase, { anonId, endpoint: "record-correction" });

    return new Response(JSON.stringify({ correction, rule_created: ruleCreated }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    await logRequest(supabase, { anonId, endpoint: "record-correction" });
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
