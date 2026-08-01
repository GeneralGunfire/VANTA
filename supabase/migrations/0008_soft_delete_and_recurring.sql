-- Round 3 — soft delete/undo safety net, plus a lightweight "recurring"
-- label for transactions. Run manually in the Supabase SQL editor. NOT
-- applied automatically and NOT executed against any live database by the
-- agent that wrote it.
--
-- Soft delete: every destructive delete across transactions, debts,
-- invoices, and inventory_items now sets deleted_at instead of removing
-- the row. All existing queries on these tables must add
-- `.is('deleted_at', null)` (or the SQL equivalent) to exclude soft-deleted
-- rows — see the updated hooks in src/hooks/. A "Recently deleted" view
-- reads rows where deleted_at is set and within the last ~30 days, with a
-- Restore action that just nulls deleted_at back out. Rows older than 30
-- days simply stop appearing in that view (no automatic hard-deletion job
-- is built this pass — see final report).

alter table transactions add column deleted_at timestamptz;
alter table debts add column deleted_at timestamptz;
alter table invoices add column deleted_at timestamptz;
alter table inventory_items add column deleted_at timestamptz;

create index transactions_deleted_at_idx on transactions (deleted_at) where deleted_at is not null;
create index debts_deleted_at_idx on debts (deleted_at) where deleted_at is not null;
create index invoices_deleted_at_idx on invoices (deleted_at) where deleted_at is not null;
create index inventory_items_deleted_at_idx on inventory_items (deleted_at) where deleted_at is not null;

-- Recurring-payment labeling (Part 5) — a plain, user-facing tag applied
-- from the Chat confirmation card ("mark as recurring?"). Purely a label
-- for the owner's own reference; nothing reads this to auto-create future
-- transactions.
alter table transactions add column is_recurring boolean not null default false;
