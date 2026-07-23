-- Vanta backend build pass — consolidated schema changes.
-- Run this manually in the Supabase SQL editor. Not applied automatically.
--
-- Covers:
--   Part 2 — request_log (rate limiting / cost tracking infrastructure)
--   Part 3 — correction_history + category_rules (deterministic rules layer)
--   Part 6 — anon_id column on transactions (audit trail traceability)

-- ── Part 2: request_log ──────────────────────────────────────────────
-- Logs every parse-transaction (and future endpoint) call, unconditionally,
-- regardless of outcome. Used to measure real usage before any enforcement
-- is turned on (see ENFORCE_RATE_LIMITS in parse-transaction/index.ts).
create table request_log (
  id uuid primary key default gen_random_uuid(),
  anon_id text not null,
  endpoint text not null,
  estimated_tokens integer,
  estimated_cost_usd numeric,
  created_at timestamptz default now()
);

create index request_log_anon_id_created_at_idx on request_log (anon_id, created_at);
create index request_log_endpoint_idx on request_log (endpoint);

alter table request_log enable row level security;

-- Edge Functions write via the service-role key (bypasses RLS). No anon
-- policy is added here — this table is not meant to be client-readable.

-- ── Part 3/6 support: correction_history ─────────────────────────────
-- Real persisted correction log. The frontend's correction-history feature
-- is currently an in-memory-only stub (src/lib/correctionHistory.ts) — no
-- persisted table existed before this pass. Created here because
-- category_rules.source_correction_id references it, and because Part 6
-- asks for edits to be traceable. Wiring the frontend to write here
-- instead of the in-memory stub is NOT done in this pass (frontend
-- changes are out of scope) — see final report for what minimal hook-up
-- would be needed.
create table correction_history (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  anon_id text,
  field text,
  before_value text,
  after_value text,
  created_at timestamptz default now()
);

alter table correction_history enable row level security;

-- ── Part 3: category_rules ───────────────────────────────────────────
-- Deterministic pattern -> category/direction shortcuts, checked before
-- calling Groq. Populated manually and/or from user corrections.
create table category_rules (
  id uuid primary key default gen_random_uuid(),
  pattern text not null,
  category text not null check (category in ('Sales', 'Stock', 'Rent', 'Utilities', 'Transport', 'Wages', 'Other')),
  direction text check (direction in ('in', 'out')),
  source_correction_id uuid references correction_history(id) on delete set null,
  created_at timestamptz default now()
);

create index category_rules_pattern_idx on category_rules (lower(pattern));

alter table category_rules enable row level security;

-- ── Part 6: anon_id traceability on transactions ─────────────────────
-- Nullable, additive column so existing rows and existing insert code
-- paths are unaffected. New inserts from parse-transaction populate it
-- when the client sends an anon id (see Part 2).
alter table transactions add column anon_id text;

create index transactions_anon_id_idx on transactions (anon_id);
