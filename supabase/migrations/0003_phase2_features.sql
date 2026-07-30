-- Phase 2 features — Debtors & Creditors, Tax Calendar profile fields,
-- Inventory, Document Vault. Run manually in the Supabase SQL editor.
-- Not applied automatically — no migration/execute_sql/apply_migration
-- MCP tool was run against any live database while authoring this file.
--
-- KNOWN GAP (documented, not silently papered over): every table below
-- uses `user_id uuid references auth.users(id)` with RLS policies of the
-- form `using (auth.uid() = user_id)`, per the master spec's data-scoping
-- decision. This app currently has NO real Supabase auth — AuthPage.tsx
-- is a fake localStorage-only flow, and `auth.uid()` is always null at
-- runtime. That means once RLS is enabled on these tables, they will be
-- UNREADABLE/UNWRITABLE by the current frontend (every query will return
-- zero rows via RLS, not an error) until real Supabase auth is wired up.
-- This is intentional: the schema is written correctly and future-proofed
-- for when real auth lands, rather than weakened to `using (true)` to
-- make it superficially "work" today. Frontend hooks built against these
-- tables are written as normal authenticated queries and will simply flow
-- through the existing loading/empty-state ladder in the meantime.

-- ── Part 0: profiles + baseline RLS ──────────────────────────────────
-- Carried forward from the legacy migration at the outer repo root
-- (supabase/migrations/001_auth_and_profiles.sql, NOT part of the active
-- app/supabase/migrations sequence). Restated here because the active
-- sequence never created this table, and every other new table's
-- FK/RLS pattern in this file follows the same auth.users-based shape.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text,
  business_type text,
  -- Part 2 additions — see "Part 2" section below for reasoning.
  registration_status text check (registration_status in ('informal', 'registered_vat', 'not_yet_registered')),
  vat_registration_date date,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);


-- ── Part 1: Debtors & Creditors ──────────────────────────────────────
create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  party_name text,
  direction text check (direction in ('owed_to_business', 'owed_by_business')),
  amount numeric,
  description text,
  status text check (status in ('outstanding', 'settled')) default 'outstanding',
  created_at timestamptz default now(),
  settled_at timestamptz,
  transaction_id uuid references transactions(id)
);

alter table debts enable row level security;

create policy "Users can select own debts" on debts
  for select using (auth.uid() = user_id);

create policy "Users can insert own debts" on debts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own debts" on debts
  for update using (auth.uid() = user_id);

create policy "Users can delete own debts" on debts
  for delete using (auth.uid() = user_id);

create index if not exists debts_user_id_idx on debts (user_id);
create index if not exists debts_status_idx on debts (status);


-- ── Part 2: Tax Calendar business profile fields ─────────────────────
-- registration_status / vat_registration_date columns are declared above
-- on `profiles` (kept in one table rather than a separate one — see
-- final report for reasoning). No further schema needed for Part 2; the
-- Tax Calendar page itself is a static compliance-date list, not backed
-- by new tables.


-- ── Part 3: Inventory ─────────────────────────────────────────────────
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  item_name text not null,
  quantity numeric not null default 0,
  cost_price numeric,
  sale_price numeric,
  reorder_threshold numeric,
  updated_at timestamptz default now()
);

alter table inventory_items enable row level security;

create policy "Users can select own inventory" on inventory_items
  for select using (auth.uid() = user_id);

create policy "Users can insert own inventory" on inventory_items
  for insert with check (auth.uid() = user_id);

create policy "Users can update own inventory" on inventory_items
  for update using (auth.uid() = user_id);

create policy "Users can delete own inventory" on inventory_items
  for delete using (auth.uid() = user_id);

create index if not exists inventory_items_user_id_idx on inventory_items (user_id);


-- ── Part 4: Document Vault — storage bucket + metadata table ─────────
-- CAVEAT (documented, do not assume this alone is sufficient): creating a
-- Storage bucket via a raw `insert into storage.buckets` in a SQL
-- migration is not always reliable — Supabase Storage buckets are also
-- commonly created via the Dashboard or the Supabase CLI (`supabase
-- storage`), and storage RLS depends on policies attached to
-- `storage.objects` (a system table with its own quirks), not just the
-- bucket row existing. The user should verify/create the `documents`
-- bucket via the Supabase Dashboard (Storage tab) or CLI tomorrow and
-- confirm these policies actually apply before relying on this.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Path convention: objects are stored as `{user_id}/{filename}`, so
-- storage.foldername(name))[1] (the first path segment) is the owning
-- user's id, matched against auth.uid().
create policy "Users can read own documents"
  on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload own documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Metadata table — chosen over relying solely on Storage's own listing
-- API because it lets the Documents page show a label, a stable created
-- record, and cheap deletion bookkeeping without extra Storage calls.
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  file_path text not null,
  filename text not null,
  label text,
  uploaded_at timestamptz default now()
);

alter table documents enable row level security;

create policy "Users can select own documents" on documents
  for select using (auth.uid() = user_id);

create policy "Users can insert own documents" on documents
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own documents" on documents
  for delete using (auth.uid() = user_id);

create index if not exists documents_user_id_idx on documents (user_id);
