// Deterministic rules layer (Part 3): checked before calling Groq so
// obvious repeated patterns skip the model call entirely. Conservative,
// simple matching only — exact or case-insensitive substring, never
// fuzzy/ML matching, per the task's explicit constraint.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export interface CategoryRule {
  id: string;
  pattern: string;
  category: string;
  direction: "in" | "out" | null;
}

export interface RuleMatch {
  category: string;
  direction: "in" | "out" | null;
  ruleId: string;
}

/**
 * Returns the first matching rule (case-insensitive substring match of
 * rule.pattern within raw_input), or null. A rule-based match is treated
 * as a previously-confirmed pattern, so callers should score it at high
 * confidence (0.95) rather than running it back through the normal
 * confidence-scoring logic.
 */
export async function findMatchingRule(supabase: SupabaseClient, rawInput: string): Promise<RuleMatch | null> {
  const { data, error } = await supabase.from("category_rules").select("id, pattern, category, direction");

  if (error || !data) {
    console.error("category_rules lookup failed (falling through to Groq):", error);
    return null;
  }

  const haystack = rawInput.toLowerCase();
  const match = (data as CategoryRule[]).find((rule) => haystack.includes(rule.pattern.toLowerCase()));

  if (!match) return null;

  return { category: match.category, direction: match.direction, ruleId: match.id };
}
