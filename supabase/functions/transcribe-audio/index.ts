import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  checkLimits,
  getAnonId,
  limitExceededResponse,
  logRequest,
} from "../_shared/rateLimit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

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
    const incomingForm = await req.formData();
    const audioFile = incomingForm.get("audio");

    if (!(audioFile instanceof File) || audioFile.size === 0) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Same dry-run rate-limit check as parse-transaction — computed and
    // logged regardless of ENFORCE_RATE_LIMITS, only blocking when that
    // flag is true. Left exactly as-is (currently false) — not touched
    // by this feature.
    const limitCheck = await checkLimits(supabase, anonId);
    if (limitCheck.blocked) {
      return limitExceededResponse(corsHeaders);
    }

    const groqForm = new FormData();
    groqForm.append("file", audioFile, audioFile.name || "recording.webm");
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("response_format", "json");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: groqForm,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      await logRequest(supabase, { anonId, endpoint: "transcribe-audio" });
      return new Response(
        JSON.stringify({ error: "Couldn't hear that — try again or type it instead." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const groqData = await groqRes.json();
    const text = typeof groqData.text === "string" ? groqData.text.trim() : "";

    // Rough duration-based cost estimate for logging — Whisper's usage
    // response doesn't include token counts the way the chat model does.
    // audioFile.size is bytes, not seconds, so this is left unestimated
    // (0) rather than guessing a nonsensical figure from file size alone.
    await logRequest(supabase, {
      anonId,
      endpoint: "transcribe-audio",
      estimatedCostUsd: 0,
    });

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Couldn't hear that — try again or type it instead." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    await logRequest(supabase, { anonId, endpoint: "transcribe-audio" });
    return new Response(
      JSON.stringify({ error: "Couldn't hear that — try again or type it instead." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
