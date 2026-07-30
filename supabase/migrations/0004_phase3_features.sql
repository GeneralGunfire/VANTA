-- Vanta Round 2 feature build — consolidated schema for Cashflow
-- Forecasting (no new tables — computed client-side from existing
-- transactions/debts), Invoicing, and the Business Record page (no new
-- tables — computed from existing transactions/debts).
-- Run this manually in the Supabase SQL editor. NOT applied automatically
-- and NOT executed against any live database by the agent that wrote it.
--
-- Scoping convention: same as 0003_phase2_features.sql — this app has no
-- real Supabase auth, so every table is scoped by a client-generated
-- `anon_id text` column with an `using (true)` RLS policy, matching the
-- existing `transactions`/`debts`/`inventory_items`/`documents` tables.

-- ════════════════════════════════════════════════════════════════════
-- Part 2: Invoicing / Quote Generation
-- ════════════════════════════════════════════════════════════════════
-- line_items is stored as jsonb rather than a separate child table —
-- invoices tonight are simple, small (a handful of lines), never edited
-- line-by-line after creation via a relational UI, and always read/written
-- as a whole document. A normalized child table would add a join for no
-- real benefit at this scale; jsonb keeps the whole invoice document
-- atomic, matching how it's actually used (created once, viewed as a
-- whole, status changed as a whole).
create table invoices (
  id uuid primary key default gen_random_uuid(),
  anon_id text not null,
  recipient_name text not null,
  line_items jsonb not null, -- [{ description, quantity, unit_price, line_total }]
  total numeric not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  created_at timestamptz default now(),
  due_date date
);

create index invoices_anon_id_idx on invoices (anon_id);

alter table invoices enable row level security;

create policy "Allow anon read/write on invoices" on invoices
  for all using (true) with check (true);
