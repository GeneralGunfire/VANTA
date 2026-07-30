-- Supplier Tracking — adds a nullable supplier_name field directly to
-- transactions rather than a separate `suppliers` table. Suppliers here
-- are purely a grouping key derived from a business's own transaction
-- history (total spent, transaction count, most recent purchase date —
-- all trivially computed by grouping transactions), not an independent
-- entity with its own fields (contact info, etc. were not asked for). A
-- separate table would just be a redundant, sync-prone cache of numbers
-- already derivable from transactions. Not every transaction has a
-- supplier, so this is nullable, not required.
--
-- Run this manually in the Supabase SQL editor. NOT applied automatically
-- and NOT executed against any live database by the agent that wrote it.
alter table transactions add column supplier_name text;

create index transactions_supplier_name_idx on transactions (supplier_name) where supplier_name is not null;

-- Business Timeline (Part 2) needs to know when an inventory item was
-- FIRST added, to show a "new item added" timeline entry — inventory_items
-- only ever tracked updated_at (which changes on every edit, not just
-- creation), so there was no reliable "first added" date to read.
-- Backfilled to updated_at for any existing rows (best available proxy —
-- if a row has never been edited, updated_at already equals its creation
-- time; existing edited rows will show a slightly-late "first added" date,
-- an acceptable one-time approximation for pre-existing data).
alter table inventory_items add column created_at timestamptz default now();
update inventory_items set created_at = updated_at where created_at is null;
