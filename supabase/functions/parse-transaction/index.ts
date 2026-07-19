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
- If the input is ambiguous, incomplete, or doesn't clearly look like a transaction, still return your best guess for every field, but set confidence low (below 0.5).
- confidence should reflect how certain you are about the amount, direction, and category together.
- Never return anything except the JSON object.`;

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { raw_input, source } = await req.json();

    if (!raw_input || typeof raw_input !== "string") {
      return new Response(JSON.stringify({ error: "raw_input is required" }), { status: 400 });
    }
    if (source !== "text" && source !== "excel") {
      return new Response(JSON.stringify({ error: "source must be 'text' or 'excel'" }), { status: 400 });
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
      return new Response(JSON.stringify({ error: `Groq API error: ${errText}` }), { status: 502 });
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
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
