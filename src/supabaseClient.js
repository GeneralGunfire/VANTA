import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function parseTransaction(raw_input, source) {
  const { data, error } = await supabase.functions.invoke("parse-transaction", {
    body: { raw_input, source },
  });
  if (error) throw error;
  return data;
}
