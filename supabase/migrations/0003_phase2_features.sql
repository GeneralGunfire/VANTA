-- Vanta Phase 2 feature build — consolidated schema for all four new
-- features (Debtors & Creditors, Tax Calendar, Inventory, Document Vault).
-- Run this manually in the Supabase SQL editor. NOT applied automatically
-- and NOT executed against any live database by the agent that wrote it.
--
-- Scoping convention: this app has no real Supabase auth (AuthPage.tsx is
-- a fake localStorage-only sign-in flow — `localStorage.setItem
-- ('vanta_auth_status', 'signed_in')` — it never calls Supabase auth, so
-- `auth.uid()` is always null at runtime). Therefore every table here is
-- scoped by a client-generated `anon_id text` column with an
-- `using (true)` RLS policy — exactly matching the existing `transactions`
-- table (see 0001_create_transactions.sql, and the anon_id column added
-- to it in 0002_backend_build_pass.sql, and getAnonId() in
-- supabase/functions/_shared/rateLimit.ts, and src/lib/anonId.ts for the
-- new client-side counterpart). An earlier draft of this file used
-- `auth.uid()`-based RLS; that was wrong for this app's actual runtime
-- reality and has been replaced with the anon_id convention below.

-- ════════════════════════════════════════════════════════════════════
-- Part 1: Debtors & Creditors
-- ════════════════════════════════════════════════════════════════════
create table debts (
  id uuid primary key default gen_random_uuid(),
  anon_id text not null,
  party_name text not null,
  direction text not null check (direction in ('owed_to_business', 'owed_by_business')),
  amount numeric not null,
  description text,
  status text not null default 'outstanding' check (status in ('outstanding', 'settled')),
  created_at timestamptz default now(),
  settled_at timestamptz,
  transaction_id uuid references transactions(id)
);

create index debts_anon_id_idx on debts (anon_id);

alter table debts enable row level security;

create policy "Allow anon read/write on debts" on debts
  for all using (true) with check (true);

-- ════════════════════════════════════════════════════════════════════
-- Part 2: Tax & Compliance Calendar — business profile fields
-- ════════════════════════════════════════════════════════════════════
-- No `profiles` table is actually wired into this app's active frontend
-- flow (checked src/ for onboarding/business-profile code in current use
-- — there is none; AuthPage is the fake localStorage sign-in and nothing
-- else reads/writes a profiles table). A small standalone table is
-- created instead, scoped by anon_id like everything else tonight.
create table business_profile (
  id uuid primary key default gen_random_uuid(),
  anon_id text not null unique,
  registration_status text not null default 'informal'
    check (registration_status in ('informal', 'registered_vat', 'not_yet_registered')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index business_profile_anon_id_idx on business_profile (anon_id);

alter table business_profile enable row level security;

create policy "Allow anon read/write on business_profile" on business_profile
  for all using (true) with check (true);

-- ════════════════════════════════════════════════════════════════════
-- Part 3: Simple Inventory / Stock Tracking
-- ════════════════════════════════════════════════════════════════════
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  anon_id text not null,
  item_name text not null,
  quantity numeric not null default 0,
  cost_price numeric,
  sale_price numeric,
  reorder_threshold numeric,
  updated_at timestamptz default now()
);

create index inventory_items_anon_id_idx on inventory_items (anon_id);

alter table inventory_items enable row level security;

create policy "Allow anon read/write on inventory_items" on inventory_items
  for all using (true) with check (true);

-- ════════════════════════════════════════════════════════════════════
-- Part 4: Document Vault — storage bucket + metadata table
-- ════════════════════════════════════════════════════════════════════
-- Bucket created via SQL for consolidation into this one migration file.
-- CAVEAT: creating storage buckets via raw SQL against `storage.buckets`
-- is not guaranteed to behave identically across all Supabase project
-- configurations — if this insert fails or behaves unexpectedly when run
-- tomorrow, create the bucket via the Supabase Dashboard (Storage → New
-- bucket → name "documents", private) or the Supabase CLI instead, then
-- skip just this insert statement and continue with the policies below.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage RLS: every object is expected to live under a path prefixed
-- with the caller's anon_id, i.e. `{anon_id}/{filename}` (enforced
-- client-side by DocumentsPage when it builds the upload path). Since
-- there is no real auth.uid() to check against, these policies scope by
-- bucket only — the same anon_id-as-shared-secret trust model as every
-- other table tonight, not a stronger guarantee. Anyone with the public
-- anon key and a guessed/known anon_id could in principle read or write
-- into that folder. This matches the app's existing security posture (no
-- real per-user auth exists anywhere yet); called out explicitly here
-- since file storage is more sensitive than a DB row.
create policy "Allow anon read on documents bucket" on storage.objects
  for select using (bucket_id = 'documents');

create policy "Allow anon insert on documents bucket" on storage.objects
  for insert with check (bucket_id = 'documents');

create policy "Allow anon delete on documents bucket" on storage.objects
  for delete using (bucket_id = 'documents');

-- Metadata table — used for listing/sorting/labeling instead of relying
-- solely on storage.list() (simpler to query, supports the category label).
create table documents (
  id uuid primary key default gen_random_uuid(),
  anon_id text not null,
  storage_path text not null,
  filename text not null,
  category text check (category in ('Receipt', 'Invoice', 'Other')),
  uploaded_at timestamptz default now()
);

create index documents_anon_id_idx on documents (anon_id);

alter table documents enable row level security;

create policy "Allow anon read/write on documents" on documents
  for all using (true) with check (true);
