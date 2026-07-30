/**
 * Client-side anonymous identity — the same `anon_id` concept the backend
 * already expects (see supabase/functions/_shared/rateLimit.ts::getAnonId,
 * and the `anon_id` column added to `transactions` in
 * supabase/migrations/0002_backend_build_pass.sql). This app has no real
 * Supabase auth (AuthPage is a localStorage-only fake sign-in, so
 * auth.uid() is always null) — anon_id is the only per-"user" scoping
 * mechanism that exists anywhere in this app, tonight or otherwise.
 *
 * Before tonight, nothing on the client actually generated or sent this —
 * the edge function's `getAnonId()` silently fell back to the literal
 * string "unknown" for every request. This helper is the first real
 * client-side anon_id: a UUID persisted in localStorage, stable for this
 * browser/device, sent as the `x-vanta-anon-id` header on edge function
 * calls and used directly as the `anon_id` value on every new table this
 * build introduces (debts, business_profile, inventory_items, documents).
 *
 * Limitation: this is device/browser-scoped, not identity-scoped — clearing
 * localStorage or switching browsers starts a "new" anonymous business.
 * That matches the existing fake-auth reality of the app, not a regression.
 */
const ANON_ID_KEY = 'vanta_anon_id';

export function getAnonId(): string {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}
