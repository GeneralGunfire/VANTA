import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

const CATEGORIES = ["Sales", "Stock", "Rent", "Utilities", "Transport", "Wages", "Other"];

const SYSTEM_PROMPT = `You are a bookkeeping assistant for small, informal South African businesses. You will be given a short piece of raw text describing a business transaction (this may be free-text typed by the user, or a row extracted from a spreadsheet).

Return STRICT JSON ONLY. No preamble, no explanation, no markdown code fences. Just a single JSON object with exactly these fields:

{
  "amount": number,
  "direction": "in" | "out",
  "category": one of ${JSON.stringify(CATEGORIES)},
  "description": string (short, plain English),
  "confidence": number between 0 and 1
}

Rules:
- "in" means money received (e.g. a sale). "out" means money spent (e.g. buying stock, paying rent).
- category must be exactly one of the listed values. Use "Other" if nothing fits.
- If the input is ambiguous, incomplete, or doesn't clearly look like a transaction, still return your best guess for every field, but set confidence low (at or below 0.2). Do not invent a plausible-sounding amount, direction, or category just because the fields require a value — a low-confidence best guess is expected and correct for this case.
- Base confidence strictly on these three checkable criteria, not on overall impression:
  (a) Is there a clear, explicit monetary amount in the input?
  (b) Is the direction of money flow (received vs. spent) unambiguous?
  (c) Is this plausibly a business transaction at all (an exchange of money for goods, services, rent, wages, transport, etc.), as opposed to unrelated data such as a log entry, timestamp record, name list, or system message?
  If any of (a), (b), or (c) is not clearly satisfied, confidence must be at or below 0.2. Only score above 0.7 when all three are clearly satisfied.
- Examples of LOW confidence (at or below 0.2) input — no clear amount, no business context, or both:
  - "User Name: Mila Murphy, Log in: 08:02, Log out: 17:41" (a login/logout log, no amount, no transaction)
  - "System backup completed at 02:00, status: OK" (system message, no amount, no business context)
  - "Jane, Peter, Sam — attendance list for Monday" (a name list, no amount, no transaction)
- Examples of HIGH confidence (above 0.7) input — explicit amount, clear direction, clear business context:
  - "Sold 3 bags of maize meal for R450 cash" (clear amount, clear "in", clear Sales context)
  - "Paid R1200 rent for the shop this month" (clear amount, clear "out", clear Rent context)
- Never return anything except the JSON object.`;

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
      return new Response(JSON.stringify({ error: `Groq API error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqData = await groqRes.json();
    const content = groqData.choices?.[0]?.message?.content ?? "";

    let parsed: {
      amount: number | null;
      direction: string | null;
      category: string | null;
      description: string | null;
      confidence: number;
    };

    try {
      parsed = JSON.parse(stripCodeFences(content));
    } catch {
      parsed = {
        amount: null,
        direction: null,
        category: "Other",
        description: "Could not parse model output",
        confidence: 0,
      };
    }

    const amount = typeof parsed.amount === "number" ? parsed.amount : null;
    const direction = parsed.direction === "in" || parsed.direction === "out" ? parsed.direction : null;
    const category = CATEGORIES.includes(parsed.category ?? "") ? parsed.category : "Other";
    const description = typeof parsed.description === "string" ? parsed.description : null;
    const confidence = typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0;
    const needs_review = confidence < 0.7;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        raw_input,
        source,
        amount,
        direction,
        category,
        description,
        confidence,
        needs_review,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
