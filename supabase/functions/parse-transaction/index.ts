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
  "confidence": number between 0 and 1,
  "is_debt": boolean,
  "party_name": string or null,
  "debt_direction": "owed_to_business" | "owed_by_business" | null,
  "is_invoice_request": boolean,
  "invoice_recipient": string or null,
  "invoice_line_items": [{ "description": string, "quantity": number, "unit_price": number }] or null,
  "supplier_name": string or null
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

Debt detection (applies in addition to the normal transaction fields above):
- Every transaction object must also include "is_debt", "party_name", and "debt_direction".
- Set "is_debt": true ONLY when the input explicitly describes an amount owed by or to a named person/party — language like "owes me", "I owe", "on credit", "still owes", "IOU". Otherwise set "is_debt": false and leave "party_name"/"debt_direction" as null.
- When is_debt is true:
  - "party_name": the person or business name involved (e.g. "Thabo"). If no name is given, set is_debt back to false — a debt without an identifiable party is not usable.
  - "debt_direction": "owed_to_business" when someone else owes the business money (e.g. "Thabo owes me R200 for bread" — Thabo owes the business). "owed_by_business" when the business owes someone else (e.g. "I owe Sipho R500" — the business owes Sipho).
- Examples:
  - "Thabo owes me R200 for bread" → is_debt: true, party_name: "Thabo", debt_direction: "owed_to_business".
  - "I owe Sipho R500" → is_debt: true, party_name: "Sipho", debt_direction: "owed_by_business".
  - "Sold bread R400 cash" → is_debt: false, party_name: null, debt_direction: null (a normal cash sale, no debt).

Invoice-request detection (applies in addition to the fields above, and is mutually exclusive with a normal transaction — an invoice request describes work/goods to be billed, not money that has already moved):
- Every transaction object must also include "is_invoice_request", "invoice_recipient", and "invoice_line_items".
- Set "is_invoice_request": true ONLY when the input explicitly asks to invoice, bill, or quote someone for specific work/goods — language like "invoice X for...", "bill X for...", "send X a quote for...". This is a request to CREATE A DOCUMENT, not a record of money received or spent — do not also treat it as a normal transaction or a debt. When is_invoice_request is true, set amount to null, direction to null, is_debt to false, party_name to null, debt_direction to null — the invoice fields below carry all the real information instead.
- When is_invoice_request is true:
  - "invoice_recipient": the person or business being invoiced (e.g. "Sipho"). If no recipient is named, set is_invoice_request back to false — an invoice without a recipient is not usable.
  - "invoice_line_items": an array of { description, quantity, unit_price }, one per distinct item/service mentioned. Extract quantity and unit price directly from the input; if only a total is given with no breakdown, use a single line item with quantity 1 and unit_price equal to the total. If neither quantity, unit price, nor total can be determined for a line item, set is_invoice_request back to false — an invoice needs at least one priced line item.
- Examples:
  - "invoice Sipho for 3 deliveries at R150 each" → is_invoice_request: true, invoice_recipient: "Sipho", invoice_line_items: [{ description: "deliveries", quantity: 3, unit_price: 150 }].
  - "bill Thandi R800 for the catering" → is_invoice_request: true, invoice_recipient: "Thandi", invoice_line_items: [{ description: "catering", quantity: 1, unit_price: 800 }].
  - "Sold bread R400 cash" → is_invoice_request: false, invoice_recipient: null, invoice_line_items: null (money already received, not an invoice request).

Supplier detection (applies only to "out" transactions — money spent buying goods/stock/services from someone):
- Set "supplier_name" to the name of the person or business the money was paid TO, ONLY when it is explicitly and unambiguously named in the input — e.g. "bought flour from Sipho's Wholesale, R300" → supplier_name: "Sipho's Wholesale". If no supplier is named, or the input only describes what was bought without saying who from (e.g. "bought flour R180"), set supplier_name to null — do not guess or infer a supplier name from the item description alone.
- This field is independent of is_debt/is_invoice_request — a transaction can have a supplier_name and also be a normal, fully-confirmed "out" transaction at the same time.
- Examples:
  - "bought flour from Sipho's Wholesale, R300" → supplier_name: "Sipho's Wholesale".
  - "paid Thabo's Hardware R450 for tools" → supplier_name: "Thabo's Hardware".
  - "bought flour R180" → supplier_name: null (no supplier named).
  - "paid rent R1200" → supplier_name: null (a landlord isn't a goods/stock supplier in the sense this field means, and none is named anyway).
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
      supplier_name: string | null;
    }>;

    // Part 1: debt-detection metadata, parallel array to rowsToInsert
    // (same index), populated only for the LLM-parsed path — the
    // deterministic rules-layer match below never produces a debt (rules
    // only confirm category/direction, never party names).
    let debtRequests: Array<{
      party_name: string;
      direction: "owed_to_business" | "owed_by_business";
      amount: number;
      description: string | null;
    }> = [];

    // Round 2 Part 2: invoice-request entries detected in this input,
    // fully separate from rowsToInsert/debtRequests — see the filtering
    // logic below where rawEntries is split into invoice vs. non-invoice.
    let invoiceRequests: Array<{ recipient: string; lineItems: { description: string; quantity: number; unit_price: number }[] }> = [];

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
          supplier_name: null, // rules only ever confirm category/direction, never extract a supplier name
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
        is_debt?: boolean;
        party_name?: string | null;
        debt_direction?: string | null;
        is_invoice_request?: boolean;
        invoice_recipient?: string | null;
        invoice_line_items?: Array<{ description: string; quantity: number; unit_price: number }> | null;
        supplier_name?: string | null;
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

      // Invoice-request entries are extracted here and never enter
      // rowsToInsert at all — an invoice request describes work to be
      // billed, not money that has already moved, so it must not also
      // create a transactions row (that would double up as both an
      // invoice and a phantom sale). Validated the same way debt entries
      // are: the model's is_invoice_request flag is only trusted once a
      // recipient and at least one priced line item are both present.
      //
      // Bug found during the test/verification pass: this validation used
      // to run separately from the nonInvoiceEntries filter below, which
      // filtered on the model's RAW is_invoice_request flag instead of the
      // validated result. An entry where the model set is_invoice_request
      // true but gave no usable line items (e.g. "invoice Thabo for the
      // bread he still owes me for" — no price) was correctly rejected as
      // an invoice here, but ALSO excluded from nonInvoiceEntries by the
      // raw-flag filter, so it fell into neither table — silently
      // vanished, no transaction, no invoice, no debt, no error. Fixed by
      // computing the validated invoice flag once per entry and using that
      // same value for both decisions below.
      const validateInvoice = (parsed: RawParsedTransaction) => {
        const recipient =
          typeof parsed.invoice_recipient === "string" && parsed.invoice_recipient.trim()
            ? parsed.invoice_recipient.trim()
            : null;
        const rawItems = Array.isArray(parsed.invoice_line_items) ? parsed.invoice_line_items : [];
        const lineItems = rawItems
          .filter(
            (li) =>
              li &&
              typeof li.description === "string" &&
              li.description.trim() &&
              typeof li.quantity === "number" &&
              li.quantity > 0 &&
              typeof li.unit_price === "number" &&
              li.unit_price >= 0,
          )
          .map((li) => ({ description: li.description.trim(), quantity: li.quantity, unit_price: li.unit_price }));

        const isInvoice = Boolean(parsed.is_invoice_request) && recipient !== null && lineItems.length > 0;
        return isInvoice ? { recipient: recipient!, lineItems } : null;
      };

      const invoiceValidations = rawEntries.map(validateInvoice);

      invoiceRequests = invoiceValidations.filter(
        (x): x is { recipient: string; lineItems: { description: string; quantity: number; unit_price: number }[] } => x !== null,
      );

      const nonInvoiceEntries = rawEntries.filter((_, i) => invoiceValidations[i] === null);

      // Fixed during the test/verification pass: a debt statement like
      // "Thabo owes me R200 for bread" was previously ALSO inserted as a
      // normal transactions row (an "in" sale), which is wrong — the money
      // has not actually moved yet, only a debt exists. Debt entries are
      // now excluded from rowsToInsert entirely, the same way invoice
      // entries already were, so a pure debt statement creates only a
      // `debts` row and nothing in the ledger.
      const isPureDebtEntry = (parsed: RawParsedTransaction) => {
        const debt_direction =
          parsed.debt_direction === "owed_to_business" || parsed.debt_direction === "owed_by_business"
            ? parsed.debt_direction
            : null;
        const party_name = typeof parsed.party_name === "string" && parsed.party_name.trim() ? parsed.party_name.trim() : null;
        return Boolean(parsed.is_debt) && party_name !== null && debt_direction !== null;
      };

      const ledgerEntries = nonInvoiceEntries.filter((parsed) => !isPureDebtEntry(parsed));

      rowsToInsert = ledgerEntries.map((parsed) => {
        // Found during live Excel-upload testing: input rows with a
        // negative number in an "amount" column (e.g. "-180" for an
        // expense) caused the model to echo that sign straight into
        // amount while ALSO correctly setting direction: "out" — a
        // spreadsheet convention (negative = expense) leaking into a
        // field that every downstream sum (forecast, business record,
        // generate-summary) treats as an unsigned magnitude, with sign
        // carried entirely by direction. A negative "out" amount silently
        // flips its contribution to those sums. Normalized to a magnitude
        // here, once, at the single point every insert path goes through.
        const amount = typeof parsed.amount === "number" ? Math.abs(parsed.amount) : null;
        const direction = parsed.direction === "in" || parsed.direction === "out" ? parsed.direction : null;
        const category = CATEGORIES.includes(parsed.category ?? "") ? parsed.category : "Other";
        const description = typeof parsed.description === "string" ? parsed.description : null;
        const confidence = typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0;
        const needs_review = confidence < 0.7;

        // Supplier Tracking: only meaningful for "out" transactions and
        // only trusted when the model explicitly named someone — never
        // inferred from the item description alone (see prompt rules
        // above). Applied regardless of direction here since the model
        // is already instructed to only ever set it for "out" transactions;
        // this is just a defensive belt-and-braces guard against a model
        // slip, not a second source of truth.
        const supplier_name =
          direction === "out" && typeof parsed.supplier_name === "string" && parsed.supplier_name.trim()
            ? parsed.supplier_name.trim()
            : null;

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
          supplier_name,
        };
      });

      // debtRequests is built from the full nonInvoiceEntries list (not
      // ledgerEntries) — debt rows are inserted separately below and never
      // touch rowsToInsert/data, so there is no index alignment to worry
      // about between the two inserts.
      // This is inherently fuzzy NL classification — it relies entirely
      // on the LLM correctly recognizing "owes"/"I owe" language, will
      // likely miss indirect phrasing, does not dedup or match against
      // existing debtor names, and has no concept of partial payments.
      // See final report for full limitations.
      // debts.amount is NOT NULL — a debt statement with no extractable
      // amount ("Thabo owes me for the bread") is not usable as a debt
      // row and is silently dropped (not inserted anywhere) rather than
      // failing the whole request or inserting a 0 that would misstate
      // what's owed.
      debtRequests = nonInvoiceEntries
        .filter(isPureDebtEntry)
        .filter((parsed) => typeof parsed.amount === "number")
        .map((parsed) => ({
          party_name: (parsed.party_name as string).trim(),
          direction: parsed.debt_direction as "owed_to_business" | "owed_by_business",
          // Same normalization as the transactions amount above — a debt
          // owed is a magnitude, direction (already a separate field)
          // carries the sign of who owes whom, never the amount itself.
          amount: Math.abs(parsed.amount as number),
          description: typeof parsed.description === "string" ? parsed.description : null,
        }));
    }

    // rowsToInsert can be empty when the whole input was one or more
    // invoice requests and nothing else (e.g. "invoice Sipho for 3
    // deliveries at R150 each" on its own) — skip the transactions insert
    // entirely in that case rather than sending an empty insert.
    const { data, error } = rowsToInsert.length > 0
      ? await supabase.from("transactions").insert(rowsToInsert).select()
      : { data: [] as any[], error: null };

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

    // Fixed during the test/verification pass: debt entries are detected
    // independently now (see isPureDebtEntry above) and never appear in
    // rowsToInsert/data at all — a pure debt statement no longer also
    // creates a phantom transactions row. transaction_id is left null
    // here since there is no corresponding transaction. Best-effort — a
    // failure here does not fail the overall request; it's logged and
    // swallowed so debt detection never blocks normal ledger entry.
    if (debtRequests.length > 0) {
      const debtRows = debtRequests.map((req) => ({
        anon_id: anonId,
        party_name: req.party_name,
        direction: req.direction,
        amount: req.amount,
        description: req.description,
        status: "outstanding",
        transaction_id: null,
      }));

      const { error: debtError } = await supabase.from("debts").insert(debtRows);
      if (debtError) {
        console.error("Failed to insert debt row(s):", debtError.message);
      }
    }

    // Round 2 Part 2: insert any detected invoice requests as draft
    // invoices. Each line item's line total is computed here in code
    // (quantity * unit_price), never asked of the model — the model only
    // ever supplies quantity and unit_price per item. Best-effort, same
    // as debt insertion above: a failure here does not fail the overall
    // request.
    const createdInvoices: any[] = [];
    if (invoiceRequests.length > 0) {
      const invoiceRows = invoiceRequests.map(({ recipient, lineItems }) => {
        const itemsWithTotals = lineItems.map((li) => ({ ...li, line_total: li.quantity * li.unit_price }));
        const total = itemsWithTotals.reduce((sum, li) => sum + li.line_total, 0);
        return {
          anon_id: anonId,
          recipient_name: recipient,
          line_items: itemsWithTotals,
          total,
          status: "draft",
        };
      });

      const { data: invoiceData, error: invoiceError } = await supabase.from("invoices").insert(invoiceRows).select();
      if (invoiceError) {
        console.error("Failed to insert invoice row(s):", invoiceError.message);
      } else if (invoiceData) {
        createdInvoices.push(...invoiceData);
      }
    }

    // `transactions` is always an array, even for the single-transaction
    // case, so a caller that wants to handle bulk results has one uniform
    // shape to work with. The current frontend (src/lib/supabaseClient.ts)
    // predates this change and still expects a single row directly at the
    // top level of the response — spreading the first row in keeps that
    // existing call site working unmodified for single-transaction input
    // (still its only real-world case today) without this backend-only
    // pass touching frontend code. A caller that wants multi-transaction
    // support should read `transactions` instead. `invoices` is new in
    // Round 2 Part 2 and is always an array (possibly empty) of any
    // draft invoices created from this input.
    const firstRow = Array.isArray(data) ? data[0] : undefined;
    return new Response(JSON.stringify({ ...firstRow, transactions: data, invoices: createdInvoices }), {
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
